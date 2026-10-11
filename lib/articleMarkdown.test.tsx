import { render, screen } from "@testing-library/react";
import Markdown from "react-markdown";
import { describe, expect, it } from "vitest";

import {
    articleRehypePlugins,
    articleRemarkPlugins,
    articleUrlTransform,
    rehypeArticleSections,
    type ArticleSection,
} from "./articleContent";

const renderArticle = (markdown: string) =>
    render(
        <Markdown remarkPlugins={articleRemarkPlugins} rehypePlugins={articleRehypePlugins} urlTransform={articleUrlTransform}>
            {markdown}
        </Markdown>,
    );

describe("article markdown", () => {
    it("renders GitHub-flavored tables, strikethrough and task lists", () => {
        renderArticle("| Dawka | Wynik |\n| --- | --- |\n| 50 μg | 67% |\n\n~~stare~~\n\n- [x] zrobione");

        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Dawka" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "67%" })).toBeInTheDocument();
        expect(screen.getByText("stare").tagName).toBe("DEL");
        expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("renders inline and block LaTeX with KaTeX", () => {
        const { container } = renderArticle(String.raw`Energia $E = mc^2$ w tekście.

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$`);

        expect(container.querySelectorAll(".katex")).toHaveLength(2);
        expect(container.querySelectorAll(".katex-display")).toHaveLength(1);
        expect(container.querySelector("annotation")?.textContent).toBe("E = mc^2");
    });

    it("shows invalid LaTeX as an error instead of breaking the page", () => {
        const { container } = renderArticle(String.raw`Zły wzór $\frac{1}{$ i dalej tekst.`);

        expect(container.textContent).toContain("i dalej tekst.");
        expect(container.querySelector(".katex-error")).not.toBeNull();
    });

    it("gives each section heading a unique id and lists it for the contents", () => {
        const sections: ArticleSection[] = [];
        render(
            <Markdown rehypePlugins={[[rehypeArticleSections, sections]]}>
                {"## Wstęp i **cel**\n\n### Szczegóły\n\n## Wstęp i cel\n\n## Łódź"}
            </Markdown>,
        );

        expect(sections).toEqual([
            { id: "section-wstep-i-cel", title: "Wstęp i cel" },
            { id: "section-wstep-i-cel-2", title: "Wstęp i cel" },
            { id: "section-łodz", title: "Łódź" },
        ]);
        expect(screen.getByRole("heading", { name: "Łódź" })).toHaveAttribute("id", "section-łodz");
    });
});
