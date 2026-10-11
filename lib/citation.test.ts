import { describe, expect, it } from "vitest";

import { apaCitation, bibtexCitation } from "./citation";

const parts = {
    id: "0b6f3c1e-2f4a-4c8e-9d1a-5e7b8c9d0a1b",
    author: "Jan Kowalski",
    title: "Kwanty & 50% efektu",
    date: "2026, 10 października",
    year: "2026",
    url: "https://compendia.example/articles/0b6f3c1e-2f4a-4c8e-9d1a-5e7b8c9d0a1b",
};

describe("citations", () => {
    it("formats APA with the author, date, title and URL", () => {
        expect(apaCitation(parts)).toBe(
            "Jan Kowalski. (2026, 10 października). Kwanty & 50% efektu. Compendia. https://compendia.example/articles/0b6f3c1e-2f4a-4c8e-9d1a-5e7b8c9d0a1b",
        );
        expect(apaCitation({ ...parts, author: null })).toMatch(/^\(2026/);
    });

    it("escapes BibTeX special characters and skips a missing author", () => {
        const bibtex = bibtexCitation(parts);
        expect(bibtex).toContain("@misc{compendia-0b6f3c1e,");
        expect(bibtex).toContain(String.raw`title = {{Kwanty \& 50\% efektu}},`);
        expect(bibtexCitation({ ...parts, author: null })).not.toContain("author");
    });
});
