import { useAuthStore } from "@/hooks/stores/useAuthStore";
import { CommentItem } from "@/types/comments";

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8080";



const buildHeaders = () => {
    const accessToken = useAuthStore.getState().accessToken;

    return {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
};

const addCommentMutation = `
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

const upvoteCommentMutation = `
mutation RateComment($commentId: Int!, $positive: Boolean!) {
  rateComment(commentId: $commentId, positive: $positive)
}
`;

export async function rateComment(commentId: string, positive: boolean) {
    const response = await fetch(`${backendBaseUrl}/graphql`, {
        method: "POST",
        headers: buildHeaders(),
        cache: "no-store",
        body: JSON.stringify({
            query: upvoteCommentMutation,
            variables: { commentId: Number.parseInt(commentId), positive },
        }),
    });

    const payload = (await response.json()) as { data?: { rateComment?: number }; errors?: Array<{ message?: string }> };

    if (!response.ok || payload.data?.rateComment === undefined) {
        throw new Error(payload.errors?.[0]?.message ?? "Failed to rate comment");
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
    const response = await fetch(`${backendBaseUrl}/graphql`, {
        method: "POST",
        headers: buildHeaders(),
        cache: "no-store",
        body: JSON.stringify({
            query: addCommentMutation,
            variables: {
                articleId,
                content: trimmedContent,
                parentCommentId: parentCommentId ? Number.parseInt(parentCommentId) : null,
            },
        }),
    });

    const payload = (await response.json()) as {
        data?: { addComment?: GraphqlCommentItem };
        errors?: Array<{ message?: string }>;
    };
    const addedComment = payload.data?.addComment;

    if (!response.ok || !addedComment) {
        throw new Error(payload.errors?.[0]?.message ?? "Failed to add comment");
    }

    return mapGraphqlCommentToCommentItem(addedComment);
}