import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import ArticleRating from "./articleRating";

const rateArticle = vi.fn();
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

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionState = signedIn;
});

const rating = { positive: 3, negative: 1 };

describe("ArticleRating", () => {
    it("rates the article", async () => {
        const user = userEvent.setup();
        rateArticle.mockResolvedValue({ ok: true, data: null });

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} initialVote={null} />);

        expect(screen.getByText("Czy ten artykuł był pomocny?")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Oceń pozytywnie (3)" }));

        expect(rateArticle).toHaveBeenCalledWith("abc123", true);
        expect(screen.getByRole("button", { name: "Oceń pozytywnie (4)" })).toHaveAttribute("aria-pressed", "true");
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Dziękujemy, głos został zapisany."));
    });

    it("switches an existing vote to the other side", async () => {
        const user = userEvent.setup();
        rateArticle.mockResolvedValue({ ok: true, data: null });

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} initialVote={true} />);

        await user.click(screen.getByRole("button", { name: "Oceń negatywnie (1)" }));

        expect(rateArticle).toHaveBeenCalledWith("abc123", false);
        expect(screen.getByRole("button", { name: "Oceń pozytywnie (2)" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Oceń negatywnie (2)" })).toHaveAttribute("aria-pressed", "true");
    });

    it("removes the vote when the pressed button is clicked again", async () => {
        const user = userEvent.setup();
        rateArticle.mockResolvedValue({ ok: true, data: null });

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} initialVote={true} />);

        expect(screen.getByText("Dziękujemy za ocenę.")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Oceń pozytywnie (3)" }));

        expect(rateArticle).toHaveBeenCalledWith("abc123", null);
        expect(screen.getByRole("button", { name: "Oceń pozytywnie (2)" })).toHaveAttribute("aria-pressed", "false");
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Głos został wycofany."));
    });

    it("sends only one request while a vote is pending", async () => {
        const user = userEvent.setup();
        rateArticle.mockReturnValue(new Promise(() => {}));

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} initialVote={null} />);

        await user.click(screen.getByRole("button", { name: "Oceń pozytywnie (3)" }));
        await user.click(screen.getByRole("button", { name: /Oceń negatywnie/ }));

        expect(rateArticle).toHaveBeenCalledTimes(1);
    });

    it("rolls back when the server rejects the vote", async () => {
        const user = userEvent.setup();
        rateArticle.mockResolvedValue({ ok: false, error: "rateArticleFailed" });

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} initialVote={null} />);

        await user.click(screen.getByRole("button", { name: "Oceń negatywnie (1)" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się ocenić artykułu.");
        expect(screen.getByRole("button", { name: "Oceń negatywnie (1)" })).toHaveAttribute("aria-pressed", "false");
        expect(toastSuccess).not.toHaveBeenCalled();
    });

    it("disables voting when signed out", () => {
        sessionState = { status: "unauthenticated", data: null };

        renderWithIntl(<ArticleRating articleId="abc123" initialRating={rating} initialVote={null} />);

        expect(screen.getByRole("button", { name: "Oceń pozytywnie (3)" })).toBeDisabled();
    });
});
