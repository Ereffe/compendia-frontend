import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";
import type { ArticleSearchItem } from "@/types/articles";

import ArticleCard from "./articleCard";

afterEach(cleanup);

const article: ArticleSearchItem = {
    id: "abc123",
    title: "Grafy cytowań",
    datePosted: "2026-05-07T10:00:00.000Z",
    author: "Anna",
    authorId: "u-anna",
    content: "## Wstęp\n\nTo **krótki** opis grafów.",
    complexity: "INTERMEDIATE",
    rating: { positive: 4, negative: 1 },
    commentCount: 5,
};

describe("ArticleCard", () => {
    it("shows the title link, plain-text excerpt, difficulty, author, rating and comment count", () => {
        renderWithIntl(<ArticleCard article={article} />);

        expect(screen.getByRole("link", { name: "Grafy cytowań" })).toHaveAttribute("href", "/articles/abc123");
        expect(screen.getByText("To krótki opis grafów.")).toBeInTheDocument();
        expect(screen.getByText("Średnie")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Autor: Anna" })).toHaveAttribute("href", "/users/u-anna");
        expect(screen.getByText("5 komentarzy")).toBeInTheDocument();
        expect(screen.getByText(/4 pozytywn/)).toBeInTheDocument();
    });

    it("hides the comment count when it wasn't loaded", () => {
        renderWithIntl(<ArticleCard article={{ ...article, commentCount: null, author: null, authorId: null }} />);

        expect(screen.queryByText(/komentarz/)).not.toBeInTheDocument();
        expect(screen.getByText("Autor: Nieznany autor")).toBeInTheDocument();
    });

    it("hides zero votes and zero comments", () => {
        renderWithIntl(<ArticleCard article={{ ...article, commentCount: 0, rating: { positive: 0, negative: 0 } }} />);

        expect(screen.queryByText(/komentarz/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Oceny/)).not.toBeInTheDocument();
    });
});
