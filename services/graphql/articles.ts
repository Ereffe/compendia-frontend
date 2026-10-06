import { gql } from "@apollo/client";

import type { ArticleReference, ArticleSearchItem } from "@/types/articles";
import type { GraphqlCommentItem } from "@/services/graphql/comments";

export type GraphqlArticleSummary = {
    id: string;
    title: string;
    content: string;
    datePosted: string;
    author?: { name: string } | null;
};

export type PagedArticles<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    page: number;
    size: number;
};

export type GraphqlArticle = {
    id: string;
    title: string;
    content: string;
    datePosted: string;
    complexity: string;
    author?: { name: string } | null;
    comments: { content: GraphqlCommentItem[]; totalElements: number };
    references?: Array<ArticleReference | null> | null;
};

// The backend caches an article's comments by article id only (ignoring page/size), so every
// caller must request the same page. Keep this the single source of that size.
export const COMMENTS_PAGE_SIZE = 100;

export const ARTICLES_QUERY = gql`
    query Articles($search: String, $page: Int!, $size: Int!, $sortBy: String, $ascending: Boolean) {
        articles(search: $search, page: $page, size: $size, sortBy: $sortBy, ascending: $ascending) {
            content {
                id
                title
                content
                datePosted
                author {
                    name
                }
            }
            totalPages
            totalElements
            page
            size
        }
    }
`;

export const ARTICLE_QUERY = gql`
    query Article($id: String!, $commentsPage: Int!, $commentsSize: Int!) {
        article(id: $id) {
            id
            title
            content
            datePosted
            complexity
            comments(page: $commentsPage, size: $commentsSize, sortBy: "datePosted", ascending: false) {
                content {
                    id
                    content
                    datePosted
                    editedAt
                    user {
                        id
                        name
                    }
                    rating {
                        positive
                        negative
                    }
                    parentComment {
                        id
                    }
                }
                totalElements
            }
            references {
                doi
                title
                authors
                description
                url
            }
            author {
                name
            }
        }
    }
`;

export const ADD_ARTICLE_MUTATION = gql`
    mutation AddArticle($title: String!, $content: String!, $complexity: String!, $references: [String!]) {
        addArticle(title: $title, content: $content, complexity: $complexity, references: $references) {
            id
            title
        }
    }
`;

/** Date style for article dates; pass to next-intl's `format.dateTime(date, articleDateFormat)`. */
export const articleDateFormat = { month: "short", day: "numeric", year: "numeric" } as const;

export const mapArticleToSearchItem = (article: GraphqlArticleSummary): ArticleSearchItem => ({
    id: article.id,
    title: article.title,
    datePosted: article.datePosted,
    author: article.author?.name ?? null,
    content: article.content,
});
