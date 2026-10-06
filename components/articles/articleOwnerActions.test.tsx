import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import ArticleOwnerActions from "./articleOwnerActions";

const deleteArticleAction = vi.fn();

vi.mock("@/app/actions/articles", () => ({
    deleteArticleAction: (...args: unknown[]) => deleteArticleAction(...args),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("ArticleOwnerActions", () => {
    it("links to the edit page", () => {
        renderWithIntl(<ArticleOwnerActions articleId="abc123" />);

        expect(screen.getByRole("link", { name: "Edytuj" })).toHaveAttribute("href", "/articles/abc123/edit");
    });

    it("asks for confirmation before deleting and stays in the pending state until the redirect", async () => {
        const user = userEvent.setup();
        deleteArticleAction.mockReturnValue(new Promise(() => {}));

        renderWithIntl(<ArticleOwnerActions articleId="abc123" />);

        await user.click(screen.getByRole("button", { name: "Usuń" }));
        expect(screen.getByRole("alertdialog", { name: "Usunąć ten artykuł?" })).toBeInTheDocument();
        expect(deleteArticleAction).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "Usuń artykuł" }));

        expect(deleteArticleAction).toHaveBeenCalledWith("abc123");
        expect(screen.getByRole("button", { name: /Usuwanie/ })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Anuluj" })).toBeDisabled();
    });

    it("shows the error inside the dialog when deleting fails", async () => {
        const user = userEvent.setup();
        deleteArticleAction.mockResolvedValue({ ok: false, error: "forbidden" });

        renderWithIntl(<ArticleOwnerActions articleId="abc123" />);

        await user.click(screen.getByRole("button", { name: "Usuń" }));
        await user.click(screen.getByRole("button", { name: "Usuń artykuł" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Nie masz uprawnień do tej operacji.");
        expect(screen.getByRole("button", { name: "Usuń artykuł" })).toBeEnabled();
    });
});
