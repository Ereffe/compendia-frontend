import type { Dispatch, SetStateAction } from "react";
import type React from "react";

import { createArticleAction, editArticleAction } from "@/app/actions/articles";
import type { ArticleComplexity } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";

/** The article being edited. Without it the form creates a new article. */
export type EditableArticle = {
    id: string;
    title: string;
    content: string;
    complexity: ArticleComplexity;
    /** DOI of the current reference, or "" for a regular article. */
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
};

// Crossref-style DOI: "10." + registrant code + "/" + suffix.
const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/;

/** Accepts bare DOIs as well as https://doi.org/... links and returns the bare DOI. */
export const normalizeDoi = (value: string): string =>
    value.trim().replace(/^(?:https?:\/\/)?(?:dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");

export const validateArticleFormInputs = (
    title: string,
    content: string,
    scientific = false,
    doi = "",
): ErrorKey | null => {
    if (!title.trim() || !content.trim()) {
        return "missingTitleOrContent";
    }

    if (scientific) {
        const normalizedDoi = normalizeDoi(doi);
        if (!normalizedDoi) {
            return "missingDoi";
        }
        if (!DOI_PATTERN.test(normalizedDoi)) {
            return "invalidDoi";
        }
    }

    return null;
};

/** Matches the backend column (articles.title VARCHAR(200)). */
export const TITLE_MAX_LENGTH = 200;

export const COMPLEXITY_OPTIONS: ArticleComplexity[] = ["SIMPLE", "INTERMEDIATE", "COMPLEX"];

/**
 * References to send when editing: a new DOI, or null to keep the current ones. Re-sending an unchanged
 * DOI would make the backend look it up again, and a failed lookup there drops the reference.
 */
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

            try {
                // On success the action redirects on the server and this call never yields a result.
                // Calling router.push + router.refresh here instead raced and cancelled the navigation.
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
