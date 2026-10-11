import { graphql } from "./generated";

import type { AddCommentMutation } from "./generated/graphql";
import type { CommentItem } from "@/types/comments";

export const ADD_COMMENT_MUTATION = graphql(`
    mutation AddComment($articleId: ID!, $content: String!, $parentCommentId: Int) {
        addComment(articleId: $articleId, content: $content, parentCommentId: $parentCommentId) {
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
            myVote
            parentComment {
                id
            }
        }
    }
`);

export const ARTICLE_COMMENTS_QUERY = graphql(`
    query ArticleComments($articleId: String!, $page: Int!, $size: Int!) {
        comments(articleId: $articleId, page: $page, size: $size, sortBy: "datePosted", ascending: false) {
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
                myVote
                parentComment {
                    id
                }
            }
            totalElements
        }
    }
`);

export const EDIT_COMMENT_MUTATION = graphql(`
    mutation EditComment($commentId: Int!, $newContent: String!) {
        editComment(commentId: $commentId, newContent: $newContent) {
            id
            content
            editedAt
        }
    }
`);

export const DELETE_COMMENT_MUTATION = graphql(`
    mutation DeleteComment($commentId: Int!) {
        deleteComment(commentId: $commentId)
    }
`);

export const RATE_COMMENT_MUTATION = graphql(`
    mutation RateComment($commentId: Int!, $positive: Boolean!) {
        rateComment(commentId: $commentId, positive: $positive)
    }
`);

export const UNRATE_COMMENT_MUTATION = graphql(`
    mutation UnrateComment($commentId: Int!) {
        unrateComment(commentId: $commentId)
    }
`);

export type GraphqlCommentItem = AddCommentMutation["addComment"];

export const mapGraphqlCommentToCommentItem = (comment: GraphqlCommentItem): CommentItem => ({
    id: comment.id,
    content: comment.content,
    datePosted: comment.datePosted,
    editedAt: comment.editedAt,
    user: comment.user,
    rating: comment.rating,
    myVote: comment.myVote,
    parentCommentId: comment.parentComment?.id ?? null,
});
