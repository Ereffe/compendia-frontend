import type { Dispatch, SetStateAction } from "react";

import { addComment, rateComment } from "@/services/graphql/comments";
import type { CommentItem } from "@/types/comments";

type VoteType = "positive" | "negative";

type SetVote = (articleId: string, commentId: string, voteType: VoteType) => void;
type ClearVote = (articleId: string, commentId: string) => void;

export const updateCommentRating = (comments: CommentItem[], commentId: string, voteType: VoteType, delta: 1 | -1) =>
    comments.map((comment) =>
        comment.id === commentId
            ? {
                ...comment,
                rating: {
                    ...comment.rating,
                    [voteType]: comment.rating[voteType] + delta,
                },
            }
            : comment
    );

export const getCommentsLabel = (commentsCount: number) => {
    if (commentsCount === 0) {
        return "Be the first to comment on this article.";
    }

    return `${commentsCount} comment${commentsCount === 1 ? "" : "s"}`;
};

export const getSessionLabel = (isLoading: boolean, canComment: boolean) => {
    if (isLoading) {
        return "Checking your session...";
    }

    if (canComment) {
        return "";
    }

    return "You need to be signed in to comment.";
};

type CreateRateCommentHandlerParams = {
    articleId: string;
    accessToken: string | null;
    authError: string | null;
    setVote: SetVote;
    clearVote: ClearVote;
    setComments: Dispatch<SetStateAction<CommentItem[]>>;
    setError: Dispatch<SetStateAction<string | null>>;
};

export const createRateCommentHandler = ({
    articleId,
    accessToken,
    authError,
    setVote,
    clearVote,
    setComments,
    setError,
}: CreateRateCommentHandlerParams) => (commentId: string, positive: boolean) => {
    if (!accessToken || authError) {
        setError("You must be signed in to vote");
        return;
    }

    const voteType: VoteType = positive ? "positive" : "negative";
    setVote(articleId, commentId, voteType);
    setComments((currentComments) => updateCommentRating(currentComments, commentId, voteType, 1));
    setError(null);

    void (async () => {
        try {
            await rateComment(commentId, positive);
        } catch (rateError) {
            clearVote(articleId, commentId);
            setComments((currentComments) => updateCommentRating(currentComments, commentId, voteType, -1));
            setError(rateError instanceof Error ? rateError.message : "Failed to rate comment");
        }
    })();
};

type CreateSubmitCommentHandlerParams = {
    articleId: string;
    canComment: boolean;
    isSubmitting: boolean;
    setComments: Dispatch<SetStateAction<CommentItem[]>>;
    setContent: Dispatch<SetStateAction<string>>;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<string | null>>;
};

export const createSubmitCommentHandler = ({
    articleId,
    canComment,
    isSubmitting,
    setComments,
    setContent,
    setIsSubmitting,
    setError,
}: CreateSubmitCommentHandlerParams) => async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || !canComment || isSubmitting) {
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
        const addedComment = await addComment(articleId, trimmedContent);
        setComments((currentComments) => [addedComment, ...currentComments]);
        setContent("");
    } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Failed to add comment");
    } finally {
        setIsSubmitting(false);
    }
};