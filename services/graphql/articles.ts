import { graphql } from "./generated";

import type { ArticleQuery, ArticlesQuery, EditableArticleQuery } from "./generated/graphql";
import type { ArticleSearchItem } from "@/types/articles";

export type GraphqlArticleSummary = ArticlesQuery["articles"]["content"][number];

export type GraphqlArticle = ArticleQuery["article"];

export type GraphqlEditableArticle = EditableArticleQuery["article"];

// The backend caches an article's comments by article id only (ignoring page/size), so every
// caller must request the same page. Keep this the single source of that size.
export const COMMENTS_PAGE_SIZE = 100;

export const ARTICLES_QUERY = graphql(`
    query Articles(
        $search: String
        $complexity: String
        $page: Int!
        $size: Int!
        $sortBy: String
        $ascending: Boolean
    ) {
        articles(
            search: $search
            complexity: $complexity
            page: $page
            size: $size
            sortBy: $sortBy
            ascending: $ascending
        ) {
            content {
                id
                title
                content
                datePosted
                complexity
                rating {
                    positive
                    negative
                }
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
`);

export const ARTICLE_QUERY = graphql(`
    query Article($id: String!, $commentsPage: Int!, $commentsSize: Int!) {
        article(id: $id) {
            id
            title
            content
            datePosted
            complexity
            rating {
                positive
                negative
            }
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
                id
                name
            }
        }
    }
`);

export const EDITABLE_ARTICLE_QUERY = graphql(`
    query EditableArticle($id: String!) {
        article(id: $id) {
            id
            title
            content
            complexity
            author {
                id
            }
            references {
                doi
            }
        }
    }
`);

export const ADD_ARTICLE_MUTATION = graphql(`
    mutation AddArticle($title: String!, $content: String!, $complexity: String!, $references: [String!]) {
        addArticle(title: $title, content: $content, complexity: $complexity, references: $references) {
            id
            title
        }
    }
`);

// Null arguments leave the field unchanged. The backend can't clear references: an empty list is ignored.
export const EDIT_ARTICLE_MUTATION = graphql(`
    mutation EditArticle($articleId: ID!, $title: String, $content: String, $complexity: String, $references: [String!]) {
        editArticle(articleId: $articleId, title: $title, content: $content, complexity: $complexity, references: $references) {
            id
        }
    }
`);

export const RATE_ARTICLE_MUTATION = graphql(`
    mutation RateArticle($articleId: ID!, $positive: Boolean!) {
        rateArticle(articleId: $articleId, positive: $positive)
    }
`);

export const DELETE_ARTICLE_MUTATION = graphql(`
    mutation DeleteArticle($articleId: ID!) {
        deleteArticle(articleId: $articleId)
    }
`);

export const articleDateFormat = { month: "short", day: "numeric", year: "numeric" } as const;

export const mapArticleToSearchItem = (article: GraphqlArticleSummary): ArticleSearchItem => ({
    id: article.id,
    title: article.title,
    datePosted: article.datePosted,
    author: article.author?.name ?? null,
    content: article.content,
    complexity: article.complexity,
    rating: article.rating,
});
