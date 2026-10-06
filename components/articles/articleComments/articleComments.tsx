"use client";

import { type ReactNode, type SyntheticEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";

import { useVoteStore } from "@/hooks/stores/useVoteStore";
import type { CommentItem } from "@/types/comments";
import type { ErrorKey } from "@/types/errors";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    buildCommentTree,
    countComments,
    createRateCommentHandler,
    createSubmitCommentHandler,
} from "./articleCommentsController";

const commentDateFormat = { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" } as const;

type ArticleCommentsProps = Readonly<{
    articleId: string;
    initialComments: CommentItem[];
    /** Total comments on the backend; can exceed initialComments.length when the list is truncated. */
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
    const [comments, setComments] = useState<CommentItem[]>(() => buildCommentTree(initialComments));
    const [content, setContent] = useState("");
    const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
    const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<ErrorKey | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    const { setVote, clearVote, getVote } = useVoteStore();

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        setComments(buildCommentTree(initialComments));
    }, [initialComments]);

    const totalComments = useMemo(() => countComments(comments), [comments]);
    const displayedTotal = Math.max(totalComments, totalCount ?? 0);
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
                setVote,
                clearVote,
                setComments,
                setError,
            }),
        [userKey, setVote, clearVote]
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
                    <Button variant="outline" size="xs" disabled>
                        +{comment.rating.positive}
                    </Button>
                    <Button variant="outline" size="xs" disabled>
                        -{comment.rating.negative}
                    </Button>
                </>
            );
        }

        return (
            <>
                <Button
                    variant={isPositiveVote ? "default" : "outline"}
                    size="xs"
                    className={isPositiveVote ? "bg-emerald-600 text-white hover:bg-emerald-700" : "text-emerald-700 dark:text-emerald-400"}
                    onClick={() => handleRateComment(comment.id, true)}
                    disabled={hasVoted || !canComment}
                    aria-label={t("upvote", { count: comment.rating.positive })}
                    title={hasVoted ? t("alreadyVoted") : undefined}
                >
                    +{comment.rating.positive}
                </Button>
                <Button
                    variant={isNegativeVote ? "default" : "outline"}
                    size="xs"
                    className={isNegativeVote ? "bg-red-600 text-white hover:bg-red-700" : "text-red-700 dark:text-red-400"}
                    onClick={() => handleRateComment(comment.id, false)}
                    disabled={hasVoted || !canComment}
                    aria-label={t("downvote", { count: comment.rating.negative })}
                    title={hasVoted ? t("alreadyVoted") : undefined}
                >
                    -{comment.rating.negative}
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
                className="min-h-20 rounded-xl border-border bg-background text-foreground"
                disabled={!canComment || isSubmitting}
            />
            <div className="flex justify-end gap-2">
                <Button type="submit" size="xs" disabled={isSubmitting || (replyDrafts[commentId] ?? "").trim().length === 0}>
                    {isSubmitting ? t("submitting") : t("submitReply")}
                </Button>
            </div>
        </form>
    );

    const renderComment = (
        comment: CommentItem,
        depth = 0
    ): ReactNode => {
        const userVote = isHydrated && userKey
            ? getVote(userKey, comment.id)
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

        return (
            <div key={comment.id} className="w-full">
                <article
                    className={[
                        "w-full rounded-2xl transition-all duration-200",
                        depth === 0
                            ? "border border-border bg-background p-4 shadow-sm"
                            : "bg-muted/30 p-3",
                    ].join(" ")}
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                    {comment.user.name}
                                </p>

                                {depth > 0 ? (
                                    <span className="text-xs text-muted-foreground">
                                        {t("replyBadge")}
                                    </span>
                                ) : null}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {format.dateTime(new Date(comment.datePosted), commentDateFormat)}
                                {comment.editedAt ? ` · ${t("edited")}` : ""}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {renderVoteButtons(
                                comment,
                                hasVoted,
                                isPositiveVote,
                                isNegativeVote
                            )}
                        </div>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90 wrap-anywhere">
                        {comment.content}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="xs"
                            className="h-auto px-0 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                                toggleReplyForm(comment.id)
                            }
                            disabled={!canComment}
                        >
                            {isReplyFormVisible ? t("cancel") : t("reply")}
                        </Button>

                        {hasReplies ? (
                            <Button
                                variant="ghost"
                                size="xs"
                                className="h-auto px-0 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                    toggleReplies(comment.id)
                                }
                            >
                                {getRepliesToggleLabel(
                                    repliesCount,
                                    isRepliesExpanded
                                )}
                            </Button>
                        ) : <Button
                            variant="ghost"
                            size="xs"
                            className="h-auto px-0 text-muted-foreground hover:text-foreground"
                            disabled
                        >
                            {getRepliesToggleLabel(
                                repliesCount,
                                isRepliesExpanded
                            )}
                        </Button>}
                    </div>

                    {isReplyFormVisible
                        ? renderReplyForm(comment.id)
                        : null}
                </article>

                {hasReplies && isRepliesExpanded ? (
                    <div className="relative mt-3 space-y-3 border-l border-border/50 pl-2 sm:pl-4">
                        {comment.replies?.map((reply) =>
                            renderComment(reply, depth + 1)
                        )}
                    </div>
                ) : null}
            </div>
        );
    };



    return (
        <Card className="border-border/70 bg-card/80 backdrop-blur">
            <CardHeader className="border-b border-border">
                <CardTitle className="text-xl text-foreground">{t("title")}</CardTitle>
                <CardDescription>{t("count", { count: displayedTotal })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <form className="space-y-3" onSubmit={handleSubmit}>
                    <Textarea
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder={canComment ? t("placeholder") : t("placeholderSignedOut")}
                        className="min-h-28 rounded-xl border-border bg-background text-foreground"
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

                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                            {t("empty")}
                        </div>
                    ) : (
                        comments.map((comment) => renderComment(comment))
                    )}
                    {isTruncated ? (
                        <p className="text-center text-sm text-muted-foreground">
                            {t("truncated", { shown: initialComments.length, total: totalCount })}
                        </p>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
