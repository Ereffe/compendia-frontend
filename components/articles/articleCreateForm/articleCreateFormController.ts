import type { Dispatch, SetStateAction } from "react";
import type React from "react";

import { createArticleAction, editArticleAction } from "@/app/actions/articles";
import { startPdfImportAction } from "@/app/actions/pdfImport";
import { type GraphNode, normalizeDoi } from "@/components/articles/articleGraph/articleGraphController";
import { COMPLEXITIES, TITLE_MAX_LENGTH } from "@/lib/schemas";
import type { ArticleComplexity } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";

export { normalizeDoi };

export type EditableArticle = {
    id: string;
    title: string;
    content: string;
    complexity: ArticleComplexity;
    references: string[];
};

type CreateHandleArticleSubmitParams = {
    editedArticle?: EditableArticle;
    scientific: boolean;
    title: string;
    content: string;
    references: string[];
    pendingDoiInput: string;
    complexity: ArticleComplexity;
    pdfFile?: File | null;
    isSubmitting: boolean;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
    onSubmitStart?: () => void;
    onPdfImportStarted?: (jobId: string) => void;
};

const startPdfImport = async ({
    pdfFile,
    title,
    complexity,
    setIsSubmitting,
    setError,
    onSubmitStart,
    onPdfImportStarted,
}: CreateHandleArticleSubmitParams & { pdfFile: File }) => {
    if (!title.trim()) {
        setError("missingTitle");
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        formData.append("title", title.trim());
        formData.append("complexity", complexity);
        const result = await startPdfImportAction(formData);
        if (!result) return;
        if (!result.ok) {
            setError(result.error);
            setIsSubmitting(false);
            return;
        }
        onSubmitStart?.();
        onPdfImportStarted?.(result.data.jobId);
    } catch {
        setError("pdfImportFailed");
        setIsSubmitting(false);
    }
};

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/;

export const validateDoi = (doi: string): ErrorKey | null => {
    const normalizedDoi = normalizeDoi(doi);
    if (!normalizedDoi) {
        return "missingDoi";
    }
    return DOI_PATTERN.test(normalizedDoi) ? null : "invalidDoi";
};

export const isSameDoi = (a: string, b: string) => normalizeDoi(a).toLowerCase() === normalizeDoi(b).toLowerCase();

export type AddReferencesResult = { references: string[]; error: ErrorKey | null };

export const addReferences = (references: string[], input: string): AddReferencesResult => {
    const tokens = input.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return { references, error: "missingDoi" };
    if (tokens.some((token) => validateDoi(token))) return { references, error: "invalidDoi" };

    const next = [...references];
    for (const doi of tokens.map(normalizeDoi)) {
        if (!next.some((existing) => isSameDoi(existing, doi))) next.push(doi);
    }
    return next.length === references.length ? { references, error: "duplicateDoi" } : { references: next, error: null };
};

export const resolveSubmittedReferences = (references: string[], pendingInput: string): AddReferencesResult => {
    if (!pendingInput.trim()) return { references, error: null };
    const result = addReferences(references, pendingInput);
    return result.error === "duplicateDoi" ? { references, error: null } : result;
};

export const moveReference = (references: string[], index: number, offset: number): string[] => {
    const target = index + offset;
    if (target < 0 || target >= references.length) return references;
    const next = [...references];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
};

export const removeReference = (references: string[], index: number): string[] =>
    references.filter((_, position) => position !== index);

export const areReferencesEqual = (a: string[], b: string[]) =>
    a.length === b.length && a.every((doi, index) => isSameDoi(doi, b[index]));

export const validateArticleFormInputs = (
    title: string,
    content: string,
    scientific = false,
    references: string[] = [],
): ErrorKey | null => {
    if (!title.trim() || !content.trim()) {
        return "missingTitleOrContent";
    }

    return scientific && references.length === 0 ? "missingDoi" : null;
};

export { TITLE_MAX_LENGTH };

export const COMPLEXITY_OPTIONS: ArticleComplexity[] = [...COMPLEXITIES];

// Re-sending unchanged DOIs makes the backend look them up again, and a failed lookup drops the reference.
export const getEditedReferences = (scientific: boolean, references: string[], initialReferences: string[]): string[] | null => {
    if (!scientific || references.length === 0 || areReferencesEqual(references, initialReferences)) return null;
    return references;
};

const submitArticle = async ({
    editedArticle,
    scientific,
    title,
    content,
    references,
    pendingDoiInput,
    complexity,
    setIsSubmitting,
    setError,
    onSubmitStart,
}: CreateHandleArticleSubmitParams) => {
    const submitted = scientific
        ? resolveSubmittedReferences(references, pendingDoiInput)
        : { references: [], error: null };
    const validationError = submitted.error ?? validateArticleFormInputs(title, content, scientific, submitted.references);
    if (validationError) {
        setError(validationError);
        return;
    }

    setIsSubmitting(true);
    setError(null);
    onSubmitStart?.();

    try {
        const result = editedArticle
            ? await editArticleAction(editedArticle.id, {
                title,
                content,
                complexity,
                references: getEditedReferences(scientific, submitted.references, editedArticle.references),
            })
            : await createArticleAction({
                title,
                content,
                complexity,
                references: submitted.references,
            });

        if (result && !result.ok) {
            setError(result.error);
            setIsSubmitting(false);
        }
    } catch {
        setError(editedArticle ? "editArticleFailed" : "createArticleFailed");
        setIsSubmitting(false);
    }
};

export const createHandleArticleSubmit =
    (params: CreateHandleArticleSubmitParams) =>
        async (event: React.SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (params.isSubmitting) return;
            if (params.pdfFile && !params.editedArticle) {
                await startPdfImport({ ...params, pdfFile: params.pdfFile });
                return;
            }
            await submitArticle(params);
        };

export type DoiMetadata = Pick<GraphNode, "title" | "authors" | "description">;

export type DoiMetadataLabels = { authors: string; abstract: string };

export type DoiMetadataMessage = "filled" | "kept" | "empty";

export const getMetadataTitle = (metadata: DoiMetadata | null): string =>
    (metadata?.title ?? "").trim().slice(0, TITLE_MAX_LENGTH);

export const buildMetadataContent = (metadata: DoiMetadata | null, labels: DoiMetadataLabels): string => {
    const authors = (metadata?.authors ?? []).map((author) => author.trim()).filter(Boolean);
    const abstract = metadata?.description?.trim();
    return [
        authors.length > 0 ? `**${labels.authors}:** ${authors.join(", ")}` : "",
        abstract ? `## ${labels.abstract}\n\n${abstract}` : "",
    ]
        .filter(Boolean)
        .join("\n\n");
};

export const fillIfEmpty = (current: string, fetched: string): string => (current.trim() || !fetched ? current : fetched);

export const getDoiMetadataMessage = (
    current: { title: string; content: string },
    fetched: { title: string; content: string },
): DoiMetadataMessage => {
    if (!fetched.title && !fetched.content) return "empty";
    const keptTitle = Boolean(fetched.title && current.title.trim());
    const keptContent = Boolean(fetched.content && current.content.trim());
    return keptTitle || keptContent ? "kept" : "filled";
};

type CreateHandleFillFromMetadataParams = {
    title: string;
    content: string;
    labels: DoiMetadataLabels;
    setTitle: Dispatch<SetStateAction<string>>;
    setContent: Dispatch<SetStateAction<string>>;
    setMessage: Dispatch<SetStateAction<DoiMetadataMessage | null>>;
};

export const createHandleFillFromMetadata =
    ({ title, content, labels, setTitle, setContent, setMessage }: CreateHandleFillFromMetadataParams) =>
        (metadata: DoiMetadata | null) => {
            const fetched = { title: getMetadataTitle(metadata), content: buildMetadataContent(metadata, labels) };
            setTitle((current) => fillIfEmpty(current, fetched.title));
            setContent((current) => fillIfEmpty(current, fetched.content));
            setMessage(getDoiMetadataMessage({ title, content }, fetched));
        };
