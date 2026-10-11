import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import type { CommentItem } from "@/types/comments";
import ArticleComments from "./articleComments";
import { applyCommentEdit, buildCommentTree, findComment, removeComment } from "./articleCommentsController";

const addComment = vi.fn();
const rateComment = vi.fn();
const editComment = vi.fn();
const deleteComment = vi.fn();
const loadComments = vi.fn();

type SessionState = { status: "authenticated" | "unauthenticated" | "loading"; data: { user: { id: string } } | null };
const signedIn: SessionState = { status: "authenticated", data: { user: { id: "u-me" } } };
let sessionState: SessionState = signedIn;

vi.mock("@/app/actions/comments", () => ({
    addCommentAction: (...args: unknown[]) => addComment(...args),
    rateCommentAction: (...args: unknown[]) => rateComment(...args),
    editCommentAction: (...args: unknown[]) => editComment(...args),
    deleteCommentAction: (...args: unknown[]) => deleteComment(...args),
    loadCommentsAction: (...args: unknown[]) => loadComments(...args),
}));

vi.mock("next-auth/react", () => ({
    useSession: () => sessionState,
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
            rating: { positive: 2, negative: 0 }, myVote: null,
        },
        {
            id: "c2",
            content: "Odpowiedź",
            datePosted: "2026-05-06T13:00:00.000Z",
            user: { id: "u2", name: "Olek" },
            rating: { positive: 1, negative: 0 }, myVote: null,
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
                rating: { positive: 0, negative: 0 }, myVote: null,
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

    it("shows each author's generated avatar, the same for the same user id", () => {
        const { container } = renderWithIntl(
            <ArticleComments
                articleId="a1"
                initialComments={[
                    initialComments[0],
                    { ...initialComments[0], id: "c9", content: "Drugi komentarz Ali" },
                    { ...initialComments[1], parentCommentId: null },
                ]}
            />,
        );

        const avatars = [...container.querySelectorAll("article > img")].map((img) => img.getAttribute("src"));
        expect(avatars).toHaveLength(3);
        expect(avatars[0]).toMatch(/^data:image\/svg\+xml/);
        expect(avatars[0]).toBe(avatars[1]);
        expect(avatars[0]).not.toBe(avatars[2]);
    });

    it("disables commenting when there is no active session", async () => {
        sessionState = { status: "unauthenticated", data: null };

        renderWithIntl(<ArticleComments articleId="a1" initialComments={initialComments} />);

        expect(screen.getByPlaceholderText("Zaloguj się, aby napisać komentarz")).toBeDisabled();
        expect(screen.getByText("Musisz być zalogowany, aby komentować.")).toBeInTheDocument();
    });

    it("loads the next page and attaches replies to parents that arrive later", async () => {
        const user = userEvent.setup();
        const orphanReply: CommentItem = {
            id: "c5",
            content: "Odpowiedź na starszy",
            datePosted: "2026-05-06T14:00:00.000Z",
            user: { id: "u2", name: "Olek" },
            rating: { positive: 0, negative: 0 },
            myVote: null,
            parentCommentId: "c4",
        };
        const older: CommentItem = {
            id: "c4",
            content: "Starszy komentarz",
            datePosted: "2026-05-01T12:00:00.000Z",
            user: { id: "u1", name: "Ala" },
            rating: { positive: 0, negative: 0 },
            myVote: null,
        };
        loadComments.mockResolvedValue({ ok: true, data: { comments: [older], totalElements: 25 } });

        renderWithIntl(
            <ArticleComments articleId="Abc123" initialComments={[...initialComments, orphanReply]} totalCount={25} />,
        );

        expect(screen.getByText("25 komentarzy")).toBeInTheDocument();
        expect(screen.getByText("Wyświetlono 3 z 25 komentarzy.")).toBeInTheDocument();
        expect(screen.getByText("Odpowiedź na starszy")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Pokaż więcej komentarzy" }));

        expect(loadComments).toHaveBeenCalledWith("Abc123", 1);
        expect(await screen.findByText("Starszy komentarz")).toBeInTheDocument();
        expect(screen.queryByText("Odpowiedź na starszy")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Pokaż więcej komentarzy" })).not.toBeInTheDocument();
    });

    it("shows an error when the next page can't be loaded", async () => {
        const user = userEvent.setup();
        loadComments.mockResolvedValue({ ok: false, error: "loadCommentsFailed" });

        renderWithIntl(<ArticleComments articleId="Abc123" initialComments={initialComments} totalCount={25} />);
        await user.click(screen.getByRole("button", { name: "Pokaż więcej komentarzy" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się wczytać kolejnych komentarzy.");
    });

    it("rolls back the vote when the server rejects it", async () => {
        const user = userEvent.setup();
        rateComment.mockResolvedValue({ ok: false, error: "rateCommentFailed" });

        renderWithIntl(<ArticleComments articleId="a1" initialComments={initialComments} />);

        await user.click(screen.getByRole("button", { name: "Głos pozytywny (2)" }));

        expect(rateComment).toHaveBeenCalledWith("c1", true);
        expect(await screen.findByText("Nie udało się ocenić komentarza.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Głos pozytywny (2)" })).toHaveAttribute("aria-pressed", "false");
    });

    it("removes the user's vote when the pressed button is clicked again", async () => {
        const user = userEvent.setup();
        rateComment.mockResolvedValue({ ok: true, data: null });
        const voted = initialComments.map((comment) => (comment.id === "c1" ? { ...comment, myVote: true } : comment));

        renderWithIntl(<ArticleComments articleId="a1" initialComments={voted} />);

        const upvote = screen.getByRole("button", { name: "Głos pozytywny (2)" });
        expect(upvote).toHaveAttribute("aria-pressed", "true");
        await user.click(upvote);

        expect(rateComment).toHaveBeenCalledWith("c1", null);
        expect(screen.getByRole("button", { name: "Głos pozytywny (1)" })).toHaveAttribute("aria-pressed", "false");
    });

    it("sends only one vote while a vote is pending", async () => {
        const user = userEvent.setup();
        rateComment.mockReturnValue(new Promise(() => {}));

        renderWithIntl(<ArticleComments articleId="a1" initialComments={initialComments} />);

        const upvote = screen.getByRole("button", { name: "Głos pozytywny (2)" });
        await user.click(upvote);
        await user.click(screen.getByRole("button", { name: /Głos negatywny/ }));

        expect(rateComment).toHaveBeenCalledTimes(1);
        expect(rateComment).toHaveBeenCalledWith("c1", true);
    });

    describe("own comments", () => {
        const withOwnComment: CommentItem[] = [
            ...initialComments,
            {
                id: "c9",
                content: "Mój komentarz",
                datePosted: "2026-05-08T12:00:00.000Z",
                user: { id: "u-me", name: "Ja" },
                rating: { positive: 0, negative: 0 }, myVote: null,
            },
        ];

        it("shows edit and delete only on the signed-in user's comments", () => {
            renderWithIntl(<ArticleComments articleId="a1" initialComments={withOwnComment} />);

            expect(screen.getAllByRole("button", { name: "Edytuj" })).toHaveLength(1);
            expect(screen.getAllByRole("button", { name: "Usuń" })).toHaveLength(1);
        });

        it("hides them when signed out", () => {
            sessionState = { status: "unauthenticated", data: null };
            renderWithIntl(<ArticleComments articleId="a1" initialComments={withOwnComment} />);

            expect(screen.queryByRole("button", { name: "Edytuj" })).not.toBeInTheDocument();
        });

        it("edits a comment in place", async () => {
            const user = userEvent.setup();
            editComment.mockResolvedValue({
                ok: true,
                data: { id: "c9", content: "Poprawiony komentarz", editedAt: "2026-05-09T12:00:00.000Z" },
            });

            renderWithIntl(<ArticleComments articleId="a1" initialComments={withOwnComment} />);

            await user.click(screen.getByRole("button", { name: "Edytuj" }));
            const editor = screen.getByRole("textbox", { name: "Edytuj komentarz" });
            expect(editor).toHaveValue("Mój komentarz");
            expect(screen.getByRole("button", { name: "Zapisz" })).toBeDisabled();

            await user.clear(editor);
            await user.type(editor, "Poprawiony komentarz");
            await user.click(screen.getByRole("button", { name: "Zapisz" }));

            expect(editComment).toHaveBeenCalledWith("c9", "Poprawiony komentarz");
            expect(await screen.findByText("Poprawiony komentarz")).toBeInTheDocument();
            expect(screen.queryByRole("textbox", { name: "Edytuj komentarz" })).not.toBeInTheDocument();
            expect(screen.getByText(/edytowano/)).toBeInTheDocument();
        });

        it("keeps the editor open and shows the error when saving fails", async () => {
            const user = userEvent.setup();
            editComment.mockResolvedValue({ ok: false, error: "forbidden" });

            renderWithIntl(<ArticleComments articleId="a1" initialComments={withOwnComment} />);

            await user.click(screen.getByRole("button", { name: "Edytuj" }));
            await user.type(screen.getByRole("textbox", { name: "Edytuj komentarz" }), "!");
            await user.click(screen.getByRole("button", { name: "Zapisz" }));

            expect(await screen.findByRole("alert")).toHaveTextContent("Nie masz uprawnień do tej operacji.");
            expect(screen.getByRole("textbox", { name: "Edytuj komentarz" })).toHaveValue("Mój komentarz!");
        });

        it("deletes a comment after confirmation and updates the count", async () => {
            const user = userEvent.setup();
            deleteComment.mockResolvedValue({ ok: true, data: null });

            renderWithIntl(<ArticleComments articleId="a1" initialComments={withOwnComment} totalCount={3} />);
            expect(screen.getByText("3 komentarze")).toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Usuń" }));
            const dialog = screen.getByRole("alertdialog", { name: "Usunąć ten komentarz?" });
            expect(dialog).toHaveTextContent("Komentarz zostanie trwale usunięty.");
            expect(deleteComment).not.toHaveBeenCalled();

            await user.click(screen.getByRole("button", { name: "Usuń komentarz" }));

            expect(deleteComment).toHaveBeenCalledWith("c9");
            await waitFor(() => {
                expect(screen.queryByText("Mój komentarz")).not.toBeInTheDocument();
            });
            expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
            expect(screen.getByText("2 komentarze")).toBeInTheDocument();
        });

        it("keeps the comment and shows the error when deleting fails", async () => {
            const user = userEvent.setup();
            deleteComment.mockResolvedValue({ ok: false, error: "deleteCommentFailed" });

            renderWithIntl(<ArticleComments articleId="a1" initialComments={withOwnComment} />);

            await user.click(screen.getByRole("button", { name: "Usuń" }));
            await user.click(screen.getByRole("button", { name: "Usuń komentarz" }));

            expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się usunąć komentarza.");
            expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            expect(screen.getByText("Mój komentarz")).toBeInTheDocument();
        });
    });
});

describe("articleCommentsController edit/delete helpers", () => {
    const tree = buildCommentTree([
        { id: "1", content: "a", datePosted: "", user: { id: "u", name: "U" }, rating: { positive: 0, negative: 0 }, myVote: null },
        { id: "2", content: "b", datePosted: "", user: { id: "u", name: "U" }, rating: { positive: 0, negative: 0 }, myVote: null, parentCommentId: "1" },
        { id: "3", content: "c", datePosted: "", user: { id: "u", name: "U" }, rating: { positive: 0, negative: 0 }, myVote: null, parentCommentId: "2" },
        { id: "4", content: "d", datePosted: "", user: { id: "u", name: "U" }, rating: { positive: 0, negative: 0 }, myVote: null },
    ]);

    it("finds nested comments", () => {
        expect(findComment(tree, "3")?.content).toBe("c");
        expect(findComment(tree, "x")).toBeUndefined();
    });

    it("applies an edit to a nested comment", () => {
        const edited = applyCommentEdit(tree, { id: "3", content: "zmienione", editedAt: "2026-01-01T00:00:00" });
        expect(findComment(edited, "3")).toMatchObject({ content: "zmienione", editedAt: "2026-01-01T00:00:00" });
        expect(findComment(tree, "3")?.content).toBe("c");
    });

    it("removes a comment together with its replies", () => {
        const remaining = removeComment(tree, "2");
        expect(findComment(remaining, "2")).toBeUndefined();
        expect(findComment(remaining, "3")).toBeUndefined();
        expect(findComment(remaining, "1")?.replies).toEqual([]);
        expect(findComment(remaining, "4")).toBeDefined();
    });
});
