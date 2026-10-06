import type { Dispatch, SetStateAction } from "react";

import { addCommentAction, rateCommentAction } from "@/app/actions/comments";
import type { VoteType } from "@/hooks/stores/useVoteStore";
import type { CommentItem } from "@/types/comments";
import type { ErrorKey } from "@/types/errors";

type SetVote = (userKey: string, commentId: string, voteType: VoteType) => void;
type ClearVote = (userKey: string, commentId: string) => void;

const normalizeComment = (comment: CommentItem): CommentItem => ({
    ...comment,
    replies: [],
});

export const buildCommentTree = (comments: CommentItem[]): CommentItem[] => {
    const commentById = new Map<string, CommentItem>();
    const roots: CommentItem[] = [];

    for (const comment of comments) {
        commentById.set(comment.id, normalizeComment(comment));
    }

    for (const comment of comments) {
        const normalizedComment = commentById.get(comment.id);
        if (!normalizedComment) {
            continue;
        }

        const parentCommentId = normalizedComment.parentCommentId;
        if (!parentCommentId) {
            roots.push(normalizedComment);
            continue;
        }

        const parent = commentById.get(parentCommentId);
        if (!parent) {
            roots.push(normalizedComment);
            continue;
        }

        parent.replies = [...(parent.replies ?? []), normalizedComment];
    }

    return roots;
};

export const countComments = (comments: CommentItem[]): number =>
    comments.reduce((total, comment) => total + 1 + countComments(comment.replies ?? []), 0);

export const updateCommentRating = (
    comments: CommentItem[],
    commentId: string,
    voteType: VoteType,
    delta: 1 | -1
): CommentItem[] =>
    comments.map((comment) => {
        const updatedReplies = comment.replies ? updateCommentRating(comment.replies, commentId, voteType, delta) : undefined;
        if (comment.id === commentId) {
            return {
                ...comment,
                rating: {
                    ...comment.rating,
                    [voteType]: comment.rating[voteType] + delta,
                },
                replies: updatedReplies,
            };
        }

        return {
            ...comment,
            replies: updatedReplies,
        };
    });

export const insertReply = (comments: CommentItem[], parentCommentId: string, reply: CommentItem): CommentItem[] =>
    comments.map((comment) => {
        if (comment.id === parentCommentId) {
            return {
                ...comment,
                replies: [reply, ...(comment.replies ?? [])],
            };
        }

        return {
            ...comment,
            replies: comment.replies ? insertReply(comment.replies, parentCommentId, reply) : [],
        };
    });

type CreateRateCommentHandlerParams = {
    /** Identifies the signed-in user in the local vote store; null when signed out. */
    userKey: string | null;
    setVote: SetVote;
    clearVote: ClearVote;
    setComments: Dispatch<SetStateAction<CommentItem[]>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
};

export const createRateCommentHandler = ({
    userKey,
    setVote,
    clearVote,
    setComments,
    setError,
}: CreateRateCommentHandlerParams) => (commentId: string, positive: boolean) => {
    if (!userKey) {
        setError("voteRequiresLogin");
        return;
    }

    const voteType: VoteType = positive ? "positive" : "negative";
    setVote(userKey, commentId, voteType);
    setComments((currentComments) => updateCommentRating(currentComments, commentId, voteType, 1));
    setError(null);

    void (async () => {
        const result = await rateCommentAction(commentId, positive);
        if (!result.ok) {
            clearVote(userKey, commentId);
            setComments((currentComments) => updateCommentRating(currentComments, commentId, voteType, -1));
            setError(result.error);
        }
    })();
};

type CreateSubmitCommentHandlerParams = {
    articleId: string;
    canComment: boolean;
    setComments: Dispatch<SetStateAction<CommentItem[]>>;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
};

type SubmitCommentParams = {
    content: string;
    isSubmitting: boolean;
    parentCommentId?: string;
};

export const createSubmitCommentHandler = ({
    articleId,
    canComment,
    setComments,
    setIsSubmitting,
    setError,
}: CreateSubmitCommentHandlerParams) => async ({
    content,
    isSubmitting,
    parentCommentId,
}: SubmitCommentParams) => {
        const trimmedContent = content.trim();
        if (!trimmedContent || !canComment || isSubmitting) {
            return false;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await addCommentAction(articleId, trimmedContent, parentCommentId ?? null);
            if (!result.ok) {
                setError(result.error);
                return false;
            }

            const addedComment = { ...result.data, replies: [] };
            setComments((currentComments) => {
                if (parentCommentId) {
                    return insertReply(currentComments, parentCommentId, addedComment);
                }

                return [addedComment, ...currentComments];
            });

            return true;
        } catch {
            setError("addCommentFailed");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };
