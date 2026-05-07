import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ArticleSearchModal from "./articleSearchModal";

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

afterEach(() => {
    cleanup();
});

describe("ArticleSearchModal", () => {
    const articles = [
        {
            id: "1",
            title: "Optymalizacja SQL",
            category: "Bazy danych",
            publishedAt: "2026-05-07",
            author: "Ala",
        },
        {
            id: "2",
            title: "Listy wiązane",
            category: "Struktury danych",
            publishedAt: "2026-05-06",
            author: "Olek",
        },
    ];

    it("opens the modal and filters the article list", async () => {
        const user = userEvent.setup();

        render(<ArticleSearchModal articles={articles} />);

        await user.click(screen.getByRole("button", { name: "Otwórz wyszukiwarkę artykułów" }));

        const searchInput = await screen.findByPlaceholderText("Szukaj artykułów...");
        await user.type(searchInput, "sql");

        expect(screen.getByRole("link", { name: /Optymalizacja SQL/i })).toHaveAttribute("href", "/articles/1");
        expect(screen.queryByRole("link", { name: /Listy wiązane/i })).not.toBeInTheDocument();
    });

    it("shows the no-results message when nothing matches", async () => {
        const user = userEvent.setup();

        render(<ArticleSearchModal articles={articles} />);

        await user.click(screen.getByRole("button", { name: "Otwórz wyszukiwarkę artykułów" }));

        const searchInput = await screen.findByPlaceholderText("Szukaj artykułów...");
        await user.type(searchInput, "programowanie funkcyjne");

        expect(screen.getByText("Nie znaleziono artykułów dla tego zapytania.")).toBeInTheDocument();
    });
});