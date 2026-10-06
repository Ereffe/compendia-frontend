import type { Dispatch, SetStateAction } from "react";
import type React from "react";

import { createArticleAction, editArticleAction } from "@/app/actions/articles";
import getBrowserClient from "@/lib/apolloBrowser";
import type { GetScienceArticleMetadataQuery } from "@/services/graphql/generated/graphql";
import { SCIENCE_ARTICLE_METADATA_QUERY } from "@/services/graphql/graph";
import type { ArticleComplexity } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";

export type EditableArticle = {
    id: string;
    title: string;
    content: string;
    complexity: ArticleComplexity;
    doi: string;
};

type CreateHandleArticleSubmitParams = {
    editedArticle?: EditableArticle;
    scientific: boolean;
    title: string;
    content: string;
    doi: string;
    complexity: ArticleComplexity;
    isSubmitting: boolean;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
    onSubmitStart?: () => void;
};

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/;

export const normalizeDoi = (value: string): string =>
    value.trim().replace(/^(?:https?:\/\/)?(?:dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");

export const validateDoi = (doi: string): ErrorKey | null => {
    const normalizedDoi = normalizeDoi(doi);
    if (!normalizedDoi) {
        return "missingDoi";
    }
    return DOI_PATTERN.test(normalizedDoi) ? null : "invalidDoi";
};

export const validateArticleFormInputs = (
    title: string,
    content: string,
    scientific = false,
    doi = "",
): ErrorKey | null => {
    if (!title.trim() || !content.trim()) {
        return "missingTitleOrContent";
    }

    return scientific ? validateDoi(doi) : null;
};

/** Matches the backend column (articles.title VARCHAR(200)). */
export const TITLE_MAX_LENGTH = 200;

export const COMPLEXITY_OPTIONS: ArticleComplexity[] = ["SIMPLE", "INTERMEDIATE", "COMPLEX"];

// Re-sending an unchanged DOI makes the backend look it up again, and a failed lookup drops the reference.
export const getEditedReferences = (scientific: boolean, doi: string, initialDoi: string): string[] | null => {
    if (!scientific) return null;
    const normalizedDoi = normalizeDoi(doi);
    return normalizedDoi === normalizeDoi(initialDoi) ? null : [normalizedDoi];
};

export const createHandleArticleSubmit =
    ({
        editedArticle,
        scientific,
        title,
        content,
        doi,
        complexity,
        isSubmitting,
        setIsSubmitting,
        setError,
        onSubmitStart,
    }: CreateHandleArticleSubmitParams) =>
        async (event: React.SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (isSubmitting) {
                return;
            }

            const validationError = validateArticleFormInputs(title, content, scientific, doi);
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
                        references: getEditedReferences(scientific, doi, editedArticle.doi),
                    })
                    : await createArticleAction({
                        title,
                        content,
                        complexity,
                        references: scientific ? [normalizeDoi(doi)] : [],
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

export type DoiMetadata = GetScienceArticleMetadataQuery["scienceArticleMetadata"];

export type DoiMetadataLabels = { authors: string; abstract: string };

export type DoiMetadataMessage = "filled" | "kept" | "empty";

export type DoiMetadataStatus = { kind: "info"; message: DoiMetadataMessage } | { kind: "error"; error: ErrorKey };

export const fetchDoiMetadata = async (doi: string): Promise<DoiMetadata | null> => {
    const result = await getBrowserClient().query({
        query: SCIENCE_ARTICLE_METADATA_QUERY,
        variables: { doi },
        fetchPolicy: "network-only",
    });
    return result.data?.scienceArticleMetadata ?? null;
};

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

type CreateHandleFetchDoiMetadataParams = {
    doi: string;
    title: string;
    content: string;
    labels: DoiMetadataLabels;
    isFetching: boolean;
    setIsFetching: Dispatch<SetStateAction<boolean>>;
    setTitle: Dispatch<SetStateAction<string>>;
    setContent: Dispatch<SetStateAction<string>>;
    setStatus: Dispatch<SetStateAction<DoiMetadataStatus | null>>;
};

export const createHandleFetchDoiMetadata =
    ({
        doi,
        title,
        content,
        labels,
        isFetching,
        setIsFetching,
        setTitle,
        setContent,
        setStatus,
    }: CreateHandleFetchDoiMetadataParams) =>
        async () => {
            if (isFetching) {
                return;
            }

            const doiError = validateDoi(doi);
            if (doiError) {
                setStatus({ kind: "error", error: doiError });
                return;
            }

            setIsFetching(true);
            setStatus(null);

            try {
                const metadata = await fetchDoiMetadata(normalizeDoi(doi));
                const fetched = { title: getMetadataTitle(metadata), content: buildMetadataContent(metadata, labels) };
                setTitle((current) => fillIfEmpty(current, fetched.title));
                setContent((current) => fillIfEmpty(current, fetched.content));
                setStatus({ kind: "info", message: getDoiMetadataMessage({ title, content }, fetched) });
            } catch {
                setStatus({ kind: "error", error: "doiMetadataFailed" });
            } finally {
                setIsFetching(false);
            }
        };
