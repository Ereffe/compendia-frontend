import { describe, expect, it } from "vitest";

import { articleImages, articleUrlTransform, cleanArticleMarkdown } from "./articleContent";

const ASSET_ID = "0b6f3c1e-2f4a-4c8e-9d1a-5e7b8c9d0a1b";

describe("articleUrlTransform", () => {
    it("routes backend asset links through the image proxy", () => {
        expect(articleUrlTransform(`/api/v1/articles/assets/${ASSET_ID}`)).toBe(`/api/assets/${ASSET_ID}`);
    });

    it("leaves other links alone and still blocks unsafe ones", () => {
        expect(articleUrlTransform("https://example.com/a.png")).toBe("https://example.com/a.png");
        expect(articleUrlTransform("/api/v1/articles/assets/../../secret")).toBe("/api/v1/articles/assets/../../secret");
        expect(articleUrlTransform("javascript:alert(1)")).toBe("");
    });
});

describe("cleanArticleMarkdown", () => {
    it("removes the model's preamble and the separator after it", () => {
        expect(cleanArticleMarkdown("Sure, here is the document page in markdown format:\n\n---\n\n# Food & Function\n\nText")).toBe(
            "# Food & Function\n\nText",
        );
        expect(cleanArticleMarkdown("Here's the page converted to Markdown:\n# Title")).toBe("# Title");
    });

    it("unwraps a document that is one markdown code block", () => {
        expect(cleanArticleMarkdown("Certainly! Here is the markdown:\n```markdown\n# Title\n\n- item\n```\n")).toBe("# Title\n\n- item");
    });

    it("keeps ordinary writing", () => {
        const article = "Here is an example:\n\n```markdown\n# Heading\n```\n\nAnd more text.";
        expect(cleanArticleMarkdown(article)).toBe(article);
        expect(cleanArticleMarkdown("Sure, it works.\n\nText")).toBe("Sure, it works.\n\nText");
    });
});

describe("articleImages", () => {
    it("lists each uploaded image once, named by its alt text", () => {
        const other = "1c2d3e4f-0000-4000-8000-000000000001";
        const markdown = [
            `![Wykres](/api/v1/articles/assets/${ASSET_ID})`,
            `![](/api/v1/articles/assets/${other})`,
            `![copy](/api/v1/articles/assets/${ASSET_ID.toUpperCase()})`,
            "![external](https://example.com/a.png)",
        ].join("\n");

        expect(articleImages(markdown)).toEqual([
            { id: ASSET_ID, name: "Wykres" },
            { id: other, name: "image" },
        ]);
    });
});
