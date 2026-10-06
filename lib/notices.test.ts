import { describe, expect, it } from "vitest";

import { isNotice, withNotice, withoutNotice } from "./notices";

describe("notices", () => {
    it("adds a notice to a redirect path", () => {
        expect(withNotice("/articles/abc", "articleCreated")).toBe("/articles/abc?notice=articleCreated");
    });

    it("accepts only known notices", () => {
        expect(isNotice("articleDeleted")).toBe(true);
        expect(isNotice("<script>")).toBe(false);
        expect(isNotice(null)).toBe(false);
    });

    it("removes the notice and keeps other query params", () => {
        expect(withoutNotice("/articles", "?notice=articleDeleted")).toBe("/articles");
        expect(withoutNotice("/articles", "?sort=top&notice=articleDeleted&level=SIMPLE")).toBe("/articles?sort=top&level=SIMPLE");
    });
});
