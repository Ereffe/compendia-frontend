import type { ErrorKey } from "@/types/errors";

export type ArticleComplexity = "SIMPLE" | "INTERMEDIATE" | "COMPLEX";

/** Article shape used by cards and the search modal. Dates stay ISO strings and are formatted per locale when rendered. */
export type ArticleSearchItem = {
    id: string;
    title: string;
    datePosted: string;
    author: string | null;
    content: string;
};

export type ArticleReference = {
    doi: string;
    title: string;
    authors: string[];
    description?: string | null;
    url: string;
};

/** Server Actions return a translation key on failure; the client renders it with `t(\`errors.${key}\`)`. */
export type ActionError = { ok: false; error: ErrorKey };

export type ActionResult<T> = { ok: true; data: T } | ActionError;
