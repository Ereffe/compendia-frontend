/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n    query Articles(\n        $search: String\n        $complexity: String\n        $page: Int!\n        $size: Int!\n        $sortBy: String\n        $ascending: Boolean\n        $withCommentCount: Boolean!\n        $commentsSize: Int!\n    ) {\n        articles(\n            search: $search\n            complexity: $complexity\n            page: $page\n            size: $size\n            sortBy: $sortBy\n            ascending: $ascending\n        ) {\n            content {\n                id\n                title\n                content\n                datePosted\n                complexity\n                rating {\n                    positive\n                    negative\n                }\n                author {\n                    name\n                }\n                comments(page: 0, size: $commentsSize, sortBy: \"datePosted\", ascending: false)\n                    @include(if: $withCommentCount) {\n                    totalElements\n                }\n            }\n            totalPages\n            totalElements\n            page\n            size\n        }\n    }\n": typeof types.ArticlesDocument,
    "\n    query Article($id: String!, $commentsPage: Int!, $commentsSize: Int!) {\n        article(id: $id) {\n            id\n            title\n            content\n            datePosted\n            complexity\n            rating {\n                positive\n                negative\n            }\n            comments(page: $commentsPage, size: $commentsSize, sortBy: \"datePosted\", ascending: false) {\n                content {\n                    id\n                    content\n                    datePosted\n                    editedAt\n                    user {\n                        id\n                        name\n                    }\n                    rating {\n                        positive\n                        negative\n                    }\n                    parentComment {\n                        id\n                    }\n                }\n                totalElements\n            }\n            references {\n                doi\n                title\n                authors\n                description\n                url\n            }\n            author {\n                id\n                name\n            }\n        }\n    }\n": typeof types.ArticleDocument,
    "\n    query ArticleCommentCount($id: String!, $commentsSize: Int!) {\n        article(id: $id) {\n            id\n            comments(page: 0, size: $commentsSize, sortBy: \"datePosted\", ascending: false) {\n                totalElements\n            }\n        }\n    }\n": typeof types.ArticleCommentCountDocument,
    "\n    query EditableArticle($id: String!) {\n        article(id: $id) {\n            id\n            title\n            content\n            complexity\n            author {\n                id\n            }\n            references {\n                doi\n            }\n        }\n    }\n": typeof types.EditableArticleDocument,
    "\n    mutation AddArticle($title: String!, $content: String!, $complexity: String!, $references: [String!]) {\n        addArticle(title: $title, content: $content, complexity: $complexity, references: $references) {\n            id\n            title\n        }\n    }\n": typeof types.AddArticleDocument,
    "\n    mutation EditArticle($articleId: ID!, $title: String, $content: String, $complexity: String, $references: [String!]) {\n        editArticle(articleId: $articleId, title: $title, content: $content, complexity: $complexity, references: $references) {\n            id\n        }\n    }\n": typeof types.EditArticleDocument,
    "\n    mutation RateArticle($articleId: ID!, $positive: Boolean!) {\n        rateArticle(articleId: $articleId, positive: $positive)\n    }\n": typeof types.RateArticleDocument,
    "\n    mutation DeleteArticle($articleId: ID!) {\n        deleteArticle(articleId: $articleId)\n    }\n": typeof types.DeleteArticleDocument,
    "\n    mutation AddComment($articleId: ID!, $content: String!, $parentCommentId: Int) {\n        addComment(articleId: $articleId, content: $content, parentCommentId: $parentCommentId) {\n            id\n            content\n            datePosted\n            editedAt\n            user {\n                id\n                name\n            }\n            rating {\n                positive\n                negative\n            }\n            parentComment {\n                id\n            }\n        }\n    }\n": typeof types.AddCommentDocument,
    "\n    mutation EditComment($commentId: Int!, $newContent: String!) {\n        editComment(commentId: $commentId, newContent: $newContent) {\n            id\n            content\n            editedAt\n        }\n    }\n": typeof types.EditCommentDocument,
    "\n    mutation DeleteComment($commentId: Int!) {\n        deleteComment(commentId: $commentId)\n    }\n": typeof types.DeleteCommentDocument,
    "\n    mutation RateComment($commentId: Int!, $positive: Boolean!) {\n        rateComment(commentId: $commentId, positive: $positive)\n    }\n": typeof types.RateCommentDocument,
    "\n    query GetScientificArticlesGraph($doi: String!, $level: Int!) {\n        scienceArticleGraph(doi: $doi, level: $level) {\n            nodes {\n                doi\n                title\n                description\n                authors\n                url\n            }\n            edges {\n                first\n                second\n            }\n        }\n    }\n": typeof types.GetScientificArticlesGraphDocument,
    "\n    query GetScienceArticleMetadata($doi: String!) {\n        scienceArticleMetadata(doi: $doi) {\n            doi\n            title\n            authors\n            description\n        }\n    }\n": typeof types.GetScienceArticleMetadataDocument,
    "\n    query CurrentUser {\n        getCurrentUser {\n            id\n            name\n            email\n            role\n        }\n    }\n": typeof types.CurrentUserDocument,
    "\n    mutation ChangeUsersName($name: String!) {\n        changeUsersName(name: $name) {\n            id\n            name\n        }\n    }\n": typeof types.ChangeUsersNameDocument,
    "\n    query RequestUsersEmailChange($email: String!) {\n        requestUsersEmailChange(email: $email)\n    }\n": typeof types.RequestUsersEmailChangeDocument,
    "\n    query RequestUsersPasswordChange {\n        requestUsersPasswordChange\n    }\n": typeof types.RequestUsersPasswordChangeDocument,
    "\n    mutation ChangeUsersEmail($email: String!, $actionId: String!) {\n        changeUsersEmail(email: $email, actionId: $actionId) {\n            id\n        }\n    }\n": typeof types.ChangeUsersEmailDocument,
    "\n    mutation ChangeUsersPassword($password: String!, $actionId: String!) {\n        changeUsersPassword(password: $password, actionId: $actionId) {\n            id\n        }\n    }\n": typeof types.ChangeUsersPasswordDocument,
};
const documents: Documents = {
    "\n    query Articles(\n        $search: String\n        $complexity: String\n        $page: Int!\n        $size: Int!\n        $sortBy: String\n        $ascending: Boolean\n        $withCommentCount: Boolean!\n        $commentsSize: Int!\n    ) {\n        articles(\n            search: $search\n            complexity: $complexity\n            page: $page\n            size: $size\n            sortBy: $sortBy\n            ascending: $ascending\n        ) {\n            content {\n                id\n                title\n                content\n                datePosted\n                complexity\n                rating {\n                    positive\n                    negative\n                }\n                author {\n                    name\n                }\n                comments(page: 0, size: $commentsSize, sortBy: \"datePosted\", ascending: false)\n                    @include(if: $withCommentCount) {\n                    totalElements\n                }\n            }\n            totalPages\n            totalElements\n            page\n            size\n        }\n    }\n": types.ArticlesDocument,
    "\n    query Article($id: String!, $commentsPage: Int!, $commentsSize: Int!) {\n        article(id: $id) {\n            id\n            title\n            content\n            datePosted\n            complexity\n            rating {\n                positive\n                negative\n            }\n            comments(page: $commentsPage, size: $commentsSize, sortBy: \"datePosted\", ascending: false) {\n                content {\n                    id\n                    content\n                    datePosted\n                    editedAt\n                    user {\n                        id\n                        name\n                    }\n                    rating {\n                        positive\n                        negative\n                    }\n                    parentComment {\n                        id\n                    }\n                }\n                totalElements\n            }\n            references {\n                doi\n                title\n                authors\n                description\n                url\n            }\n            author {\n                id\n                name\n            }\n        }\n    }\n": types.ArticleDocument,
    "\n    query ArticleCommentCount($id: String!, $commentsSize: Int!) {\n        article(id: $id) {\n            id\n            comments(page: 0, size: $commentsSize, sortBy: \"datePosted\", ascending: false) {\n                totalElements\n            }\n        }\n    }\n": types.ArticleCommentCountDocument,
    "\n    query EditableArticle($id: String!) {\n        article(id: $id) {\n            id\n            title\n            content\n            complexity\n            author {\n                id\n            }\n            references {\n                doi\n            }\n        }\n    }\n": types.EditableArticleDocument,
    "\n    mutation AddArticle($title: String!, $content: String!, $complexity: String!, $references: [String!]) {\n        addArticle(title: $title, content: $content, complexity: $complexity, references: $references) {\n            id\n            title\n        }\n    }\n": types.AddArticleDocument,
    "\n    mutation EditArticle($articleId: ID!, $title: String, $content: String, $complexity: String, $references: [String!]) {\n        editArticle(articleId: $articleId, title: $title, content: $content, complexity: $complexity, references: $references) {\n            id\n        }\n    }\n": types.EditArticleDocument,
    "\n    mutation RateArticle($articleId: ID!, $positive: Boolean!) {\n        rateArticle(articleId: $articleId, positive: $positive)\n    }\n": types.RateArticleDocument,
    "\n    mutation DeleteArticle($articleId: ID!) {\n        deleteArticle(articleId: $articleId)\n    }\n": types.DeleteArticleDocument,
    "\n    mutation AddComment($articleId: ID!, $content: String!, $parentCommentId: Int) {\n        addComment(articleId: $articleId, content: $content, parentCommentId: $parentCommentId) {\n            id\n            content\n            datePosted\n            editedAt\n            user {\n                id\n                name\n            }\n            rating {\n                positive\n                negative\n            }\n            parentComment {\n                id\n            }\n        }\n    }\n": types.AddCommentDocument,
    "\n    mutation EditComment($commentId: Int!, $newContent: String!) {\n        editComment(commentId: $commentId, newContent: $newContent) {\n            id\n            content\n            editedAt\n        }\n    }\n": types.EditCommentDocument,
    "\n    mutation DeleteComment($commentId: Int!) {\n        deleteComment(commentId: $commentId)\n    }\n": types.DeleteCommentDocument,
    "\n    mutation RateComment($commentId: Int!, $positive: Boolean!) {\n        rateComment(commentId: $commentId, positive: $positive)\n    }\n": types.RateCommentDocument,
    "\n    query GetScientificArticlesGraph($doi: String!, $level: Int!) {\n        scienceArticleGraph(doi: $doi, level: $level) {\n            nodes {\n                doi\n                title\n                description\n                authors\n                url\n            }\n            edges {\n                first\n                second\n            }\n        }\n    }\n": types.GetScientificArticlesGraphDocument,
    "\n    query GetScienceArticleMetadata($doi: String!) {\n        scienceArticleMetadata(doi: $doi) {\n            doi\n            title\n            authors\n            description\n        }\n    }\n": types.GetScienceArticleMetadataDocument,
    "\n    query CurrentUser {\n        getCurrentUser {\n            id\n            name\n            email\n            role\n        }\n    }\n": types.CurrentUserDocument,
    "\n    mutation ChangeUsersName($name: String!) {\n        changeUsersName(name: $name) {\n            id\n            name\n        }\n    }\n": types.ChangeUsersNameDocument,
    "\n    query RequestUsersEmailChange($email: String!) {\n        requestUsersEmailChange(email: $email)\n    }\n": types.RequestUsersEmailChangeDocument,
    "\n    query RequestUsersPasswordChange {\n        requestUsersPasswordChange\n    }\n": types.RequestUsersPasswordChangeDocument,
    "\n    mutation ChangeUsersEmail($email: String!, $actionId: String!) {\n        changeUsersEmail(email: $email, actionId: $actionId) {\n            id\n        }\n    }\n": types.ChangeUsersEmailDocument,
    "\n    mutation ChangeUsersPassword($password: String!, $actionId: String!) {\n        changeUsersPassword(password: $password, actionId: $actionId) {\n            id\n        }\n    }\n": types.ChangeUsersPasswordDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Articles(\n        $search: String\n        $complexity: String\n        $page: Int!\n        $size: Int!\n        $sortBy: String\n        $ascending: Boolean\n        $withCommentCount: Boolean!\n        $commentsSize: Int!\n    ) {\n        articles(\n            search: $search\n            complexity: $complexity\n            page: $page\n            size: $size\n            sortBy: $sortBy\n            ascending: $ascending\n        ) {\n            content {\n                id\n                title\n                content\n                datePosted\n                complexity\n                rating {\n                    positive\n                    negative\n                }\n                author {\n                    name\n                }\n                comments(page: 0, size: $commentsSize, sortBy: \"datePosted\", ascending: false)\n                    @include(if: $withCommentCount) {\n                    totalElements\n                }\n            }\n            totalPages\n            totalElements\n            page\n            size\n        }\n    }\n"): (typeof documents)["\n    query Articles(\n        $search: String\n        $complexity: String\n        $page: Int!\n        $size: Int!\n        $sortBy: String\n        $ascending: Boolean\n        $withCommentCount: Boolean!\n        $commentsSize: Int!\n    ) {\n        articles(\n            search: $search\n            complexity: $complexity\n            page: $page\n            size: $size\n            sortBy: $sortBy\n            ascending: $ascending\n        ) {\n            content {\n                id\n                title\n                content\n                datePosted\n                complexity\n                rating {\n                    positive\n                    negative\n                }\n                author {\n                    name\n                }\n                comments(page: 0, size: $commentsSize, sortBy: \"datePosted\", ascending: false)\n                    @include(if: $withCommentCount) {\n                    totalElements\n                }\n            }\n            totalPages\n            totalElements\n            page\n            size\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Article($id: String!, $commentsPage: Int!, $commentsSize: Int!) {\n        article(id: $id) {\n            id\n            title\n            content\n            datePosted\n            complexity\n            rating {\n                positive\n                negative\n            }\n            comments(page: $commentsPage, size: $commentsSize, sortBy: \"datePosted\", ascending: false) {\n                content {\n                    id\n                    content\n                    datePosted\n                    editedAt\n                    user {\n                        id\n                        name\n                    }\n                    rating {\n                        positive\n                        negative\n                    }\n                    parentComment {\n                        id\n                    }\n                }\n                totalElements\n            }\n            references {\n                doi\n                title\n                authors\n                description\n                url\n            }\n            author {\n                id\n                name\n            }\n        }\n    }\n"): (typeof documents)["\n    query Article($id: String!, $commentsPage: Int!, $commentsSize: Int!) {\n        article(id: $id) {\n            id\n            title\n            content\n            datePosted\n            complexity\n            rating {\n                positive\n                negative\n            }\n            comments(page: $commentsPage, size: $commentsSize, sortBy: \"datePosted\", ascending: false) {\n                content {\n                    id\n                    content\n                    datePosted\n                    editedAt\n                    user {\n                        id\n                        name\n                    }\n                    rating {\n                        positive\n                        negative\n                    }\n                    parentComment {\n                        id\n                    }\n                }\n                totalElements\n            }\n            references {\n                doi\n                title\n                authors\n                description\n                url\n            }\n            author {\n                id\n                name\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ArticleCommentCount($id: String!, $commentsSize: Int!) {\n        article(id: $id) {\n            id\n            comments(page: 0, size: $commentsSize, sortBy: \"datePosted\", ascending: false) {\n                totalElements\n            }\n        }\n    }\n"): (typeof documents)["\n    query ArticleCommentCount($id: String!, $commentsSize: Int!) {\n        article(id: $id) {\n            id\n            comments(page: 0, size: $commentsSize, sortBy: \"datePosted\", ascending: false) {\n                totalElements\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query EditableArticle($id: String!) {\n        article(id: $id) {\n            id\n            title\n            content\n            complexity\n            author {\n                id\n            }\n            references {\n                doi\n            }\n        }\n    }\n"): (typeof documents)["\n    query EditableArticle($id: String!) {\n        article(id: $id) {\n            id\n            title\n            content\n            complexity\n            author {\n                id\n            }\n            references {\n                doi\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation AddArticle($title: String!, $content: String!, $complexity: String!, $references: [String!]) {\n        addArticle(title: $title, content: $content, complexity: $complexity, references: $references) {\n            id\n            title\n        }\n    }\n"): (typeof documents)["\n    mutation AddArticle($title: String!, $content: String!, $complexity: String!, $references: [String!]) {\n        addArticle(title: $title, content: $content, complexity: $complexity, references: $references) {\n            id\n            title\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation EditArticle($articleId: ID!, $title: String, $content: String, $complexity: String, $references: [String!]) {\n        editArticle(articleId: $articleId, title: $title, content: $content, complexity: $complexity, references: $references) {\n            id\n        }\n    }\n"): (typeof documents)["\n    mutation EditArticle($articleId: ID!, $title: String, $content: String, $complexity: String, $references: [String!]) {\n        editArticle(articleId: $articleId, title: $title, content: $content, complexity: $complexity, references: $references) {\n            id\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation RateArticle($articleId: ID!, $positive: Boolean!) {\n        rateArticle(articleId: $articleId, positive: $positive)\n    }\n"): (typeof documents)["\n    mutation RateArticle($articleId: ID!, $positive: Boolean!) {\n        rateArticle(articleId: $articleId, positive: $positive)\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation DeleteArticle($articleId: ID!) {\n        deleteArticle(articleId: $articleId)\n    }\n"): (typeof documents)["\n    mutation DeleteArticle($articleId: ID!) {\n        deleteArticle(articleId: $articleId)\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation AddComment($articleId: ID!, $content: String!, $parentCommentId: Int) {\n        addComment(articleId: $articleId, content: $content, parentCommentId: $parentCommentId) {\n            id\n            content\n            datePosted\n            editedAt\n            user {\n                id\n                name\n            }\n            rating {\n                positive\n                negative\n            }\n            parentComment {\n                id\n            }\n        }\n    }\n"): (typeof documents)["\n    mutation AddComment($articleId: ID!, $content: String!, $parentCommentId: Int) {\n        addComment(articleId: $articleId, content: $content, parentCommentId: $parentCommentId) {\n            id\n            content\n            datePosted\n            editedAt\n            user {\n                id\n                name\n            }\n            rating {\n                positive\n                negative\n            }\n            parentComment {\n                id\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation EditComment($commentId: Int!, $newContent: String!) {\n        editComment(commentId: $commentId, newContent: $newContent) {\n            id\n            content\n            editedAt\n        }\n    }\n"): (typeof documents)["\n    mutation EditComment($commentId: Int!, $newContent: String!) {\n        editComment(commentId: $commentId, newContent: $newContent) {\n            id\n            content\n            editedAt\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation DeleteComment($commentId: Int!) {\n        deleteComment(commentId: $commentId)\n    }\n"): (typeof documents)["\n    mutation DeleteComment($commentId: Int!) {\n        deleteComment(commentId: $commentId)\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation RateComment($commentId: Int!, $positive: Boolean!) {\n        rateComment(commentId: $commentId, positive: $positive)\n    }\n"): (typeof documents)["\n    mutation RateComment($commentId: Int!, $positive: Boolean!) {\n        rateComment(commentId: $commentId, positive: $positive)\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetScientificArticlesGraph($doi: String!, $level: Int!) {\n        scienceArticleGraph(doi: $doi, level: $level) {\n            nodes {\n                doi\n                title\n                description\n                authors\n                url\n            }\n            edges {\n                first\n                second\n            }\n        }\n    }\n"): (typeof documents)["\n    query GetScientificArticlesGraph($doi: String!, $level: Int!) {\n        scienceArticleGraph(doi: $doi, level: $level) {\n            nodes {\n                doi\n                title\n                description\n                authors\n                url\n            }\n            edges {\n                first\n                second\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetScienceArticleMetadata($doi: String!) {\n        scienceArticleMetadata(doi: $doi) {\n            doi\n            title\n            authors\n            description\n        }\n    }\n"): (typeof documents)["\n    query GetScienceArticleMetadata($doi: String!) {\n        scienceArticleMetadata(doi: $doi) {\n            doi\n            title\n            authors\n            description\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query CurrentUser {\n        getCurrentUser {\n            id\n            name\n            email\n            role\n        }\n    }\n"): (typeof documents)["\n    query CurrentUser {\n        getCurrentUser {\n            id\n            name\n            email\n            role\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation ChangeUsersName($name: String!) {\n        changeUsersName(name: $name) {\n            id\n            name\n        }\n    }\n"): (typeof documents)["\n    mutation ChangeUsersName($name: String!) {\n        changeUsersName(name: $name) {\n            id\n            name\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query RequestUsersEmailChange($email: String!) {\n        requestUsersEmailChange(email: $email)\n    }\n"): (typeof documents)["\n    query RequestUsersEmailChange($email: String!) {\n        requestUsersEmailChange(email: $email)\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query RequestUsersPasswordChange {\n        requestUsersPasswordChange\n    }\n"): (typeof documents)["\n    query RequestUsersPasswordChange {\n        requestUsersPasswordChange\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation ChangeUsersEmail($email: String!, $actionId: String!) {\n        changeUsersEmail(email: $email, actionId: $actionId) {\n            id\n        }\n    }\n"): (typeof documents)["\n    mutation ChangeUsersEmail($email: String!, $actionId: String!) {\n        changeUsersEmail(email: $email, actionId: $actionId) {\n            id\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation ChangeUsersPassword($password: String!, $actionId: String!) {\n        changeUsersPassword(password: $password, actionId: $actionId) {\n            id\n        }\n    }\n"): (typeof documents)["\n    mutation ChangeUsersPassword($password: String!, $actionId: String!) {\n        changeUsersPassword(password: $password, actionId: $actionId) {\n            id\n        }\n    }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;