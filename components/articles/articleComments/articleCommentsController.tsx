import type { Dispatch, SetStateAction } from "react";

import {
    addCommentAction,
    deleteCommentAction,
    editCommentAction,
    loadCommentsAction,
    rateCommentAction,
} from "@/app/actions/comments";
import { applyVote, toggledVote, type Vote } from "@/lib/votes";
import type { CommentItem, EditedComment } from "@/types/comments";
import type { ErrorKey } from "@/types/errors";

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

export const flattenComments = (comments: CommentItem[]): CommentItem[] =>
    comments.flatMap(({ replies, ...comment }) => [comment, ...flattenComments(replies ?? [])]);

export const mergeCommentPage = (tree: CommentItem[], page: CommentItem[]): CommentItem[] => {
    const loaded = flattenComments(tree);
    const known = new Set(loaded.map((comment) => comment.id));
    return buildCommentTree([...loaded, ...page.filter((comment) => !known.has(comment.id))]);
};

export const countComments = (comments: CommentItem[]): number =>
    comments.reduce((total, comment) => total + 1 + countComments(comment.replies ?? []), 0);

export const updateCommentVote = (comments: CommentItem[], commentId: string, vote: Vote): CommentItem[] =>
    comments.map((comment) => ({
        ...(comment.id === commentId
            ? { ...comment, rating: applyVote(comment.rating, comment.myVote, vote), myVote: vote }
            : comment),
        replies: comment.replies ? updateCommentVote(comment.replies, commentId, vote) : comment.replies,
    }));

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

export const findComment = (comments: CommentItem[], commentId: string): CommentItem | undefined => {
    for (const comment of comments) {
        if (comment.id === commentId) return comment;
        const found = findComment(comment.replies ?? [], commentId);
        if (found) return found;
    }
    return undefined;
};

export const applyCommentEdit = (comments: CommentItem[], edited: EditedComment): CommentItem[] =>
    comments.map((comment) => ({
        ...comment,
        ...(comment.id === edited.id ? { content: edited.content, editedAt: edited.editedAt } : {}),
        replies: comment.replies ? applyCommentEdit(comment.replies, edited) : comment.replies,
    }));

export const removeComment = (comments: CommentItem[], commentId: string): CommentItem[] =>
    comments
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({
            ...comment,
            replies: comment.replies ? removeComment(comment.replies, commentId) : comment.replies,
        }));

type CreateRateCommentHandlerParams = {
    canVote: boolean;
    setComments: Dispatch<SetStateAction<CommentItem[]>>;
    setVotePending: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
    onRated?: (vote: Vote) => void;
};

export const createRateCommentHandler = ({
    canVote,
    setComments,
    setVotePending,
    setError,
    onRated,
}: CreateRateCommentHandlerParams) => (comment: CommentItem, positive: boolean) => {
    if (!canVote) {
        setError("voteRequiresLogin");
        return;
    }

    const previous = comment.myVote;
    const next = toggledVote(previous, positive);
    setComments((currentComments) => updateCommentVote(currentComments, comment.id, next));
    setVotePending(true);
    setError(null);

    void (async () => {
        const result = await rateCommentAction(comment.id, next).catch(() => null);
        setVotePending(false);
        if (!result?.ok) {
            setComments((currentComments) => updateCommentVote(currentComments, comment.id, previous));
            setError(result ? result.error : "rateCommentFailed");
            return;
        }
        onRated?.(next);
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

type CreateEditCommentHandlerParams = {
    setComments: Dispatch<SetStateAction<CommentItem[]>>;
    setIsSaving: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
};

export const createEditCommentHandler = ({ setComments, setIsSaving, setError }: CreateEditCommentHandlerParams) =>
    async (commentId: string, content: string): Promise<boolean> => {
        const trimmedContent = content.trim();
        if (!trimmedContent) {
            setError("emptyComment");
            return false;
        }

        setIsSaving(true);
        setError(null);
        try {
            const result = await editCommentAction(commentId, trimmedContent);
            if (!result.ok) {
                setError(result.error);
                return false;
            }
            setComments((currentComments) => applyCommentEdit(currentComments, result.data));
            return true;
        } catch {
            setError("editCommentFailed");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

type CreateDeleteCommentHandlerParams = {
    setComments: Dispatch<SetStateAction<CommentItem[]>>;
    onDeleted: (removedCount: number) => void;
    setIsDeleting: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
};

export const createDeleteCommentHandler = ({
    setComments,
    onDeleted,
    setIsDeleting,
    setError,
}: CreateDeleteCommentHandlerParams) =>
    async (comment: CommentItem): Promise<boolean> => {
        setIsDeleting(true);
        setError(null);
        try {
            const result = await deleteCommentAction(comment.id);
            if (!result.ok) {
                setError(result.error);
                return false;
            }
            setComments((currentComments) => removeComment(currentComments, comment.id));
            onDeleted(1 + countComments(comment.replies ?? []));
            return true;
        } catch {
            setError("deleteCommentFailed");
            return false;
        } finally {
            setIsDeleting(false);
        }
    };

type CreateLoadMoreCommentsHandlerParams = {
    articleId: string;
    nextPage: number;
    setNextPage: Dispatch<SetStateAction<number>>;
    setServerTotal: Dispatch<SetStateAction<number>>;
    setComments: Dispatch<SetStateAction<CommentItem[]>>;
    setDeletedCount: Dispatch<SetStateAction<number>>;
    setIsLoadingMore: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
};

// shortcut: pages are offsets into the newest-first list, so comments added or deleted meanwhile can shift
// one comment across a page boundary (duplicates are dropped, a skipped one appears after a reload).
export const createLoadMoreCommentsHandler =
    ({ articleId, nextPage, setNextPage, setServerTotal, setComments, setDeletedCount, setIsLoadingMore, setError }: CreateLoadMoreCommentsHandlerParams) =>
        async () => {
            setIsLoadingMore(true);
            setError(null);
            const result = await loadCommentsAction(articleId, nextPage).catch(() => null);
            setIsLoadingMore(false);
            if (!result?.ok) {
                setError(result ? result.error : "loadCommentsFailed");
                return;
            }
            setComments((current) => mergeCommentPage(current, result.data.comments));
            setServerTotal(result.data.totalElements);
            setDeletedCount(0);
            setNextPage(nextPage + 1);
        };
