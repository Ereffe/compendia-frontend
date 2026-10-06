import { describe, expect, it } from "vitest";

import type { ArticleSearchItem } from "@/types/articles";

import { articleFiltersHref, parseArticleFilters, rankArticles } from "./articleFilters";

const article = (id: string, positive: number, negative: number, datePosted = "2026-01-01T00:00:00"): ArticleSearchItem => ({
    id,
    title: id,
    commentCount: null,
    datePosted,
    author: null,
    content: "",
    complexity: "SIMPLE",
    rating: { positive, negative },
});

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

describe("rankArticles", () => {
    const articles = [
        article("unrated", 0, 0),
        article("controversial", 5, 5),
        article("liked", 4, 0),
        article("tied-older", 3, 1, "2025-01-01T00:00:00"),
        article("tied-newer", 3, 1, "2026-02-01T00:00:00"),
    ];

    it("orders by score for top, skipping unrated articles", () => {
        expect(rankArticles(articles, "top").map((a) => a.id)).toEqual([
            "liked",
            "tied-newer",
            "tied-older",
            "controversial",
        ]);
    });

    it("orders by number of ratings for mostRated", () => {
        expect(rankArticles(articles, "mostRated").map((a) => a.id)).toEqual([
            "controversial",
            "liked",
            "tied-newer",
            "tied-older",
        ]);
    });
});
