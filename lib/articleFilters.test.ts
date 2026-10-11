import { describe, expect, it } from "vitest";

import { articleFiltersHref, parseArticleFilters } from "./articleFilters";

describe("parseArticleFilters", () => {
    it("defaults to newest without a level", () => {
        expect(parseArticleFilters({})).toEqual({ sort: "newest", level: null });
    });

    it("accepts known values and ignores the rest", () => {
        expect(parseArticleFilters({ sort: "top", level: "complex" })).toEqual({ sort: "top", level: "COMPLEX" });
        expect(parseArticleFilters({ sort: ["mostRated", "top"], level: "HARD" })).toEqual({ sort: "mostRated", level: null });
        expect(parseArticleFilters({ sort: "rating" }).sort).toBe("newest");
    });
});

describe("articleFiltersHref", () => {
    it("leaves defaults out of the URL", () => {
        expect(articleFiltersHref({ sort: "newest", level: null })).toBe("/articles");
        expect(articleFiltersHref({ sort: "top", level: "SIMPLE" })).toBe("/articles?sort=top&level=SIMPLE");
        expect(articleFiltersHref({ sort: "newest", level: "COMPLEX" })).toBe("/articles?level=COMPLEX");
    });
});
