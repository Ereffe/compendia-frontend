import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import type { ArticleSearchItem } from "@/types/articles";
import ArticleSearchModal from "./articleSearchModal";

const searchArticles = vi.fn();

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("./articleSearchModalController", async (importOriginal) => ({
    ...(await importOriginal<typeof import("./articleSearchModalController")>()),
    SEARCH_DEBOUNCE_MS: 0,
    searchArticles: (...args: unknown[]) => searchArticles(...args),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const article = (id: string, title: string, author: string): ArticleSearchItem => ({
    id,
    title,
    author,
    commentCount: null,
    datePosted: "2026-05-07T10:00:00.000Z",
    complexity: "SIMPLE",
    rating: { positive: 0, negative: 0 },
    content: "...",
});

describe("ArticleSearchModal", () => {
    it("renders in English when the locale is en", async () => {
        const user = userEvent.setup();
        searchArticles.mockResolvedValue({ items: [article("9", "Directed graphs", "Ewa")], total: 2 });

        renderWithIntl(<ArticleSearchModal articles={[]} />, { locale: "en" });
        await user.click(screen.getByRole("button", { name: "Open article search" }));
        await user.type(await screen.findByPlaceholderText("Search articles..."), "graphs");

        expect(await screen.findByText("2 results")).toBeInTheDocument();
        expect(screen.getByText("By Ewa")).toBeInTheDocument();
        expect(screen.getByText("May 7, 2026")).toBeInTheDocument();
    });

    const newest = [article("1", "Optymalizacja SQL", "Ala"), article("2", "Listy wiązane", "Olek")];

    it("shows the newest articles before the user types", async () => {
        const user = userEvent.setup();

        renderWithIntl(<ArticleSearchModal articles={newest} />);
        await user.click(screen.getByRole("button", { name: "Otwórz wyszukiwarkę artykułów" }));

        expect(await screen.findByRole("link", { name: /Optymalizacja SQL/i })).toHaveAttribute("href", "/articles/1");
        expect(screen.getByRole("link", { name: /Listy wiązane/i })).toBeInTheDocument();
        expect(searchArticles).not.toHaveBeenCalled();
    });

    it("searches the backend and renders its results", async () => {
        const user = userEvent.setup();
        searchArticles.mockResolvedValue({ items: [article("9", "Grafy skierowane", "Ewa")], total: 1 });

        renderWithIntl(<ArticleSearchModal articles={newest} />);
        await user.click(screen.getByRole("button", { name: "Otwórz wyszukiwarkę artykułów" }));
        await user.type(await screen.findByPlaceholderText("Szukaj artykułów..."), "grafy");

        expect(await screen.findByRole("link", { name: /Grafy skierowane/i })).toHaveAttribute("href", "/articles/9");
        expect(screen.getByText("1 wynik")).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /Optymalizacja SQL/i })).not.toBeInTheDocument();
        expect(searchArticles).toHaveBeenLastCalledWith("grafy");
    });

    it("shows the no-results message when nothing matches", async () => {
        const user = userEvent.setup();
        searchArticles.mockResolvedValue({ items: [], total: 0 });

        renderWithIntl(<ArticleSearchModal articles={newest} />);
        await user.click(screen.getByRole("button", { name: "Otwórz wyszukiwarkę artykułów" }));
        await user.type(await screen.findByPlaceholderText("Szukaj artykułów..."), "programowanie funkcyjne");

        expect(await screen.findByText("Nie znaleziono artykułów dla tego zapytania.")).toBeInTheDocument();
    });

    it("shows an error when the search request fails", async () => {
        const user = userEvent.setup();
        vi.spyOn(console, "error").mockImplementation(() => {});
        searchArticles.mockRejectedValue(new Error("network"));

        renderWithIntl(<ArticleSearchModal articles={newest} />);
        await user.click(screen.getByRole("button", { name: "Otwórz wyszukiwarkę artykułów" }));
        await user.type(await screen.findByPlaceholderText("Szukaj artykułów..."), "sql");

        expect(await screen.findByText("Wyszukiwanie nie powiodło się. Spróbuj ponownie.")).toBeInTheDocument();
    });
});
