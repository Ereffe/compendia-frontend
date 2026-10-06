"use client";

import { type ReactNode, type SyntheticEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import { Pencil, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";

import { useVoteStore } from "@/hooks/stores/useVoteStore";
import type { CommentItem } from "@/types/comments";
import type { ErrorKey } from "@/types/errors";

import ConfirmDeleteDialog from "@/components/confirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/articles/articleReferences";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/userAvatar";
import { cn } from "@/lib/utils";
import {
    buildCommentTree,
    countComments,
    createDeleteCommentHandler,
    createEditCommentHandler,
    createRateCommentHandler,
    createSubmitCommentHandler,
    findComment,
} from "./articleCommentsController";

const voteClass = "gap-1 px-1.5 tabular-nums text-muted-foreground";
const ownerActionClass = "px-1.5 text-muted-foreground hover:text-foreground";
const commentDateFormat = { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" } as const;

type ArticleCommentsProps = Readonly<{
    articleId: string;
    initialComments: CommentItem[];
    totalCount?: number;
}>;

export default function ArticleComments({ articleId, initialComments, totalCount }: ArticleCommentsProps) {
    const t = useTranslations("comments");
    const tErrors = useTranslations("errors");
    const format = useFormatter();
    const { data: session, status } = useSession();
    const isLoading = status === "loading";
    const canComment = status === "authenticated" && !session?.error;
    const userKey = canComment ? (session?.user?.id ?? session?.user?.email ?? null) : null;
    const currentUserId = canComment ? (session?.user?.id ?? null) : null;
    const [comments, setComments] = useState<CommentItem[]>(() => buildCommentTree(initialComments));
    const [content, setContent] = useState("");
    const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
    const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<ErrorKey | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editError, setEditError] = useState<ErrorKey | null>(null);
    const [commentToDelete, setCommentToDelete] = useState<CommentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<ErrorKey | null>(null);
    const [deletedCount, setDeletedCount] = useState(0);

    const getVote = useVoteStore((state) => state.getVote);
    const setVote = useVoteStore((state) => state.setVote);
    const clearVote = useVoteStore((state) => state.clearVote);
    const userVotes = useVoteStore((state) => (userKey ? state.votes[userKey] : undefined));

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        setComments(buildCommentTree(initialComments));
    }, [initialComments]);

    const totalComments = useMemo(() => countComments(comments), [comments]);
    const remainingTotal = totalCount === undefined ? undefined : totalCount - deletedCount;
    const displayedTotal = Math.max(totalComments, remainingTotal ?? 0);
    const isTruncated = totalCount !== undefined && totalCount > initialComments.length;

    let sessionLabel = "";
    if (isLoading) sessionLabel = t("checkingSession");
    else if (!canComment) sessionLabel = t("mustSignIn");

    const getRepliesToggleLabel = (repliesCount: number, isExpanded: boolean) => {
        if (isExpanded) return t("hideReplies");
        if (repliesCount === 0) return t("noReplies");
        return t("showReplies", { count: repliesCount });
    };

    const handleRateComment = useMemo(
        () =>
            createRateCommentHandler({
                userKey,
                getVote,
                setVote,
                clearVote,
                setComments,
                setError,
            }),
        [userKey, getVote, setVote, clearVote]
    );

    const submitComment = useMemo(
        () =>
            createSubmitCommentHandler({
                articleId,
                canComment,
                setComments,
                setIsSubmitting,
                setError,
            }),
        [articleId, canComment]
    );

    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        const didSubmit = await submitComment({
            content,
            isSubmitting,
        });

        if (didSubmit) {
            setContent("");
        }
    };

    const toggleReplyForm = useCallback((commentId: string) => {
        setActiveReplyCommentId((current) => (current === commentId ? null : commentId));
    }, []);

    const handleReplyChange = useCallback((commentId: string, nextValue: string) => {
        setReplyDrafts((currentDrafts) => ({
            ...currentDrafts,
            [commentId]: nextValue,
        }));
    }, []);

    const handleReplySubmit = async (event: SyntheticEvent<HTMLFormElement>, parentCommentId: string) => {
        event.preventDefault();
        const didSubmit = await submitComment({
            content: replyDrafts[parentCommentId] ?? "",
            isSubmitting,
            parentCommentId,
        });

        if (didSubmit) {
            setReplyDrafts((currentDrafts) => ({
                ...currentDrafts,
                [parentCommentId]: "",
            }));
            setExpandedReplies((currentState) => ({
                ...currentState,
                [parentCommentId]: true,
            }));
            setActiveReplyCommentId(null);
        }
    };

    const saveEdit = createEditCommentHandler({ setComments, setIsSaving: setIsSavingEdit, setError: setEditError });

    const deleteComment = createDeleteCommentHandler({
        setComments,
        onDeleted: (removedCount) => setDeletedCount((count) => count + removedCount),
        setIsDeleting,
        setError: setDeleteError,
    });

    const startEditing = (comment: CommentItem) => {
        setEditingCommentId(comment.id);
        setEditDraft(comment.content);
        setEditError(null);
        setActiveReplyCommentId(null);
    };

    const cancelEditing = () => {
        setEditingCommentId(null);
        setEditError(null);
    };

    const handleEditSubmit = async (event: SyntheticEvent<HTMLFormElement>, commentId: string) => {
        event.preventDefault();
        if (isSavingEdit) return;
        if (await saveEdit(commentId, editDraft)) {
            setEditingCommentId(null);
        }
    };

    const handleDeleteDialogChange = (open: boolean) => {
        if (!open) {
            setCommentToDelete(null);
            setDeleteError(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!commentToDelete) return;
        if (await deleteComment(commentToDelete)) {
            if (editingCommentId && findComment([commentToDelete], editingCommentId)) setEditingCommentId(null);
            setCommentToDelete(null);
        }
    };

    const toggleReplies = useCallback((commentId: string) => {
        setExpandedReplies((currentState) => ({
            ...currentState,
            [commentId]: !currentState[commentId],
        }));
    }, []);

    const renderVoteButtons = (comment: CommentItem, hasVoted: boolean, isPositiveVote: boolean, isNegativeVote: boolean) => {
        if (!isHydrated) {
            return (
                <>
                    <Button variant="ghost" size="xs" className={voteClass} disabled>
                        <ThumbsUp /> {comment.rating.positive}
                    </Button>
                    <Button variant="ghost" size="xs" className={voteClass} disabled>
                        <ThumbsDown /> {comment.rating.negative}
                    </Button>
                </>
            );
        }

        return (
            <>
                <Button
                    variant="ghost"
                    size="xs"
                    className={cn(voteClass, isPositiveVote && "text-emerald-700 disabled:opacity-100 dark:text-emerald-400")}
                    onClick={() => handleRateComment(comment.id, true)}
                    disabled={hasVoted || !canComment}
                    aria-label={t("upvote", { count: comment.rating.positive })}
                    title={hasVoted ? t("alreadyVoted") : undefined}
                >
                    <ThumbsUp /> {comment.rating.positive}
                </Button>
                <Button
                    variant="ghost"
                    size="xs"
                    className={cn(voteClass, isNegativeVote && "text-red-700 disabled:opacity-100 dark:text-red-400")}
                    onClick={() => handleRateComment(comment.id, false)}
                    disabled={hasVoted || !canComment}
                    aria-label={t("downvote", { count: comment.rating.negative })}
                    title={hasVoted ? t("alreadyVoted") : undefined}
                >
                    <ThumbsDown /> {comment.rating.negative}
                </Button>
            </>
        );
    };

    const renderReplyForm = (commentId: string) => (
        <form className="mt-3 space-y-3" onSubmit={(event) => handleReplySubmit(event, commentId)}>
            <Textarea
                value={replyDrafts[commentId] ?? ""}
                onChange={(event) => handleReplyChange(commentId, event.target.value)}
                placeholder={t("replyPlaceholder")}
                className="min-h-20 bg-background text-foreground"
                disabled={!canComment || isSubmitting}
            />
            <div className="flex justify-end gap-2">
                <Button type="submit" size="xs" disabled={isSubmitting || (replyDrafts[commentId] ?? "").trim().length === 0}>
                    {isSubmitting ? t("submitting") : t("submitReply")}
                </Button>
            </div>
        </form>
    );

    const renderEditForm = (comment: CommentItem) => (
        <form className="mt-2 space-y-3" onSubmit={(event) => handleEditSubmit(event, comment.id)}>
            <Textarea
                value={editDraft}
                onChange={(event) => setEditDraft(event.target.value)}
                aria-label={t("editLabel")}
                className="min-h-20 bg-background text-foreground"
                disabled={isSavingEdit}
                autoFocus
            />
            {editError ? <p className="text-sm text-destructive" role="alert">{tErrors(editError)}</p> : null}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="xs" onClick={cancelEditing} disabled={isSavingEdit}>
                    {t("cancel")}
                </Button>
                <Button
                    type="submit"
                    size="xs"
                    disabled={isSavingEdit || editDraft.trim().length === 0 || editDraft.trim() === comment.content}
                >
                    {isSavingEdit ? t("saving") : t("save")}
                </Button>
            </div>
        </form>
    );

    const renderComment = (
        comment: CommentItem,
        depth = 0
    ): ReactNode => {
        const userVote = isHydrated && userKey
            ? userVotes?.[comment.id]
            : undefined;

        const isPositiveVote = userVote === "positive";
        const isNegativeVote = userVote === "negative";
        const hasVoted = userVote !== undefined;

        const isReplyFormVisible =
            activeReplyCommentId === comment.id;

        const repliesCount = countComments(comment.replies ?? []);

        const hasReplies = repliesCount > 0;

        const isRepliesExpanded =
            expandedReplies[comment.id] ?? false;

        const isOwnComment = currentUserId !== null && comment.user.id === currentUserId;
        const isEditing = editingCommentId === comment.id;

        return (
            <div key={comment.id} className="w-full">
                <article className={cn("flex w-full gap-3", depth === 0 ? "py-5" : "py-3")}>
                    <UserAvatar userId={comment.user.id} size={depth === 0 ? 32 : 24} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                            <span className="font-medium text-foreground">{comment.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {format.dateTime(new Date(comment.datePosted), commentDateFormat)}
                                {comment.editedAt ? ` · ${t("edited")}` : ""}
                            </span>
                        </p>

                        {isEditing ? renderEditForm(comment) : (
                            <p className="mt-1.5 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-foreground/90 wrap-anywhere">
                                {comment.content}
                            </p>
                        )}

                        <div className={cn("-ml-1.5 mt-2 flex flex-wrap items-center gap-x-1 gap-y-1", isEditing && "hidden")}>
                            {renderVoteButtons(comment, hasVoted, isPositiveVote, isNegativeVote)}
                            <Button
                                variant="ghost"
                                size="xs"
                                className="ml-2 px-1.5 text-muted-foreground hover:text-foreground"
                                onClick={() => toggleReplyForm(comment.id)}
                                disabled={!canComment}
                            >
                                {isReplyFormVisible ? t("cancel") : t("reply")}
                            </Button>
                            {hasReplies ? (
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    className="px-1.5 text-muted-foreground hover:text-foreground"
                                    onClick={() => toggleReplies(comment.id)}
                                    aria-expanded={isRepliesExpanded}
                                >
                                    {getRepliesToggleLabel(repliesCount, isRepliesExpanded)}
                                </Button>
                            ) : null}
                            {isOwnComment ? (
                                <>
                                    <Button variant="ghost" size="xs" className={ownerActionClass} onClick={() => startEditing(comment)}>
                                        <Pencil aria-hidden />
                                        {t("edit")}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        className="px-1.5 text-muted-foreground hover:text-destructive"
                                        onClick={() => setCommentToDelete(comment)}
                                    >
                                        <Trash2 aria-hidden />
                                        {t("delete")}
                                    </Button>
                                </>
                            ) : null}
                        </div>

                        {isReplyFormVisible
                            ? renderReplyForm(comment.id)
                            : null}
                    </div>
                </article>

                {hasReplies && isRepliesExpanded ? (
                    <div className="mb-4 ml-1 border-l border-border pl-4 sm:pl-5">
                        {comment.replies?.map((reply) =>
                            renderComment(reply, depth + 1)
                        )}
                    </div>
                ) : null}
            </div>
        );
    };

    return (
        <div>
            <SectionHeading title={t("title")} meta={t("count", { count: displayedTotal })} />

            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
                <Textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder={canComment ? t("placeholder") : t("placeholderSignedOut")}
                    aria-label={t("title")}
                    className="min-h-24 bg-background text-foreground"
                    disabled={!canComment || isSubmitting}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{sessionLabel}</p>
                    <Button type="submit" disabled={!canComment || isSubmitting || content.trim().length === 0}>
                        {isSubmitting ? t("submitting") : t("submit")}
                    </Button>
                </div>
                {error ? <p className="text-sm text-destructive" role="alert">{tErrors(error)}</p> : null}
            </form>

            <div className="mt-8 divide-y divide-border border-t border-border">
                {comments.length === 0 ? (
                    <p className="py-6 text-sm text-muted-foreground">{t("empty")}</p>
                ) : (
                    comments.map((comment) => renderComment(comment))
                )}
            </div>
            {isTruncated ? (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                    {t("truncated", { shown: initialComments.length, total: remainingTotal ?? 0 })}
                </p>
            ) : null}

            <ConfirmDeleteDialog
                open={commentToDelete !== null}
                onOpenChange={handleDeleteDialogChange}
                title={t("deleteTitle")}
                description={t("deleteDescription", { replies: countComments(commentToDelete?.replies ?? []) })}
                confirmLabel={t("deleteConfirm")}
                pendingLabel={t("deleting")}
                cancelLabel={t("cancel")}
                isPending={isDeleting}
                error={deleteError ? tErrors(deleteError) : null}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
