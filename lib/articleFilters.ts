import { isKnownComplexity } from "@/lib/articleComplexity";
import type { ArticleComplexity, ArticleRating } from "@/types/articles";

export const ARTICLE_SORTS = ["newest", "top", "mostRated"] as const;
export type ArticleSort = (typeof ARTICLE_SORTS)[number];

export type ArticleFilters = {
    sort: ArticleSort;
    level: ArticleComplexity | null;
};

type SearchParam = string | string[] | undefined;

const first = (value: SearchParam) => (Array.isArray(value) ? value[0] : value);

export const parseArticleFilters = (params: { sort?: SearchParam; level?: SearchParam }): ArticleFilters => {
    const sort = first(params.sort);
    const level = first(params.level)?.toUpperCase();
    return {
        sort: ARTICLE_SORTS.includes(sort as ArticleSort) ? (sort as ArticleSort) : "newest",
        level: level && isKnownComplexity(level) ? level : null,
    };
};

export const articleFiltersHref = ({ sort, level }: ArticleFilters): string => {
    const params = new URLSearchParams();
    if (sort !== "newest") params.set("sort", sort);
    if (level) params.set("level", level);
    const query = params.toString();
    return query ? `/articles?${query}` : "/articles";
};

export const ARTICLE_SORT_FIELDS: Record<ArticleSort, string> = {
    newest: "datePosted",
    top: "rating",
    mostRated: "ratingCount",
};

export const isRated = (rating: ArticleRating) => rating.positive + rating.negative > 0;
