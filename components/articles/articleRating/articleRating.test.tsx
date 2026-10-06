import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import ArticleRating from "./articleRating";

let storedVotes: Record<string, Record<string, string>> = {};
const rateArticle = vi.fn();
const setVote = vi.fn((userKey: string, id: string, vote: string) => {
    storedVotes = { ...storedVotes, [userKey]: { ...storedVotes[userKey], [id]: vote } };
});
const clearVote = vi.fn();
const toastSuccess = vi.fn();

vi.mock("sonner", () => ({
    toast: { success: (...args: unknown[]) => toastSuccess(...args) },
}));

type SessionState = { status: "authenticated" | "unauthenticated"; data: { user: { id: string } } | null };
const signedIn: SessionState = { status: "authenticated", data: { user: { id: "u-me" } } };
let sessionState: SessionState = signedIn;

vi.mock("@/app/actions/articles", () => ({
    rateArticleAction: (...args: unknown[]) => rateArticle(...args),
}));

vi.mock("next-auth/react", () => ({
    useSession: () => sessionState,
}));

vi.mock("@/hooks/stores/useVoteStore", () => ({
    articleVoteId: (id: string) => `article:${id}`,
    useVoteStore: (selector: (state: unknown) => unknown) => selector({
        votes: storedVotes,
        getVote: (userKey: string, id: string) => storedVotes[userKey]?.[id],
        setVote,
        clearVote,
    }),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionState = signedIn;
    storedVotes = {};
});

const rating = { positive: 3, negative: 1 };

describe("ArticleRating", () => {
    it("rates the article and remembers the vote for the user", async () => {
        const user = userEvent.setup();
        rateArticle.mockResolvedValue({ ok: true, data: null });

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} />);

        expect(screen.getByText("Czy ten artykuł był pomocny?")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Oceń pozytywnie (3)" }));

        expect(rateArticle).toHaveBeenCalledWith("abc123", true);
        expect(setVote).toHaveBeenCalledWith("u-me", "article:abc123", "positive");
        expect(screen.getByRole("button", { name: "Oceń pozytywnie (4)" })).toBeInTheDocument();
        expect(clearVote).not.toHaveBeenCalled();
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Dziękujemy, głos został zapisany."));
    });

    it("sends only one vote when the user clicks again before the page updates", async () => {
        const user = userEvent.setup();
        rateArticle.mockResolvedValue({ ok: true, data: null });

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} />);

        await user.click(screen.getByRole("button", { name: "Oceń pozytywnie (3)" }));
        await user.click(screen.getByRole("button", { name: /Oceń negatywnie/ }));

        expect(rateArticle).toHaveBeenCalledTimes(1);
    });

    it("rolls back when the server rejects the vote", async () => {
        const user = userEvent.setup();
        rateArticle.mockResolvedValue({ ok: false, error: "rateArticleFailed" });

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} />);

        await user.click(screen.getByRole("button", { name: "Oceń negatywnie (1)" }));

        await waitFor(() => {
            expect(clearVote).toHaveBeenCalledWith("u-me", "article:abc123");
        });
        expect(screen.getByRole("alert")).toHaveTextContent("Nie udało się ocenić artykułu.");
        expect(screen.getByRole("button", { name: "Oceń negatywnie (1)" })).toBeInTheDocument();
        expect(toastSuccess).not.toHaveBeenCalled();
    });

    it("disables voting after the user already rated", () => {
        storedVotes = { "u-me": { "article:abc123": "positive" } };

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} />);

        expect(screen.getByText("Dziękujemy za ocenę.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Oceń pozytywnie (3)" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Oceń negatywnie (1)" })).toBeDisabled();
    });

    it("disables voting when signed out", () => {
        sessionState = { status: "unauthenticated", data: null };

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} />);

        expect(screen.getByRole("button", { name: "Oceń pozytywnie (3)" })).toBeDisabled();
    });
});
