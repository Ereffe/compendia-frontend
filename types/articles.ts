import type { ArticleComplexity, ArticleQuery, ArticlesQuery } from "@/services/graphql/generated/graphql";
import type { ErrorKey } from "@/types/errors";

export type { ArticleComplexity } from "@/services/graphql/generated/graphql";

export type ArticleRating = ArticlesQuery["articles"]["content"][number]["rating"];

export type ArticleSearchItem = {
    id: string;
    title: string;
    datePosted: string;
    author: string | null;
    authorId: string | null;
    content: string;
    complexity: ArticleComplexity;
    rating: ArticleRating;
    commentCount: number | null;
};

export type ArticleReference = NonNullable<NonNullable<ArticleQuery["article"]["references"]>[number]>;

export type ActionError = { ok: false; error: ErrorKey };

export type ActionResult<T> = { ok: true; data: T } | ActionError;
