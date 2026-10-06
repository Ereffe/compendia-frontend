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
});
