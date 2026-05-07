import type { Dispatch, SetStateAction } from "react";

import { addComment, rateComment } from "@/services/graphql/comments";
import type { CommentItem } from "@/types/comments";

type VoteType = "positive" | "negative";

type SetVote = (articleId: string, commentId: string, voteType: VoteType) => void;
type ClearVote = (articleId: string, commentId: string) => void;

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

export const getCommentsLabel = (commentsCount: number) => {
    if (commentsCount === 0) {
        return "Bądź pierwszą osobą, która skomentuje ten artykuł.";
    }

    let suffix = "komentarzy";

    if (commentsCount === 1) {
        suffix = "komentarz";
    } else if (commentsCount >= 2 && commentsCount <= 4) {
        suffix = "komentarze";
    }

    return `${commentsCount} ${suffix}`;
};

export const getSessionLabel = (isLoading: boolean, canComment: boolean) => {
    if (isLoading) {
        return "Sprawdzanie sesji...";
    }

    if (canComment) {
        return "";
    }

    return "Musisz być zalogowany, aby komentować.";
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
        setError("Musisz być zalogowany, aby głosować");
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
            setError(rateError instanceof Error ? rateError.message : "Nie udało się ocenić komentarza");
        }
    })();
};

type CreateSubmitCommentHandlerParams = {
    articleId: string;
    canComment: boolean;
    setComments: Dispatch<SetStateAction<CommentItem[]>>;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<string | null>>;
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
            const addedComment = await addComment(articleId, trimmedContent, parentCommentId ?? null);

            setComments((currentComments) => {
                if (parentCommentId) {
                    return insertReply(currentComments, parentCommentId, addedComment);
                }

                return [addedComment, ...currentComments];
            });

            return true;
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Nie udało się dodać komentarza");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };
