import { describe, expect, it } from "vitest";

import { buildGraphElements, getGraphStats, mergeGraphs, type CytoscapeNodeData, type GraphResponse } from "./articleGraphController";

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

describe("mergeGraphs", () => {
    it("unions nodes and edges", () => {
        const merged = mergeGraphs(graph(["10.1/a"], [["10.1/a", "10.1/b"]]), graph(["10.1/b"], [["10.1/a", "10.1/b"], ["10.1/b", "10.1/c"]]));

        expect(merged.scienceArticleGraph.nodes.map((node) => node.doi)).toEqual(["10.1/a", "10.1/b"]);
        expect(merged.scienceArticleGraph.edges).toHaveLength(2);
    });
});
