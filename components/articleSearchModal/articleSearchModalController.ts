import getBrowserClient from "@/lib/apolloBrowser";
import {
    ARTICLES_QUERY,
    type GraphqlArticleSummary,
    mapArticleToSearchItem,
    type PagedArticles,
} from "@/services/graphql/articles";
import type { ArticleSearchItem } from "@/types/articles";

export type { ArticleSearchItem } from "@/types/articles";

export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_MIN_LENGTH = 2;
const SEARCH_RESULTS_LIMIT = 20;

/** Full-text search on the backend (title and content). `articles` is a public query. */
export const searchArticles = async (query: string): Promise<{ items: ArticleSearchItem[]; total: number }> => {
    const result = await getBrowserClient().query<{ articles: PagedArticles<GraphqlArticleSummary> }>({
        query: ARTICLES_QUERY,
        variables: { search: query.trim(), page: 0, size: SEARCH_RESULTS_LIMIT },
        fetchPolicy: "network-only",
    });

    const articles = result.data?.articles;
    return {
        items: (articles?.content ?? []).map(mapArticleToSearchItem),
        total: articles?.totalElements ?? 0,
    };
};

export const shouldSearch = (query: string): boolean => query.trim().length >= SEARCH_MIN_LENGTH;
