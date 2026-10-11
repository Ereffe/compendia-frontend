export interface GraphNode {
    doi: string;
    title?: string | null;
    description?: string | null;
    authors?: string[] | null;
    url?: string | null;
}

export interface GraphEdge {
    first: string;
    second: string;
}

export interface GraphResponse {
    scienceArticleGraph: {
        nodes: GraphNode[];
        edges: GraphEdge[];
    };
}

export type NodeKind = "root" | "cited" | "missing";

export interface CytoscapeNodeData {
    id: string;
    doi: string;
    label: string;
    title: string | null;
    url: string | null;
    authors: string[];
    kind: NodeKind;
    depth: number;
}

type CytoscapeElement = { data: CytoscapeNodeData } | { data: { id: string; source: string; target: string } };

export interface GraphStats {
    papers: number;
    links: number;
    missing: number;
    maxDepth: number;
}

const LABEL_MAX_LENGTH = 48;

const shorten = (value: string) =>
    value.length > LABEL_MAX_LENGTH ? `${value.slice(0, LABEL_MAX_LENGTH - 1)}…` : value;

export const toNodeId = (doi: string) => encodeURIComponent(doi.toLowerCase());

const DOI_PREFIX = /^(?:doi:|https?:\/\/(?:dx\.)?doi\.org|https?:\/\/freedoi\.org)/i;
const TRAILING_JUNK = ".,;:/";

const countOf = (text: string, char: string) => text.split(char).length - 1;

const isTrailingJunk = (doi: string) => {
    const last = doi.at(-1) ?? "";
    return TRAILING_JUNK.includes(last) || (last === ")" && countOf(doi, ")") > countOf(doi, "("));
};

export const normalizeDoi = (raw: string): string => {
    let doi = raw.trim().replace(DOI_PREFIX, "").trim();
    let start = 0;
    while (doi[start] === "/") start++;
    doi = doi.slice(start);
    while (doi && isTrailingJunk(doi)) doi = doi.slice(0, -1);
    return doi;
};

const nodeKind = (id: string, rootId: string, title: string | null | undefined): NodeKind => {
    if (id === rootId) return "root";
    return title ? "cited" : "missing";
};

export const normalizeGraph = (data: GraphResponse | null): GraphResponse | null => {
    if (!data) return null;
    const nodes = data.scienceArticleGraph.nodes.map((node) => {
        const doi = normalizeDoi(node.doi);
        const title = node.title?.trim();
        const hasTitle = Boolean(title) && title !== node.doi.trim() && normalizeDoi(title ?? "") !== doi;
        return { ...node, doi, title: hasTitle ? title : null, url: `https://doi.org/${doi}` };
    });
    const edges = data.scienceArticleGraph.edges.map((edge) => ({ first: normalizeDoi(edge.first), second: normalizeDoi(edge.second) }));
    return { scienceArticleGraph: { nodes, edges } };
};

export interface DoiRecord {
    node: GraphNode | null;
    references: string[];
}

export interface CitationGraph {
    graph: GraphResponse;
    shownDepth: number;
    waiting: boolean;
    hidden: number;
}

export const MAX_PAPERS_PER_DEPTH = 40;

export const buildCitationGraph = (
    rootDoi: string,
    records: ReadonlyMap<string, DoiRecord>,
    level: number,
    expanded: ReadonlySet<string> = new Set(),
    fallbackNodes: ReadonlyMap<string, GraphNode> = new Map(),
): CitationGraph => {
    const rootId = toNodeId(rootDoi);
    const dois = new Map<string, string>([[rootId, rootDoi]]);
    const referencesOf = (id: string) => records.get(id)?.references ?? [];
    let hidden = 0;

    const addMostCited = (sources: string[], limit: number): string[] => {
        const candidates = new Map<string, { doi: string; citedBy: number }>();
        for (const reference of sources.flatMap(referencesOf)) {
            const referenceId = toNodeId(reference);
            if (dois.has(referenceId)) continue;
            const candidate = candidates.get(referenceId);
            if (candidate) candidate.citedBy++;
            else candidates.set(referenceId, { doi: reference, citedBy: 1 });
        }
        const picked = [...candidates].sort(([, a], [, b]) => b.citedBy - a.citedBy).slice(0, limit);
        hidden += candidates.size - picked.length;
        for (const [id, { doi }] of picked) dois.set(id, doi);
        return picked.map(([id]) => id);
    };

    let layer = [rootId];
    let shownDepth = 0;
    let waiting = false;
    while (shownDepth < level) {
        if (layer.some((id) => !records.has(id))) {
            waiting = true;
            break;
        }
        const next = addMostCited(layer, shownDepth === 0 ? Infinity : MAX_PAPERS_PER_DEPTH);
        if (next.length === 0) break;
        layer = next;
        shownDepth++;
    }

    const toExpand = [...expanded].filter((id) => dois.has(id));
    const visited = new Set<string>();
    while (toExpand.length > 0) {
        const id = toExpand.shift() as string;
        if (visited.has(id)) continue;
        visited.add(id);
        toExpand.push(...addMostCited([id], MAX_PAPERS_PER_DEPTH).filter((added) => expanded.has(added)));
    }

    const edges = [...dois].flatMap(([id, doi]) =>
        referencesOf(id).flatMap((reference): GraphEdge[] => {
            const target = dois.get(toNodeId(reference));
            return target && toNodeId(reference) !== id ? [{ first: doi, second: target }] : [];
        }),
    );

    const nodes = [...dois].flatMap(([id, doi]): GraphNode[] => {
        const node = records.get(id)?.node ?? fallbackNodes.get(id);
        if (node) return [{ ...node, doi }];
        return id === rootId ? [{ doi, title: null }] : [];
    });

    return { graph: { scienceArticleGraph: { nodes, edges } }, shownDepth, waiting, hidden };
};

const computeDepths = (rootId: string, adjacency: Map<string, string[]>): Map<string, number> => {
    const depths = new Map<string, number>([[rootId, 0]]);
    const queue = [rootId];
    while (queue.length > 0) {
        const current = queue.shift() as string;
        for (const next of adjacency.get(current) ?? []) {
            if (!depths.has(next)) {
                depths.set(next, (depths.get(current) ?? 0) + 1);
                queue.push(next);
            }
        }
    }
    return depths;
};

export const buildGraphElements = (data: GraphResponse | null, rootDoi: string): CytoscapeElement[] => {
    const nodes = data?.scienceArticleGraph.nodes ?? [];
    const edges = data?.scienceArticleGraph.edges ?? [];
    const rootId = toNodeId(rootDoi);

    const nodeData = new Map<string, Omit<CytoscapeNodeData, "depth">>();
    for (const node of nodes) {
        const id = toNodeId(node.doi);
        nodeData.set(id, {
            id,
            doi: node.doi,
            label: shorten(node.title || node.doi),
            title: node.title || null,
            url: node.url ?? null,
            authors: node.authors ?? [],
            kind: nodeKind(id, rootId, node.title),
        });
    }

    const adjacency = new Map<string, string[]>();
    const edgeElements = new Map<string, CytoscapeElement>();
    for (const edge of edges) {
        const source = toNodeId(edge.first);
        const target = toNodeId(edge.second);
        if (source === target) continue;

        for (const [id, doi] of [[source, edge.first], [target, edge.second]] as const) {
            if (!nodeData.has(id)) {
                nodeData.set(id, { id, doi, label: shorten(doi), title: null, url: null, authors: [], kind: "missing" });
            }
        }

        const edgeId = `${source}->${target}`;
        if (!edgeElements.has(edgeId)) {
            edgeElements.set(edgeId, { data: { id: edgeId, source, target } });
            adjacency.set(source, [...(adjacency.get(source) ?? []), target]);
        }
    }

    const depths = computeDepths(rootId, adjacency);
    const maxReachable = Math.max(0, ...depths.values());

    const nodeElements = [...nodeData.values()].map((node) => ({
        data: { ...node, depth: depths.get(node.id) ?? maxReachable + 1 },
    }));

    return [...nodeElements, ...edgeElements.values()];
};

export const MAX_DOI_LOOKUPS = 600;

export const pickNextLookup = (
    elements: CytoscapeElement[],
    records: ReadonlyMap<string, DoiRecord>,
    selectedId: string | null,
): string | null => {
    if (records.size >= MAX_DOI_LOOKUPS) return null;
    const pending = elements
        .flatMap((element) => ("source" in element.data ? [] : [element.data]))
        .filter((node) => !records.has(node.id))
        .sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId) || a.depth - b.depth);
    return pending[0]?.doi ?? null;
};

export const getGraphStats = (elements: CytoscapeElement[]): GraphStats => {
    let papers = 0;
    let links = 0;
    let missing = 0;
    let maxDepth = 0;
    for (const element of elements) {
        if ("source" in element.data) {
            links++;
        } else {
            papers++;
            if (element.data.kind === "missing") missing++;
            maxDepth = Math.max(maxDepth, element.data.depth);
        }
    }
    return { papers, links, missing, maxDepth };
};

const RING_NODE_SPACING = 22;
const MIN_RING_GAP = 90;
const ORDERING_SWEEPS = 3;

const circularMean = (angles: number[]): number | null => {
    const x = angles.reduce((sum, angle) => sum + Math.cos(angle), 0);
    const y = angles.reduce((sum, angle) => sum + Math.sin(angle), 0);
    return Math.hypot(x, y) < 1e-9 ? null : Math.atan2(y, x);
};

const indexElements = (elements: CytoscapeElement[]) => {
    const rings = new Map<number, string[]>();
    const depthOf = new Map<string, number>();
    const neighbours = new Map<string, string[]>();
    for (const element of elements) {
        if ("source" in element.data) {
            const { source, target } = element.data;
            neighbours.set(source, [...(neighbours.get(source) ?? []), target]);
            neighbours.set(target, [...(neighbours.get(target) ?? []), source]);
        } else {
            depthOf.set(element.data.id, element.data.depth);
            rings.set(element.data.depth, [...(rings.get(element.data.depth) ?? []), element.data.id]);
        }
    }
    return { rings, depthOf, neighbours };
};

// Rings by depth; each ring is ordered by the mean angle of its neighbours on the adjacent ring so edges stay short.
export const radialPositions = (elements: CytoscapeElement[]): Map<string, { x: number; y: number }> => {
    const { rings, depthOf, neighbours } = indexElements(elements);

    const depths = [...rings.keys()].filter((depth) => depth > 0).sort((a, b) => a - b);
    const angle = new Map<string, number>();
    for (const depth of depths) {
        rings.get(depth)!.forEach((id, i, ring) => angle.set(id, (2 * Math.PI * i) / ring.length - Math.PI / 2));
    }

    const reorder = (depth: number, towards: number) => {
        const ring = rings.get(depth)!;
        const step = (2 * Math.PI) / ring.length;
        const wanted = new Map(
            ring.map((id) => {
                const near = (neighbours.get(id) ?? []).filter((other) => depthOf.get(other) === towards);
                return [id, circularMean(near.map((other) => angle.get(other) ?? -Math.PI / 2)) ?? angle.get(id)!];
            }),
        );
        ring.sort((a, b) => wanted.get(a)! - wanted.get(b)!);
        const offset = circularMean(ring.map((id, i) => wanted.get(id)! - i * step)) ?? 0;
        ring.forEach((id, i) => angle.set(id, offset + i * step));
    };

    for (let sweep = 0; sweep < ORDERING_SWEEPS; sweep++) {
        const order = sweep % 2 === 0 ? depths.slice(1) : depths.slice(0, -1).reverse();
        for (const depth of order) reorder(depth, sweep % 2 === 0 ? depth - 1 : depth + 1);
    }

    const gap = Math.max(MIN_RING_GAP, ...depths.map((depth) => (rings.get(depth)!.length * RING_NODE_SPACING) / (2 * Math.PI * depth)));
    const positions = new Map<string, { x: number; y: number }>();
    for (const id of rings.get(0) ?? []) positions.set(id, { x: 0, y: 0 });
    for (const depth of depths) {
        for (const id of rings.get(depth)!) {
            positions.set(id, { x: Math.cos(angle.get(id)!) * gap * depth, y: Math.sin(angle.get(id)!) * gap * depth });
        }
    }
    return positions;
};
