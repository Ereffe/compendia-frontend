import type { ErrorKey } from "@/types/errors";

export type ArticleComplexity = "SIMPLE" | "INTERMEDIATE" | "COMPLEX";

export type ArticleRating = {
    positive: number;
    negative: number;
};

export type ArticleSearchItem = {
    id: string;
    title: string;
    datePosted: string;
    author: string | null;
    content: string;
    complexity: string | null;
    rating: ArticleRating | null;
};

export type ArticleReference = {
    doi: string;
    title: string;
    authors: string[];
    description?: string | null;
    url: string;
};

export type ActionError = { ok: false; error: ErrorKey };

export type ActionResult<T> = { ok: true; data: T } | ActionError;
