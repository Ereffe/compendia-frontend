import { describe, expect, it } from "vitest";

import { markdownToPlainText, toExcerpt } from "./excerpt";

describe("markdownToPlainText", () => {
    it("strips markdown syntax and keeps the readable text", () => {
        const markdown = [
            "# Grafy",
            "",
            "To **ważny** temat z _kursu_ i `kodem`.",
            "- [link](https://example.com) do źródła",
            "> cytat",
            "![obrazek](a.png)",
            "```ts",
            "const x = 1;",
            "```",
            "1. Koniec",
        ].join("\n");

        expect(markdownToPlainText(markdown)).toBe("Grafy To ważny temat z kursu i kodem. link do źródła cytat Koniec");
    });

    it("keeps lone symbols that are not formatting", () => {
        expect(markdownToPlainText("2 * 3 = 6 and snake_case")).toBe("2 * 3 = 6 and snake_case");
    });
});

describe("toExcerpt", () => {
    it("returns short text unchanged", () => {
        expect(toExcerpt("Krótki tekst.", 50)).toBe("Krótki tekst.");
    });

    it("cuts long text at a word boundary and adds an ellipsis", () => {
        expect(toExcerpt("Jeden dwa trzy cztery pięć sześć", 20)).toBe("Jeden dwa trzy…");
    });

    it("drops block formulas, which read as noise in a card", () => {
        expect(toExcerpt(String.raw`Całka $$\int_0^1 x \, dx$$ wynosi $\frac{1}{2}$.`)).toBe(String.raw`Całka wynosi $\frac{1}{2}$.`);
    });

    it("drops headings so a section title doesn't run into the first sentence", () => {
        expect(toExcerpt("## Wprowadzenie\n\nW typowym przypadku.")).toBe("W typowym przypadku.");
    });
});
