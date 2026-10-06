import { describe, expect, it } from "vitest";

import { isValidArticleId } from "./articleId";

describe("isValidArticleId", () => {
    it.each(["q2wfWe", "ZZZZZZ", "abc123"])("accepts %j", (id) => {
        expect(isValidArticleId(id)).toBe(true);
    });

    it.each(["", "abc12", "abc1234", "zzzzzz-missing", "abc-12", "ąbc123"])("rejects %j", (id) => {
        expect(isValidArticleId(id)).toBe(false);
    });
});
