import { describe, expect, it } from "vitest";

import { cslToGraphNode, cslToRecord } from "./doiMetadata";

describe("cslToGraphNode", () => {
    it("maps CSL-JSON from doi.org to a graph node", () => {
        const node = cslToGraphNode("10.1/a", {
            title: "‘Structure-from-Motion’ <i>photogrammetry</i>",
            author: [{ given: "M.J.", family: "Westoby" }, { literal: "SfM Consortium" }, {}],
            abstract: "<jats:p>Short   abstract.</jats:p>",
        });

        expect(node).toEqual({
            doi: "10.1/a",
            title: "‘Structure-from-Motion’ photogrammetry",
            authors: ["Westoby, M.J.", "SfM Consortium"],
            description: "Short abstract.",
            url: "https://doi.org/10.1/a",
        });
    });

    it("takes the first title from DataCite-style arrays and rejects items without a title", () => {
        expect(cslToGraphNode("10.1/b", { title: ["Attention Is All You Need"] })?.title).toBe("Attention Is All You Need");
        expect(cslToGraphNode("10.1/c", { author: [{ family: "X" }] })).toBeNull();
    });
});

describe("cslToRecord", () => {
    it("keeps unique, cleaned reference DOIs and drops self-citations", () => {
        const record = cslToRecord("10.1/a", {
            title: "Paper",
            reference: [{ DOI: "10.1/B" }, { DOI: "10.1/b." }, {}, { DOI: "https://doi.org/10.1/c" }, { DOI: "10.1/A" }],
        });

        expect(record.node?.title).toBe("Paper");
        expect(record.references).toEqual(["10.1/b", "10.1/c"]);
    });
});
