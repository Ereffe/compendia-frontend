import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import ArticleCreateForm from "./articleCreateForm";
import { normalizeDoi, validateArticleFormInputs } from "./articleCreateFormController";

const createArticleAction = vi.fn();

vi.mock("next-themes", () => ({
    useTheme: () => ({ resolvedTheme: "dark" }),
}));

vi.mock("@/app/actions/articles", () => ({
    createArticleAction: (...args: unknown[]) => createArticleAction(...args),
}));

// Render the editor synchronously instead of through next/dynamic.
vi.mock("next/dynamic", () => ({
    default: () =>
        function MarkdownEditorMock({
            value,
            onChange,
            textareaProps,
        }: {
            value?: string;
            onChange?: (value?: string) => void;
            textareaProps?: { placeholder?: string };
        }) {
            return (
                <textarea
                    aria-label="markdown-editor"
                    placeholder={textareaProps?.placeholder}
                    value={value ?? ""}
                    onChange={(event) => onChange?.(event.target.value)}
                />
            );
        },
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("ArticleCreateForm", () => {
    it("renders the form and submits a new article", async () => {
        const user = userEvent.setup();
        // On success the real action redirects on the server and the call never resolves.
        createArticleAction.mockReturnValue(new Promise(() => {}));

        renderWithIntl(<ArticleCreateForm />);

        expect(screen.getByLabelText("Tytuł")).toBeInTheDocument();
        expect(screen.queryByLabelText("Numer DOI")).not.toBeInTheDocument();
        expect(screen.getByRole("radio", { name: /Proste/ })).toBeChecked();
        expect(screen.getByRole("radio", { name: /Średnie/ })).not.toBeChecked();
        expect(screen.getByRole("radio", { name: /Zaawansowane/ })).not.toBeChecked();
        expect(screen.getByRole("radio", { name: /Zwykły artykuł/ })).toBeChecked();
        expect(screen.getByText("0/200")).toBeInTheDocument();

        await user.type(screen.getByLabelText("Tytuł"), "Wprowadzenie do grafów");
        await user.type(screen.getByLabelText("markdown-editor"), "Treść artykułu");
        await user.click(screen.getByRole("radio", { name: /Średnie/ }));
        expect(screen.getByText("22/200")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Utwórz artykuł" }));

        expect(createArticleAction).toHaveBeenCalledWith({
            title: "Wprowadzenie do grafów",
            content: "Treść artykułu",
            complexity: "INTERMEDIATE",
            references: [],
        });
        // Stays in the submitting state until the server redirect navigates away.
        expect(screen.getByRole("button", { name: /Tworzenie/ })).toBeDisabled();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("requires a valid DOI for scientific articles and sends it normalized", async () => {
        const user = userEvent.setup();
        createArticleAction.mockReturnValue(new Promise(() => {}));

        renderWithIntl(<ArticleCreateForm />);

        await user.click(screen.getByRole("radio", { name: /Artykuł naukowy/ }));

        await user.type(screen.getByLabelText("Tytuł"), "Recenzja");
        await user.type(screen.getByLabelText("markdown-editor"), "Komentarz");
        await user.type(screen.getByLabelText("Numer DOI"), "nie-doi");
        await user.click(screen.getByRole("button", { name: "Utwórz artykuł" }));

        expect(screen.getByRole("alert")).toHaveTextContent("Nieprawidłowy numer DOI");
        expect(createArticleAction).not.toHaveBeenCalled();

        await user.clear(screen.getByLabelText("Numer DOI"));
        await user.type(screen.getByLabelText("Numer DOI"), "https://doi.org/10.1038/nature12373");
        await user.click(screen.getByRole("button", { name: "Utwórz artykuł" }));

        expect(createArticleAction).toHaveBeenCalledWith(
            expect.objectContaining({ references: ["10.1038/nature12373"] })
        );
    });

    it("shows the server error when creation fails", async () => {
        const user = userEvent.setup();
        createArticleAction.mockResolvedValue({ ok: false, error: "createArticleFailed" });

        renderWithIntl(<ArticleCreateForm />);

        await user.type(screen.getByLabelText("Tytuł"), "Tytuł");
        await user.type(screen.getByLabelText("markdown-editor"), "Treść");
        await user.click(screen.getByRole("button", { name: "Utwórz artykuł" }));

        expect(screen.getByRole("alert")).toHaveTextContent("Nie udało się utworzyć artykułu.");
        expect(screen.getByRole("button", { name: "Utwórz artykuł" })).toBeEnabled();
    });
});

describe("articleCreateFormController", () => {
    it("normalizes DOI links and prefixes", () => {
        expect(normalizeDoi(" https://doi.org/10.1000/xyz ")).toBe("10.1000/xyz");
        expect(normalizeDoi("doi: 10.1000/xyz")).toBe("10.1000/xyz");
        expect(normalizeDoi("10.1000/xyz")).toBe("10.1000/xyz");
    });

    it("validates scientific input", () => {
        expect(validateArticleFormInputs("", "x")).toBe("missingTitleOrContent");
        expect(validateArticleFormInputs("t", "c", true, "")).toBe("missingDoi");
        expect(validateArticleFormInputs("t", "c", true, "not-a-doi")).toBe("invalidDoi");
        expect(validateArticleFormInputs("t", "c", true, "10.1000/xyz")).toBeNull();
    });
});
