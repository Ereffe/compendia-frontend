import type { Dispatch, SetStateAction } from "react";
import type React from "react";

import { createArticleAction } from "@/app/actions/articles";
import type { ArticleComplexity } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";

type CreateHandleArticleSubmitParams = {
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

/** Labels come from the `complexity` translation namespace. */
export const COMPLEXITY_OPTIONS: ArticleComplexity[] = ["SIMPLE", "INTERMEDIATE", "COMPLEX"];

export const createHandleArticleSubmit =
    ({
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
                const result = await createArticleAction({
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
                setError("createArticleFailed");
                setIsSubmitting(false);
            }
        };
