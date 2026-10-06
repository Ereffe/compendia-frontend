import type { Dispatch, SetStateAction } from "react";
import type React from "react";

import { createArticleAction, editArticleAction } from "@/app/actions/articles";
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
};

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/;

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
