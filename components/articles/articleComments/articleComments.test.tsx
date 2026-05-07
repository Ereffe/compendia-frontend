import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CommentItem } from "@/types/comments";
import ArticleComments from "./articleComments";

const addComment = vi.fn();
const rateComment = vi.fn();
const setVote = vi.fn();
const clearVote = vi.fn();
const getVote = vi.fn();
let authState = {
    accessToken: "token-123",
    isLoading: false,
    error: null as string | null,
};

vi.mock("@/services/graphql/comments", () => ({
    addComment: (...args: unknown[]) => addComment(...args),
    rateComment: (...args: unknown[]) => rateComment(...args),
}));

vi.mock("@/hooks/stores/useAuthStore", () => ({
    useAuthStore: () => ({
        accessToken: authState.accessToken,
        isLoading: authState.isLoading,
        error: authState.error,
    }),
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
    authState = {
        accessToken: "token-123",
        isLoading: false,
        error: null,
    };
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
            id: "c3",
            content: "Nowa odpowiedź",
            datePosted: "2026-05-07T12:00:00.000Z",
            user: { id: "u3", name: "Autor" },
            rating: { positive: 0, negative: 0 },
            parentCommentId: "c1",
            replies: [],
        });

        render(<ArticleComments articleId="a1" initialComments={initialComments} />);

        expect(screen.getByText("2 komentarze")).toBeInTheDocument();
        expect(screen.getByText("Pierwszy komentarz")).toBeInTheDocument();
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
        authState = {
            accessToken: "",
            isLoading: false,
            error: null,
        };

        render(<ArticleComments articleId="a1" initialComments={initialComments} />);

        expect(screen.getByPlaceholderText("Zaloguj się, aby napisać komentarz")).toBeDisabled();
        expect(screen.getByText("Musisz być zalogowany, aby komentować.")).toBeInTheDocument();
    });
});