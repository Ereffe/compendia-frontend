import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import ArticleCreateForm from "./articleCreateForm";
import {
    addReferences,
    buildMetadataContent,
    fillIfEmpty,
    getDoiMetadataMessage,
    getEditedReferences,
    moveReference,
    normalizeDoi,
    removeReference,
    resolveSubmittedReferences,
    validateArticleFormInputs,
} from "./articleCreateFormController";
import { getDraftKey, parseDraft } from "./articleDraft";

const createArticleAction = vi.fn();
const editArticleAction = vi.fn();
const fetchDoiRecord = vi.fn();

vi.mock("@/components/articles/articleGraph/doiMetadata", () => ({
    fetchDoiRecord: (...args: unknown[]) => fetchDoiRecord(...args),
}));

const notFoundRecord = { node: null, references: [] };

const recordFor = (doi: string, title: string, authors: string[] = [], description: string | null = null) => ({
    node: { doi, title, authors, description, url: `https://doi.org/${doi}` },
    references: [],
});

vi.mock("next-themes", () => ({
    useTheme: () => ({ resolvedTheme: "dark" }),
}));

const uploadImageAction = vi.fn();

vi.mock("@/app/actions/assets", () => ({
    uploadImageAction: (...args: unknown[]) => uploadImageAction(...args),
}));

const startPdfImportAction = vi.fn();
const getPdfImportStatusAction = vi.fn();

vi.mock("@/app/actions/pdfImport", () => ({
    startPdfImportAction: (...args: unknown[]) => startPdfImportAction(...args),
    getPdfImportStatusAction: (...args: unknown[]) => getPdfImportStatusAction(...args),
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
            textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
        }) {
            return (
                <textarea
                    aria-label="markdown-editor"
                    id={textareaProps?.id}
                    onPaste={textareaProps?.onPaste}
                    onDrop={textareaProps?.onDrop}
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

const referenceInput = () => screen.getByLabelText("Dodaj źródło po DOI");

const referenceList = () => screen.getByRole("list", { name: "Źródła" });

const addDois = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
    await user.type(referenceInput(), value);
    await user.click(screen.getByRole("button", { name: "Dodaj" }));
};

describe("ArticleCreateForm", () => {
    it("renders the form and submits a new article", async () => {
        const user = userEvent.setup();
        createArticleAction.mockReturnValue(new Promise(() => {}));

        renderWithIntl(<ArticleCreateForm />);

        expect(screen.getByLabelText("Tytuł")).toBeInTheDocument();
        expect(screen.queryByLabelText("Dodaj źródło po DOI")).not.toBeInTheDocument();
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
            uploadedImages: [],
        });
        expect(screen.getByRole("button", { name: /Tworzenie/ })).toBeDisabled();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("requires at least one reference for scientific articles", async () => {
        const user = userEvent.setup();

        renderWithIntl(<ArticleCreateForm />);
        await user.click(screen.getByRole("radio", { name: /Artykuł naukowy/ }));
        await user.type(screen.getByLabelText("Tytuł"), "Recenzja");
        await user.type(screen.getByLabelText("markdown-editor"), "Komentarz");
        await user.click(screen.getByRole("button", { name: "Utwórz artykuł" }));

        expect(screen.getByRole("alert")).toHaveTextContent("Dodaj co najmniej jedno DOI");
        expect(createArticleAction).not.toHaveBeenCalled();
    });

    it("adds several DOIs at once, previews them and sends them normalized in order", async () => {
        const user = userEvent.setup();
        createArticleAction.mockReturnValue(new Promise(() => {}));
        fetchDoiRecord.mockImplementation(async (doi: string) =>
            doi === "10.1038/nature12373" ? recordFor(doi, "Nanometre-scale thermometry", ["Kucsko, G."]) : notFoundRecord,
        );

        renderWithIntl(<ArticleCreateForm />);
        await user.click(screen.getByRole("radio", { name: /Artykuł naukowy/ }));
        await user.type(screen.getByLabelText("Tytuł"), "Recenzja");
        await user.type(screen.getByLabelText("markdown-editor"), "Komentarz");

        await addDois(user, "nie-doi");
        expect(screen.getByRole("alert")).toHaveTextContent("Nieprawidłowy numer DOI");
        expect(screen.queryByRole("list", { name: "Źródła" })).not.toBeInTheDocument();

        await user.clear(referenceInput());
        await addDois(user, "https://doi.org/10.1038/nature12373 doi:10.1000/xyz,");

        expect(referenceInput()).toHaveValue("");
        expect(within(referenceList()).getAllByRole("listitem")).toHaveLength(2);
        expect(await screen.findByRole("link", { name: /Nanometre-scale thermometry/ })).toHaveAttribute(
            "href",
            "https://doi.org/10.1038/nature12373",
        );
        expect(screen.getByText("Kucsko, G.")).toBeInTheDocument();
        expect(await screen.findByText(/Nie znaleziono danych tej publikacji/)).toBeInTheDocument();
        expect(screen.getAllByText("2 źródła").length).toBeGreaterThan(0);

        await addDois(user, "10.1000/XYZ");
        expect(screen.getByRole("alert")).toHaveTextContent("Te DOI są już na liście źródeł.");

        await user.clear(referenceInput());
        await user.type(referenceInput(), "10.5194/acp-18-1-2018");
        await user.click(screen.getByRole("button", { name: "Utwórz artykuł" }));

        expect(createArticleAction).toHaveBeenCalledWith(
            expect.objectContaining({ references: ["10.1038/nature12373", "10.1000/xyz", "10.5194/acp-18-1-2018"] }),
        );
    });

    it("adds a DOI with Enter instead of submitting the form", async () => {
        const user = userEvent.setup();
        fetchDoiRecord.mockResolvedValue(notFoundRecord);

        renderWithIntl(<ArticleCreateForm />);
        await user.click(screen.getByRole("radio", { name: /Artykuł naukowy/ }));
        await user.type(referenceInput(), "10.1000/xyz{Enter}");

        expect(within(referenceList()).getAllByRole("listitem")).toHaveLength(1);
        expect(createArticleAction).not.toHaveBeenCalled();
    });

    it("reorders and removes references", async () => {
        const user = userEvent.setup();
        createArticleAction.mockReturnValue(new Promise(() => {}));
        fetchDoiRecord.mockResolvedValue(notFoundRecord);

        renderWithIntl(<ArticleCreateForm />);
        await user.click(screen.getByRole("radio", { name: /Artykuł naukowy/ }));
        await user.type(screen.getByLabelText("Tytuł"), "T");
        await user.type(screen.getByLabelText("markdown-editor"), "C");
        await addDois(user, "10.1000/a 10.1000/b 10.1000/c");

        expect(screen.getByRole("button", { name: "Przesuń wyżej: 10.1000/a" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Przesuń niżej: 10.1000/c" })).toBeDisabled();
        await user.click(screen.getByRole("button", { name: "Przesuń wyżej: 10.1000/c" }));
        await user.click(screen.getByRole("button", { name: "Usuń źródło: 10.1000/a" }));
        await user.click(screen.getByRole("button", { name: "Utwórz artykuł" }));

        expect(createArticleAction).toHaveBeenCalledWith(expect.objectContaining({ references: ["10.1000/c", "10.1000/b"] }));
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
    const doi = "10.5194/acp-18-1-2018";
    const record = recordFor(doi, "Aerosol over the Arctic", ["Anna Nowak", " Jan Kowalski "], "We measure aerosols.");

    const openScientificForm = async (user: ReturnType<typeof userEvent.setup>) => {
        renderWithIntl(<ArticleCreateForm />);
        await user.click(screen.getByRole("radio", { name: /Artykuł naukowy/ }));
        await addDois(user, `https://doi.org/${doi}`);
    };

    const clickFill = async (user: ReturnType<typeof userEvent.setup>) => {
        const fill = screen.getByRole("button", { name: `Uzupełnij z DOI ${doi}` });
        await waitFor(() => expect(fill).toBeEnabled());
        await user.click(fill);
    };

    it("fills the empty title and content from a reference", async () => {
        const user = userEvent.setup();
        fetchDoiRecord.mockResolvedValue(record);

        await openScientificForm(user);
        await clickFill(user);

        expect(fetchDoiRecord).toHaveBeenCalledWith(doi);
        expect(screen.getByLabelText("Tytuł")).toHaveValue("Aerosol over the Arctic");
        expect(screen.getByLabelText("markdown-editor")).toHaveValue(
            "**Autorzy:** Anna Nowak, Jan Kowalski\n\n## Streszczenie\n\nWe measure aerosols.",
        );
        expect(screen.getByRole("status")).toHaveTextContent("Uzupełniono tytuł i treść");
    });

    it("keeps fields the user already filled in", async () => {
        const user = userEvent.setup();
        fetchDoiRecord.mockResolvedValue(record);

        await openScientificForm(user);
        await user.type(screen.getByLabelText("Tytuł"), "Mój tytuł");
        await clickFill(user);

        expect(screen.getByLabelText("Tytuł")).toHaveValue("Mój tytuł");
        expect((screen.getByLabelText("markdown-editor") as HTMLTextAreaElement).value).toContain("We measure aerosols.");
        expect(screen.getByRole("status")).toHaveTextContent("zostały bez zmian");
    });

    it("reports when the publication has no details", async () => {
        const user = userEvent.setup();
        fetchDoiRecord.mockResolvedValue(notFoundRecord);

        await openScientificForm(user);
        await clickFill(user);

        expect(screen.getByLabelText("Tytuł")).toHaveValue("");
        expect(screen.getByRole("status")).toHaveTextContent("Nie znaleziono danych dla tego DOI.");
    });
});

describe("ArticleCreateForm draft autosave", () => {
    const draftKey = getDraftKey("u1") as string;
    const storedDraft = {
        scientific: true,
        title: "Szkic recenzji",
        content: "Zapisana treść",
        references: ["10.1000/xyz", "10.1000/abc"],
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
        expect(within(referenceList()).getAllByRole("listitem")).toHaveLength(2);
        expect(screen.getByRole("radio", { name: /Zaawansowane/ })).toBeChecked();
    });

    it("restores an older draft that stored a single DOI", async () => {
        const user = userEvent.setup();
        localStorage.setItem(draftKey, JSON.stringify({ ...storedDraft, references: undefined, doi: "10.1000/xyz" }));

        renderWithIntl(<ArticleCreateForm draftOwnerId="u1" />);
        await user.click(screen.getByRole("button", { name: "Przywróć szkic" }));

        expect(within(referenceList()).getByText("doi:10.1000/xyz")).toBeInTheDocument();
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
                article={{ id: "abc123", title: "T", content: "C", complexity: "SIMPLE", references: [] }}
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
        references: [] as string[],
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
            uploadedImages: [],
        });
        expect(createArticleAction).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: /Zapisywanie/ })).toBeDisabled();
    });

    it("only sends changed references and lets the author remove all of them", async () => {
        const user = userEvent.setup();
        editArticleAction.mockResolvedValue({ ok: false, error: "forbidden" });
        fetchDoiRecord.mockResolvedValue(notFoundRecord);

        renderWithIntl(<ArticleCreateForm article={{ ...regularArticle, references: ["10.5194/acp-18-1-2018"] }} />);

        expect(screen.getByRole("radio", { name: /Artykuł naukowy/ })).toBeChecked();

        await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
        expect(editArticleAction).toHaveBeenLastCalledWith("abc123", expect.objectContaining({ references: null }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Nie masz uprawnień do tej operacji.");

        await addDois(user, "https://doi.org/10.5194/gmd-10-1403-2017");
        await user.click(screen.getByRole("button", { name: "Usuń źródło: 10.5194/acp-18-1-2018" }));
        await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
        expect(editArticleAction).toHaveBeenLastCalledWith(
            "abc123",
            expect.objectContaining({ references: ["10.5194/gmd-10-1403-2017"] }),
        );

        await user.click(screen.getByRole("radio", { name: /Zwykły artykuł/ }));
        await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
        expect(editArticleAction).toHaveBeenLastCalledWith("abc123", expect.objectContaining({ references: [] }));
    });
});

describe("ArticleCreateForm images", () => {
    const ASSET_ID = "0b6f3c1e-2f4a-4c8e-9d1a-5e7b8c9d0a1b";
    const png = (name = "wykres.png") => new File(["x"], name, { type: "image/png" });

    it("uploads a chosen image and inserts its link at the cursor", async () => {
        const user = userEvent.setup();
        let finish: (value: unknown) => void = () => {};
        uploadImageAction.mockReturnValue(new Promise((resolve) => (finish = resolve)));
        createArticleAction.mockReturnValue(new Promise(() => {}));

        renderWithIntl(<ArticleCreateForm />);
        await user.type(screen.getByLabelText("Tytuł"), "Z obrazem");
        await user.type(screen.getByLabelText("markdown-editor"), "Wstęp");
        await user.upload(screen.getByLabelText("Wstaw obraz"), png());

        expect((screen.getByLabelText("markdown-editor") as HTMLTextAreaElement).value).toMatch(/^Wstęp!\[wykres\]\(compendia-upload:[a-z0-9]+\)$/);
        expect(screen.getByText("Wysyłanie obrazu…")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Utwórz artykuł" })).toBeDisabled();

        finish({ ok: true, data: { assetId: ASSET_ID } });
        await waitFor(() =>
            expect(screen.getByLabelText("markdown-editor")).toHaveValue(`Wstęp![wykres](/api/v1/articles/assets/${ASSET_ID})`),
        );
        expect((uploadImageAction.mock.calls[0][0] as FormData).get("image")).toBeInstanceOf(File);

        await user.click(screen.getByRole("button", { name: "Utwórz artykuł" }));
        expect(createArticleAction).toHaveBeenCalledWith(
            expect.objectContaining({ content: `Wstęp![wykres](/api/v1/articles/assets/${ASSET_ID})`, uploadedImages: [ASSET_ID] }),
        );
    });

    it("uploads pasted images and reports failures", async () => {
        uploadImageAction.mockResolvedValue({ ok: false, error: "imageUploadFailed" });

        renderWithIntl(<ArticleCreateForm />);
        fireEvent.paste(screen.getByLabelText("markdown-editor"), { clipboardData: { files: [png("image.png")] } });

        expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się wysłać obrazu.");
        expect(screen.getByLabelText("markdown-editor")).toHaveValue("");
        expect(uploadImageAction).toHaveBeenCalledTimes(1);
    });
});

describe("ArticleCreateForm PDF import", () => {
    const pdf = () => new File(["%PDF-1.7"], "praca.pdf", { type: "application/pdf" });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("accepts a PDF, shows it and lets the user remove it", async () => {
        const user = userEvent.setup();
        renderWithIntl(<ArticleCreateForm />);

        await user.upload(screen.getByLabelText("Import z PDF"), pdf());

        expect(await screen.findByText("praca.pdf")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Utwórz artykuł z PDF" })).toBeInTheDocument();
        const removeButtons = screen.getAllByRole("button", { name: "Usuń plik praca.pdf" });
        expect(removeButtons).toHaveLength(2);
        await user.click(removeButtons[1]);
        expect(screen.queryByText("praca.pdf")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Utwórz artykuł" })).toBeInTheDocument();
    });

    it("rejects files that aren't PDFs", async () => {
        const user = userEvent.setup({ applyAccept: false });
        renderWithIntl(<ArticleCreateForm />);

        await user.upload(screen.getByLabelText("Import z PDF"), new File(["x"], "notatki.txt", { type: "text/plain" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("To nie jest plik PDF.");
        expect(screen.queryByText("notatki.txt")).not.toBeInTheDocument();
    });

    it("needs only a title, uploads the PDF and polls the import job", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        startPdfImportAction.mockResolvedValue({ ok: true, data: { jobId: "job-1" } });
        getPdfImportStatusAction.mockResolvedValue({ ok: true, data: { status: "PROCESSING" } });

        renderWithIntl(<ArticleCreateForm />);
        await user.upload(screen.getByLabelText("Import z PDF"), pdf());
        await user.click(await screen.findByRole("button", { name: "Utwórz artykuł z PDF" }));

        expect(screen.getByRole("alert")).toHaveTextContent("Podaj tytuł artykułu.");
        expect(startPdfImportAction).not.toHaveBeenCalled();

        await user.type(screen.getByLabelText("Tytuł"), "Z pliku");
        await user.click(screen.getByRole("radio", { name: /Średnie/ }));
        await user.click(screen.getByRole("button", { name: "Utwórz artykuł z PDF" }));

        const formData = startPdfImportAction.mock.calls[0][0] as FormData;
        expect(formData.get("title")).toBe("Z pliku");
        expect(formData.get("complexity")).toBe("INTERMEDIATE");
        expect((formData.get("pdf") as File).name).toBe("praca.pdf");
        expect(screen.getByRole("button", { name: /Tworzenie z PDF/ })).toBeDisabled();
        expect(screen.getByText(/Czeka w kolejce/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Usuń plik praca.pdf" })).toBeDisabled();

        await vi.advanceTimersByTimeAsync(4000);
        expect(getPdfImportStatusAction).toHaveBeenCalledWith("job-1");
        expect(await screen.findByText(/Przetwarzanie PDF/)).toBeInTheDocument();
    });

    it("shows a failed import and lets the user try again", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        startPdfImportAction.mockResolvedValue({ ok: true, data: { jobId: "job-1" } });
        getPdfImportStatusAction.mockResolvedValue({ ok: false, error: "pdfImportFailed" });

        renderWithIntl(<ArticleCreateForm />);
        await user.type(screen.getByLabelText("Tytuł"), "Z pliku");
        await user.upload(screen.getByLabelText("Import z PDF"), pdf());
        await user.click(await screen.findByRole("button", { name: "Utwórz artykuł z PDF" }));
        await vi.advanceTimersByTimeAsync(4000);

        expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się utworzyć artykułu z PDF.");
        expect(screen.getByRole("button", { name: "Utwórz artykuł z PDF" })).toBeEnabled();
    });

    it("shows upload errors from the backend", async () => {
        const user = userEvent.setup();
        startPdfImportAction.mockResolvedValue({ ok: false, error: "pdfImportBusy" });

        renderWithIntl(<ArticleCreateForm />);
        await user.type(screen.getByLabelText("Tytuł"), "Z pliku");
        await user.upload(screen.getByLabelText("Import z PDF"), pdf());
        await user.click(await screen.findByRole("button", { name: "Utwórz artykuł z PDF" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Serwer jest teraz zajęty.");
        expect(getPdfImportStatusAction).not.toHaveBeenCalled();
    });

    it("isn't shown when editing", () => {
        renderWithIntl(
            <ArticleCreateForm article={{ id: "abc123", title: "T", content: "C", complexity: "SIMPLE", references: [] }} />,
        );

        expect(screen.queryByLabelText("Import z PDF")).not.toBeInTheDocument();
    });
});

describe("articleCreateFormController", () => {

    it("sends references on edit only when they changed", () => {
        expect(getEditedReferences(false, [], [])).toBeNull();
        expect(getEditedReferences(true, ["10.1000/XYZ"], ["10.1000/xyz"])).toBeNull();
        expect(getEditedReferences(true, ["10.1000/abc"], ["10.1000/xyz"])).toEqual(["10.1000/abc"]);
        expect(getEditedReferences(true, ["10.1000/abc"], [])).toEqual(["10.1000/abc"]);
        expect(getEditedReferences(true, ["10.1000/b", "10.1000/a"], ["10.1000/a", "10.1000/b"])).toEqual([
            "10.1000/b",
            "10.1000/a",
        ]);
        expect(getEditedReferences(false, [], ["10.1000/a"])).toEqual([]);
    });

    it("adds pasted DOIs, skipping duplicates and rejecting invalid input", () => {
        expect(addReferences([], "10.1000/a\nhttps://doi.org/10.1000/b, doi:10.1000/a")).toEqual({
            references: ["10.1000/a", "10.1000/b"],
            error: null,
        });
        expect(addReferences(["10.1000/a"], "  ")).toEqual({ references: ["10.1000/a"], error: "missingDoi" });
        expect(addReferences(["10.1000/a"], "10.1000/b nope")).toEqual({ references: ["10.1000/a"], error: "invalidDoi" });
        expect(addReferences(["10.1000/a"], "10.1000/A")).toEqual({ references: ["10.1000/a"], error: "duplicateDoi" });
    });

    it("includes a pending DOI on submit but ignores a duplicate one", () => {
        expect(resolveSubmittedReferences(["10.1000/a"], "")).toEqual({ references: ["10.1000/a"], error: null });
        expect(resolveSubmittedReferences(["10.1000/a"], "10.1000/a")).toEqual({ references: ["10.1000/a"], error: null });
        expect(resolveSubmittedReferences(["10.1000/a"], "10.1000/b").references).toEqual(["10.1000/a", "10.1000/b"]);
        expect(resolveSubmittedReferences([], "x").error).toBe("invalidDoi");
    });

    it("moves and removes references", () => {
        const references = ["a", "b", "c"];
        expect(moveReference(references, 2, -1)).toEqual(["a", "c", "b"]);
        expect(moveReference(references, 0, -1)).toBe(references);
        expect(moveReference(references, 2, 1)).toBe(references);
        expect(removeReference(references, 1)).toEqual(["a", "c"]);
    });

    it("normalizes DOI links and prefixes", () => {
        expect(normalizeDoi(" https://doi.org/10.1000/xyz ")).toBe("10.1000/xyz");
        expect(normalizeDoi("doi: 10.1000/xyz")).toBe("10.1000/xyz");
        expect(normalizeDoi("10.1000/xyz")).toBe("10.1000/xyz");
    });

    it("validates scientific input", () => {
        expect(validateArticleFormInputs("", "x")).toBe("missingTitleOrContent");
        expect(validateArticleFormInputs("t", "c", true, [])).toBe("missingDoi");
        expect(validateArticleFormInputs("t", "c", true, ["10.1000/xyz"])).toBeNull();
        expect(validateArticleFormInputs("t", "c", false, [])).toBeNull();
    });

    it("accepts only complete, non-empty drafts", () => {
        const draft = { scientific: false, title: "T", content: "", references: [], complexity: "SIMPLE", savedAt: "2026-10-07T10:00:00.000Z" };

        expect(parseDraft(JSON.stringify(draft))?.title).toBe("T");
        expect(parseDraft(null)).toBeNull();
        expect(parseDraft("{not json")).toBeNull();
        expect(parseDraft(JSON.stringify({ ...draft, complexity: "HARD" }))).toBeNull();
        expect(parseDraft(JSON.stringify({ ...draft, title: " " }))).toBeNull();
        expect(parseDraft(JSON.stringify({ ...draft, references: [1] }))).toBeNull();
        expect(parseDraft(JSON.stringify({ ...draft, title: "", references: ["10.1000/a"] }))?.references).toEqual(["10.1000/a"]);
        expect(getDraftKey(null)).toBeNull();
    });

    it("builds markdown content from DOI metadata and skips blank parts", () => {
        const labels = { authors: "Authors", abstract: "Abstract" };
        const base = { title: "", authors: [], description: null };

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
