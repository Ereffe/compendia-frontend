import { CommentItem } from "@/types/comments";
import { gql } from "@apollo/client";
import getBrowserClient from "@/lib/apolloBrowser";

const addCommentMutation = gql`
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

const upvoteCommentMutation = gql`
    mutation RateComment($commentId: Int!, $positive: Boolean!) {
        rateComment(commentId: $commentId, positive: $positive)
    }
`;

export async function rateComment(commentId: string, positive: boolean) {
    const client = getBrowserClient();
    const res = await client.mutate<{ rateComment: boolean }>({
        mutation: upvoteCommentMutation,
        variables: { commentId: Number.parseInt(commentId), positive },
    });

    if (res.error || res.data?.rateComment === undefined) {
        throw new Error(res.error?.message ?? "Failed to rate comment");
    }
}

type GraphqlCommentItem = Omit<CommentItem, "parentCommentId" | "replies"> & {
    parentComment?: {
        id: string;
    } | null;
};

const mapGraphqlCommentToCommentItem = (comment: GraphqlCommentItem): CommentItem => ({
    id: comment.id,
    content: comment.content,
    datePosted: comment.datePosted,
    editedAt: comment.editedAt,
    user: comment.user,
    rating: comment.rating,
    parentCommentId: comment.parentComment?.id ?? null,
});

export async function addComment(articleId: string, trimmedContent: string, parentCommentId: string | null = null) {
    const client = getBrowserClient();
    const res = await client.mutate<{ addComment: GraphqlCommentItem }>({
        mutation: addCommentMutation,
        variables: {
            articleId,
            content: trimmedContent,
            parentCommentId: parentCommentId ? Number.parseInt(parentCommentId) : null,
        },
    });

    const addedComment = res.data?.addComment;
    if (res.error || !addedComment) {
        throw new Error(res.error?.message ?? "Failed to add comment");
    }

    return mapGraphqlCommentToCommentItem(addedComment);
}