import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import ArticleCreateForm from "./articleCreateForm";
import {
    buildMetadataContent,
    fillIfEmpty,
    getDoiMetadataMessage,
    getEditedReferences,
    normalizeDoi,
    validateArticleFormInputs,
} from "./articleCreateFormController";
import { getDraftKey, parseDraft } from "./articleDraft";

const createArticleAction = vi.fn();
const editArticleAction = vi.fn();
const browserQuery = vi.fn();

vi.mock("@/lib/apolloBrowser", () => ({
    default: () => ({ query: (...args: unknown[]) => browserQuery(...args) }),
}));

vi.mock("next-themes", () => ({
    useTheme: () => ({ resolvedTheme: "dark" }),
}));

vi.mock("@/app/actions/articles", () => ({
    createArticleAction: (...args: unknown[]) => createArticleAction(...args),
    editArticleAction: (...args: unknown[]) => editArticleAction(...args),
}));

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

describe("ArticleCreateForm DOI autofill", () => {
    const metadata = {
        doi: "10.5194/acp-18-1-2018",
        title: "Aerosol over the Arctic",
        authors: ["Anna Nowak", " Jan Kowalski "],
        description: "We measure aerosols.",
    };

    const openScientificForm = async (user: ReturnType<typeof userEvent.setup>, doi: string) => {
        renderWithIntl(<ArticleCreateForm />);
        await user.click(screen.getByRole("radio", { name: /Artykuł naukowy/ }));
        await user.type(screen.getByLabelText("Numer DOI"), doi);
    };

    it("fills the empty title and content from the DOI", async () => {
        const user = userEvent.setup();
        browserQuery.mockResolvedValue({ data: { scienceArticleMetadata: metadata } });

        await openScientificForm(user, "https://doi.org/10.5194/acp-18-1-2018");
        await user.click(screen.getByRole("button", { name: "Uzupełnij z DOI" }));

        expect(browserQuery).toHaveBeenCalledWith(
            expect.objectContaining({ variables: { doi: "10.5194/acp-18-1-2018" } }),
        );
        expect(screen.getByLabelText("Tytuł")).toHaveValue("Aerosol over the Arctic");
        expect(screen.getByLabelText("markdown-editor")).toHaveValue(
            "**Autorzy:** Anna Nowak, Jan Kowalski\n\n## Streszczenie\n\nWe measure aerosols.",
        );
        expect(screen.getByRole("status")).toHaveTextContent("Uzupełniono tytuł i treść");
    });

    it("keeps fields the user already filled in", async () => {
        const user = userEvent.setup();
        browserQuery.mockResolvedValue({ data: { scienceArticleMetadata: metadata } });

        await openScientificForm(user, "10.5194/acp-18-1-2018");
        await user.type(screen.getByLabelText("Tytuł"), "Mój tytuł");
        await user.click(screen.getByRole("button", { name: "Uzupełnij z DOI" }));

        expect(screen.getByLabelText("Tytuł")).toHaveValue("Mój tytuł");
        expect((screen.getByLabelText("markdown-editor") as HTMLTextAreaElement).value).toContain("We measure aerosols.");
        expect(screen.getByRole("status")).toHaveTextContent("zostały bez zmian");
    });

    it("validates the DOI before fetching and reports lookup failures", async () => {
        const user = userEvent.setup();
        browserQuery.mockRejectedValue(new Error("network"));

        await openScientificForm(user, "nie-doi");
        await user.click(screen.getByRole("button", { name: "Uzupełnij z DOI" }));

        expect(screen.getByRole("alert")).toHaveTextContent("Nieprawidłowy numer DOI");
        expect(browserQuery).not.toHaveBeenCalled();

        await user.clear(screen.getByLabelText("Numer DOI"));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        await user.type(screen.getByLabelText("Numer DOI"), "10.1000/xyz");
        await user.click(screen.getByRole("button", { name: "Uzupełnij z DOI" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się pobrać danych publikacji.");
        expect(screen.getByRole("button", { name: "Uzupełnij z DOI" })).toBeEnabled();
    });
});

describe("ArticleCreateForm draft autosave", () => {
    const draftKey = getDraftKey("u1") as string;
    const storedDraft = {
        scientific: true,
        title: "Szkic recenzji",
        content: "Zapisana treść",
        doi: "10.1000/xyz",
        complexity: "COMPLEX",
        savedAt: "2026-10-07T10:00:00.000Z",
    };

    afterEach(() => {
        localStorage.clear();
    });

    it("offers to restore a saved draft and fills the form with it", async () => {
        const user = userEvent.setup();
        localStorage.setItem(draftKey, JSON.stringify(storedDraft));

        renderWithIntl(<ArticleCreateForm draftOwnerId="u1" />);

        expect(screen.getByRole("region", { name: "Masz niezapisany szkic" })).toHaveTextContent("Szkic recenzji");
        await user.click(screen.getByRole("button", { name: "Przywróć szkic" }));

        expect(screen.queryByRole("region", { name: "Masz niezapisany szkic" })).not.toBeInTheDocument();
        expect(screen.getByLabelText("Tytuł")).toHaveValue("Szkic recenzji");
        expect(screen.getByLabelText("markdown-editor")).toHaveValue("Zapisana treść");
        expect(screen.getByLabelText("Numer DOI")).toHaveValue("10.1000/xyz");
        expect(screen.getByRole("radio", { name: /Zaawansowane/ })).toBeChecked();
    });

    it("discards a saved draft", async () => {
        const user = userEvent.setup();
        localStorage.setItem(draftKey, JSON.stringify(storedDraft));

        renderWithIntl(<ArticleCreateForm draftOwnerId="u1" />);
        await user.click(screen.getByRole("button", { name: "Odrzuć" }));

        expect(localStorage.getItem(draftKey)).toBeNull();
        expect(screen.getByLabelText("Tytuł")).toHaveValue("");
    });

    it("does not overwrite a pending draft while the user hasn't decided", async () => {
        const user = userEvent.setup();
        localStorage.setItem(draftKey, JSON.stringify(storedDraft));

        renderWithIntl(<ArticleCreateForm draftOwnerId="u1" />);
        await user.type(screen.getByLabelText("Tytuł"), "Nowy");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(parseDraft(localStorage.getItem(draftKey))?.title).toBe("Szkic recenzji");
    });

    it("saves the draft while typing and clears it on submit", async () => {
        const user = userEvent.setup();
        createArticleAction.mockReturnValue(new Promise(() => {}));

        renderWithIntl(<ArticleCreateForm draftOwnerId="u1" />);
        expect(screen.getByText("Szkic zapisuje się automatycznie na tym urządzeniu.")).toBeInTheDocument();

        await user.type(screen.getByLabelText("Tytuł"), "Tytuł");
        await user.type(screen.getByLabelText("markdown-editor"), "Treść");
        await waitFor(() => expect(parseDraft(localStorage.getItem(draftKey))?.content).toBe("Treść"), { timeout: 2000 });
        expect(screen.getByText(/Szkic zapisany o/)).toBeInTheDocument();
        expect(screen.queryByRole("region", { name: "Masz niezapisany szkic" })).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Utwórz artykuł" }));
        expect(localStorage.getItem(draftKey)).toBeNull();
    });

    it("doesn't autosave when editing an article", () => {
        renderWithIntl(
            <ArticleCreateForm
                draftOwnerId="u1"
                article={{ id: "abc123", title: "T", content: "C", complexity: "SIMPLE", doi: "" }}
            />,
        );

        expect(screen.queryByText(/Szkic zapisuje się/)).not.toBeInTheDocument();
    });
});

describe("ArticleCreateForm in edit mode", () => {
    const regularArticle = {
        id: "abc123",
        title: "Stary tytuł",
        content: "Stara treść",
        complexity: "COMPLEX" as const,
        doi: "",
    };

    it("is pre-filled and saves the changes to the existing article", async () => {
        const user = userEvent.setup();
        editArticleAction.mockReturnValue(new Promise(() => {}));

        renderWithIntl(<ArticleCreateForm article={regularArticle} />);

        expect(screen.getByLabelText("Tytuł")).toHaveValue("Stary tytuł");
        expect(screen.getByLabelText("markdown-editor")).toHaveValue("Stara treść");
        expect(screen.getByRole("radio", { name: /Zaawansowane/ })).toBeChecked();
        expect(screen.getByRole("radio", { name: /Zwykły artykuł/ })).toBeChecked();

        await user.type(screen.getByLabelText("Tytuł"), " 2");
        await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

        expect(editArticleAction).toHaveBeenCalledWith("abc123", {
            title: "Stary tytuł 2",
            content: "Stara treść",
            complexity: "COMPLEX",
            references: null,
        });
        expect(createArticleAction).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: /Zapisywanie/ })).toBeDisabled();
    });

    it("keeps a scientific article scientific and only sends a changed DOI", async () => {
        const user = userEvent.setup();
        editArticleAction.mockResolvedValue({ ok: false, error: "forbidden" });

        renderWithIntl(<ArticleCreateForm article={{ ...regularArticle, doi: "10.5194/acp-18-1-2018" }} />);

        expect(screen.getByRole("radio", { name: /Artykuł naukowy/ })).toBeChecked();
        expect(screen.getByRole("radio", { name: /Zwykły artykuł/ })).toBeDisabled();
        expect(screen.getByLabelText("Numer DOI")).toHaveValue("10.5194/acp-18-1-2018");

        await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
        expect(editArticleAction).toHaveBeenLastCalledWith("abc123", expect.objectContaining({ references: null }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Nie masz uprawnień do tej operacji.");

        await user.clear(screen.getByLabelText("Numer DOI"));
        await user.type(screen.getByLabelText("Numer DOI"), "https://doi.org/10.5194/gmd-10-1403-2017");
        await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
        expect(editArticleAction).toHaveBeenLastCalledWith(
            "abc123",
            expect.objectContaining({ references: ["10.5194/gmd-10-1403-2017"] }),
        );
    });
});

describe("articleCreateFormController", () => {
    it("sends references on edit only when the DOI changed", () => {
        expect(getEditedReferences(false, "", "")).toBeNull();
        expect(getEditedReferences(true, "doi:10.1000/xyz", "10.1000/xyz")).toBeNull();
        expect(getEditedReferences(true, "10.1000/abc", "10.1000/xyz")).toEqual(["10.1000/abc"]);
        expect(getEditedReferences(true, "10.1000/abc", "")).toEqual(["10.1000/abc"]);
    });

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

    it("accepts only complete, non-empty drafts", () => {
        const draft = { scientific: false, title: "T", content: "", doi: "", complexity: "SIMPLE", savedAt: "2026-10-07T10:00:00.000Z" };

        expect(parseDraft(JSON.stringify(draft))?.title).toBe("T");
        expect(parseDraft(null)).toBeNull();
        expect(parseDraft("{not json")).toBeNull();
        expect(parseDraft(JSON.stringify({ ...draft, complexity: "HARD" }))).toBeNull();
        expect(parseDraft(JSON.stringify({ ...draft, title: " " }))).toBeNull();
        expect(getDraftKey(null)).toBeNull();
    });

    it("builds markdown content from DOI metadata and skips blank parts", () => {
        const labels = { authors: "Authors", abstract: "Abstract" };
        const base = { doi: "10.1000/xyz", title: "", authors: [], description: null };

        expect(buildMetadataContent(base, labels)).toBe("");
        expect(buildMetadataContent(null, labels)).toBe("");
        expect(buildMetadataContent({ ...base, authors: ["A", " "] }, labels)).toBe("**Authors:** A");
        expect(buildMetadataContent({ ...base, description: " Text " }, labels)).toBe("## Abstract\n\nText");
    });

    it("fills only empty fields and reports what happened", () => {
        expect(fillIfEmpty("", "fetched")).toBe("fetched");
        expect(fillIfEmpty("  ", "fetched")).toBe("fetched");
        expect(fillIfEmpty("mine", "fetched")).toBe("mine");
        expect(fillIfEmpty("", "")).toBe("");

        const empty = { title: "", content: "" };
        expect(getDoiMetadataMessage(empty, empty)).toBe("empty");
        expect(getDoiMetadataMessage(empty, { title: "T", content: "" })).toBe("filled");
        expect(getDoiMetadataMessage({ title: "Mine", content: "" }, { title: "T", content: "C" })).toBe("kept");
        expect(getDoiMetadataMessage({ title: "", content: "Mine" }, { title: "T", content: "" })).toBe("filled");
    });
});
