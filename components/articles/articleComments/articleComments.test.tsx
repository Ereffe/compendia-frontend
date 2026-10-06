import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import type { CommentItem } from "@/types/comments";
import ArticleComments from "./articleComments";

const addComment = vi.fn();
const rateComment = vi.fn();
const setVote = vi.fn();
const clearVote = vi.fn();
const getVote = vi.fn();

type SessionState = { status: "authenticated" | "unauthenticated" | "loading"; data: { user: { id: string } } | null };
const signedIn: SessionState = { status: "authenticated", data: { user: { id: "u-me" } } };
let sessionState: SessionState = signedIn;

vi.mock("@/app/actions/comments", () => ({
    addCommentAction: (...args: unknown[]) => addComment(...args),
    rateCommentAction: (...args: unknown[]) => rateComment(...args),
}));

vi.mock("next-auth/react", () => ({
    useSession: () => sessionState,
}));

vi.mock("@/hooks/stores/useVoteStore", () => ({
    useVoteStore: () => ({
        setVote,
        clearVote,
        getVote,
    }),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionState = signedIn;
});

describe("ArticleComments", () => {
    const initialComments: CommentItem[] = [
        {
            id: "c1",
            content: "Pierwszy komentarz",
            datePosted: "2026-05-06T12:00:00.000Z",
            user: { id: "u1", name: "Ala" },
            rating: { positive: 2, negative: 0 },
        },
        {
            id: "c2",
            content: "Odpowiedź",
            datePosted: "2026-05-06T13:00:00.000Z",
            user: { id: "u2", name: "Olek" },
            rating: { positive: 1, negative: 0 },
            parentCommentId: "c1",
        },
    ];

    it("renders the comment tree and lets a signed-in user add a reply", async () => {
        const user = userEvent.setup();

        addComment.mockResolvedValue({
            ok: true,
            data: {
                id: "c3",
                content: "Nowa odpowiedź",
                datePosted: "2026-05-07T12:00:00.000Z",
                user: { id: "u3", name: "Autor" },
                rating: { positive: 0, negative: 0 },
                parentCommentId: "c1",
            },
        });

        renderWithIntl(<ArticleComments articleId="a1" initialComments={initialComments} />);

        expect(screen.getByText("2 komentarze")).toBeInTheDocument();
        expect(screen.getByText("Pierwszy komentarz")).toBeInTheDocument();
        expect(screen.queryByText("Odpowiedź")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Pokaż 1 odpowiedź" }));
        expect(screen.getByText("Odpowiedź")).toBeInTheDocument();

        await user.click(screen.getAllByRole("button", { name: "Odpowiedz" })[0]);

        const replyBox = screen.getByPlaceholderText("Napisz odpowiedź...");
        await user.type(replyBox, "Nowa odpowiedź");
        await user.click(screen.getByRole("button", { name: "Dodaj odpowiedź" }));

        await waitFor(() => {
            expect(addComment).toHaveBeenCalledWith("a1", "Nowa odpowiedź", "c1");
        });
        expect(screen.getByText("Nowa odpowiedź")).toBeInTheDocument();
    });

    it("disables commenting when there is no active session", async () => {
        sessionState = { status: "unauthenticated", data: null };

        renderWithIntl(<ArticleComments articleId="a1" initialComments={initialComments} />);

        expect(screen.getByPlaceholderText("Zaloguj się, aby napisać komentarz")).toBeDisabled();
        expect(screen.getByText("Musisz być zalogowany, aby komentować.")).toBeInTheDocument();
    });

    it("tells the user when only part of the comments is shown", () => {
        renderWithIntl(<ArticleComments articleId="a1" initialComments={initialComments} totalCount={250} />);

        expect(screen.getByText("250 komentarzy")).toBeInTheDocument();
        expect(screen.getByText("Wyświetlono 2 najnowszych z 250 komentarzy.")).toBeInTheDocument();
    });

    it("records the vote for the signed-in user and rolls back when the server rejects it", async () => {
        const user = userEvent.setup();
        rateComment.mockResolvedValue({ ok: false, error: "rateCommentFailed" });

        renderWithIntl(<ArticleComments articleId="a1" initialComments={initialComments} />);

        await user.click(screen.getByRole("button", { name: "Głos pozytywny (2)" }));

        expect(setVote).toHaveBeenCalledWith("u-me", "c1", "positive");
        await waitFor(() => {
            expect(clearVote).toHaveBeenCalledWith("u-me", "c1");
        });
        expect(screen.getByText("Nie udało się ocenić komentarza.")).toBeInTheDocument();
    });
});