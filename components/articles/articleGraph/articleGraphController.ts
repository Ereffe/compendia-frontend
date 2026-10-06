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

export const mergeGraphs = (previous: GraphResponse | null, incoming: GraphResponse | null): GraphResponse => {
    const nodes = new Map<string, GraphNode>();
    for (const node of [...(previous?.scienceArticleGraph.nodes ?? []), ...(incoming?.scienceArticleGraph.nodes ?? [])]) {
        nodes.set(toNodeId(node.doi), node);
    }

    const edges = new Map<string, GraphEdge>();
    for (const edge of [...(previous?.scienceArticleGraph.edges ?? []), ...(incoming?.scienceArticleGraph.edges ?? [])]) {
        edges.set(`${toNodeId(edge.first)}|${toNodeId(edge.second)}`, edge);
    }

    return { scienceArticleGraph: { nodes: [...nodes.values()], edges: [...edges.values()] } };
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
            kind: id === rootId ? "root" : "cited",
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
