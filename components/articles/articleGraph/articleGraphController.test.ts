import { describe, expect, it } from "vitest";

import {
    buildGraphElements,
    getGraphStats,
    buildCitationGraph,
    type DoiRecord,
    normalizeDoi,
    normalizeGraph,
    pickNextLookup,
    MAX_DOI_LOOKUPS,
    MAX_PAPERS_PER_DEPTH,
    toNodeId,
    type CytoscapeNodeData,
    type GraphResponse,
} from "./articleGraphController";

const graph = (nodes: string[], edges: Array<[string, string]>): GraphResponse => ({
    scienceArticleGraph: {
        nodes: nodes.map((doi) => ({ doi, title: `Title ${doi}`, authors: [] })),
        edges: edges.map(([first, second]) => ({ first, second })),
    },
});

const nodeData = (elements: ReturnType<typeof buildGraphElements>) =>
    elements.filter((element) => !("source" in element.data)).map((element) => element.data as CytoscapeNodeData);

describe("buildGraphElements", () => {
    it("labels nodes with titles, marks the root and synthesizes missing nodes for unresolved DOIs", () => {
        const nodes = nodeData(buildGraphElements(graph(["10.1/a"], [["10.1/a", "10.1/b"]]), "10.1/a"));

        expect(nodes).toHaveLength(2);
        expect(nodes[0]).toMatchObject({ doi: "10.1/a", label: "Title 10.1/a", kind: "root", depth: 0 });
        expect(nodes[1]).toMatchObject({ doi: "10.1/b", kind: "missing", title: null, depth: 1 });
    });

    it("computes citation depth from the root", () => {
        const nodes = nodeData(
            buildGraphElements(graph(["10.1/a", "10.1/b", "10.1/c"], [["10.1/a", "10.1/b"], ["10.1/b", "10.1/c"]]), "10.1/a"),
        );

        expect(Object.fromEntries(nodes.map((node) => [node.doi, node.depth]))).toEqual({ "10.1/a": 0, "10.1/b": 1, "10.1/c": 2 });
    });

    it("puts nodes the root can't reach on the outermost ring", () => {
        const nodes = nodeData(
            buildGraphElements(graph(["10.1/a", "10.1/b", "10.1/x", "10.1/y"], [["10.1/a", "10.1/b"], ["10.1/x", "10.1/y"]]), "10.1/a"),
        );

        expect(nodes.find((node) => node.doi === "10.1/x")?.depth).toBe(2);
        expect(nodes.find((node) => node.doi === "10.1/y")?.depth).toBe(2);
    });

    it("drops self-loops and duplicate edges (DOIs are case-insensitive)", () => {
        const elements = buildGraphElements(
            graph(["10.1/a", "10.1/b"], [["10.1/a", "10.1/a"], ["10.1/a", "10.1/b"], ["10.1/A", "10.1/b"]]),
            "10.1/a",
        );

        expect(elements.filter((element) => "source" in element.data)).toHaveLength(1);
    });
});

describe("getGraphStats", () => {
    it("counts papers, links, missing metadata and depth", () => {
        const elements = buildGraphElements(graph(["10.1/a", "10.1/b"], [["10.1/a", "10.1/b"], ["10.1/b", "10.1/c"]]), "10.1/a");

        expect(getGraphStats(elements)).toEqual({ papers: 3, links: 2, missing: 1, maxDepth: 2 });
    });
});

describe("normalizeDoi", () => {
    it.each([
        ["/10.5194/bg-2016-527,", "10.5194/bg-2016-527"],
        ["https://doi.org//10.5194/bg-2016-527,", "10.5194/bg-2016-527"],
        ["doi:10.1038/ncomms6752.", "10.1038/ncomms6752"],
        ["10.1016/S1364-6826(00)00209-1,", "10.1016/S1364-6826(00)00209-1"],
        ["10.1016/S1364-6826(00)00209-1),", "10.1016/S1364-6826(00)00209-1"],
        ["10.5194/acp-18-1-2018", "10.5194/acp-18-1-2018"],
    ])("cleans %s", (raw, expected) => {
        expect(normalizeDoi(raw)).toBe(expected);
    });
});

describe("normalizeGraph", () => {
    it("cleans DOIs in nodes and edges and drops titles that are just the raw DOI", () => {
        const normalized = normalizeGraph({
            scienceArticleGraph: {
                nodes: [
                    { doi: "10.1/a", title: "Paper A", url: "https://freedoi.org/10.1/a" },
                    { doi: "/10.1/b,", title: "/10.1/b,", url: "https://freedoi.org//10.1/b," },
                ],
                edges: [{ first: "10.1/a", second: "/10.1/b," }],
            },
        });

        expect(normalized?.scienceArticleGraph.nodes).toEqual([
            { doi: "10.1/a", title: "Paper A", url: "https://doi.org/10.1/a" },
            { doi: "10.1/b", title: null, url: "https://doi.org/10.1/b" },
        ]);
        expect(normalized?.scienceArticleGraph.edges).toEqual([{ first: "10.1/a", second: "10.1/b" }]);

        const nodes = nodeData(buildGraphElements(normalized, "10.1/a"));
        expect(nodes.find((node) => node.doi === "10.1/b")?.kind).toBe("missing");
    });
});


const records = (entries: Record<string, string[] | null>): Map<string, DoiRecord> =>
    new Map(
        Object.entries(entries).map(([doi, references]) => [
            toNodeId(doi),
            { node: references ? { doi, title: `Title ${doi}` } : null, references: references ?? [] },
        ]),
    );

const nodeDois = (graph: GraphResponse) => graph.scienceArticleGraph.nodes.map((node) => node.doi);
const edgePairs = (graph: GraphResponse) => graph.scienceArticleGraph.edges.map((edge) => `${edge.first}>${edge.second}`);

describe("buildCitationGraph", () => {
    it("shows only the root until its record is loaded", () => {
        const { graph, shownDepth, waiting } = buildCitationGraph("10.1/a", new Map(), 2);

        expect(nodeDois(graph)).toEqual(["10.1/a"]);
        expect(graph.scienceArticleGraph.edges).toEqual([]);
        expect({ shownDepth, waiting }).toEqual({ shownDepth: 0, waiting: true });
    });

    it("adds a depth only once every paper of the previous depth is loaded", () => {
        const partial = buildCitationGraph("10.1/a", records({ "10.1/a": ["10.1/b", "10.1/c"], "10.1/b": ["10.1/d"] }), 2);
        expect(edgePairs(partial.graph)).toEqual(["10.1/a>10.1/b", "10.1/a>10.1/c"]);
        expect({ shownDepth: partial.shownDepth, waiting: partial.waiting }).toEqual({ shownDepth: 1, waiting: true });

        const full = buildCitationGraph("10.1/a", records({ "10.1/a": ["10.1/b", "10.1/c"], "10.1/b": ["10.1/d"], "10.1/c": [] }), 2);
        expect(edgePairs(full.graph)).toEqual(["10.1/a>10.1/b", "10.1/a>10.1/c", "10.1/b>10.1/d"]);
        expect({ shownDepth: full.shownDepth, waiting: full.waiting }).toEqual({ shownDepth: 2, waiting: false });
    });

    it("stops at the chosen depth, links shown papers to each other and treats DOIs case-insensitively", () => {
        const { graph } = buildCitationGraph("10.1/a", records({ "10.1/a": ["10.1/B"], "10.1/b": ["10.1/A", "10.1/c"] }), 1);

        expect(edgePairs(graph)).toEqual(["10.1/a>10.1/B", "10.1/B>10.1/a"]);
        expect(nodeDois(graph)).toEqual(["10.1/a", "10.1/B"]);
    });

    it("keeps only the most-cited papers below the first depth", () => {
        const level1 = Array.from({ length: MAX_PAPERS_PER_DEPTH + 5 }, (_, i) => `10.2/${i}`);
        const loaded = records({
            "10.1/a": level1,
            ...Object.fromEntries(level1.map((doi, i) => [doi, ["10.3/shared", `10.3/only-${i}`]])),
        });
        const { graph, hidden } = buildCitationGraph("10.1/a", loaded, 2);
        const depth2 = [...new Set(graph.scienceArticleGraph.edges.map((edge) => edge.second))].filter((doi) => doi.startsWith("10.3/"));

        expect(nodeDois(graph).filter((doi) => doi.startsWith("10.2/"))).toHaveLength(MAX_PAPERS_PER_DEPTH + 5);
        expect(depth2).toHaveLength(MAX_PAPERS_PER_DEPTH);
        expect(depth2[0]).toBe("10.3/shared");
        expect(hidden).toBe(6);
    });

    it("shows the references of expanded papers beyond the chosen depth", () => {
        const loaded = records({ "10.1/a": ["10.1/b"], "10.1/b": ["10.1/c"] });
        const { graph } = buildCitationGraph("10.1/a", loaded, 1, new Set([toNodeId("10.1/b")]));

        expect(edgePairs(graph)).toEqual(["10.1/a>10.1/b", "10.1/b>10.1/c"]);
    });

    it("uses the backend's titles for papers Crossref doesn't know", () => {
        const loaded = new Map<string, DoiRecord>([[toNodeId("10.1/a"), { node: null, references: ["10.1/b"] }]]);
        const fallback = new Map([[toNodeId("10.1/b"), { doi: "10.1/b", title: "From backend" }]]);
        const { graph } = buildCitationGraph("10.1/a", loaded, 1, new Set(), fallback);

        expect(graph.scienceArticleGraph.nodes).toEqual([
            { doi: "10.1/a", title: null },
            { doi: "10.1/b", title: "From backend" },
        ]);
    });
});

describe("pickNextLookup", () => {
    const loaded = records({ "10.1/a": ["10.1/b", "10.1/c"] });
    const elements = buildGraphElements(buildCitationGraph("10.1/a", loaded, 2).graph, "10.1/a");

    it("starts with the root", () => {
        const empty = buildGraphElements(buildCitationGraph("10.1/a", new Map(), 2).graph, "10.1/a");
        expect(pickNextLookup(empty, new Map(), null)).toBe("10.1/a");
    });

    it("picks the closest paper that isn't loaded, or the selected one first", () => {
        expect(pickNextLookup(elements, loaded, null)).toBe("10.1/b");
        expect(pickNextLookup(elements, loaded, toNodeId("10.1/c"))).toBe("10.1/c");
    });

    it("stops after the lookup limit", () => {
        const many = new Map(Array.from({ length: MAX_DOI_LOOKUPS }, (_, i) => [`x${i}`, { node: null, references: [] }]));
        expect(pickNextLookup(elements, many, null)).toBeNull();
    });
});
