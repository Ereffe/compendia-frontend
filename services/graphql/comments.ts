import { gql } from "@apollo/client";

import type { CommentItem } from "@/types/comments";

export const ADD_COMMENT_MUTATION = gql`
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
            parentComment {
                id
            }
        }
    }
`;

export const EDIT_COMMENT_MUTATION = gql`
    mutation EditComment($commentId: Int!, $newContent: String!) {
        editComment(commentId: $commentId, newContent: $newContent) {
            id
            content
            editedAt
        }
    }
`;

export const DELETE_COMMENT_MUTATION = gql`
    mutation DeleteComment($commentId: Int!) {
        deleteComment(commentId: $commentId)
    }
`;

export const RATE_COMMENT_MUTATION = gql`
    mutation RateComment($commentId: Int!, $positive: Boolean!) {
        rateComment(commentId: $commentId, positive: $positive)
    }
`;

export type GraphqlCommentItem = Omit<CommentItem, "parentCommentId" | "replies"> & {
    parentComment?: {
        id: string;
    } | null;
};

export const mapGraphqlCommentToCommentItem = (comment: GraphqlCommentItem): CommentItem => ({
    id: comment.id,
    content: comment.content,
    datePosted: comment.datePosted,
    editedAt: comment.editedAt,
    user: comment.user,
    rating: comment.rating,
    parentCommentId: comment.parentComment?.id ?? null,
});
