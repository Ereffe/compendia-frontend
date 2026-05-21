"use client";

import { type ReactNode, type SyntheticEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/hooks/stores/useAuthStore";
import { useVoteStore } from "@/hooks/stores/useVoteStore";
import { CommentItem } from "@/types/comments";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    buildCommentTree,
    countComments,
    createRateCommentHandler,
    createSubmitCommentHandler,
    getCommentsLabel,
    getSessionLabel,
} from "./articleCommentsController";

type ArticleCommentsProps = Readonly<{
    articleId: string;
    initialComments: CommentItem[];
}>;

export default function ArticleComments({ articleId, initialComments }: ArticleCommentsProps) {
    const { accessToken, isLoading, error: authError } = useAuthStore();
    const [comments, setComments] = useState<CommentItem[]>(() => buildCommentTree(initialComments));
    const [content, setContent] = useState("");
    const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
    const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    const { setVote, clearVote, getVote } = useVoteStore();

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        setComments(buildCommentTree(initialComments));
    }, [initialComments]);

    const canComment = useMemo(() => Boolean(accessToken) && !authError, [accessToken, authError]);
    const totalComments = useMemo(() => countComments(comments), [comments]);
    const commentsLabel = useMemo(() => getCommentsLabel(totalComments), [totalComments]);
    const sessionLabel = useMemo(() => getSessionLabel(isLoading, canComment), [isLoading, canComment]);

    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat("pl-PL", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
            }),
        []
    );

    const handleRateComment = useMemo(
        () =>
            createRateCommentHandler({
                articleId,
                accessToken,
                authError,
                setVote,
                clearVote,
                setComments,
                setError,
            }),
        [articleId, accessToken, authError, setVote, clearVote]
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

    const getRepliesToggleLabel = useCallback((repliesCount: number, isExpanded: boolean) => {
        if (isExpanded) {
            return "Ukryj odpowiedzi";
        }

        if (repliesCount === 0) {
            return "Brak odpowiedzi";
        }

        if (repliesCount === 1) {
            return "Pokaż 1 odpowiedź";
        }
        return `Pokaż ${repliesCount} odpowiedzi`;
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
                    style={{ backgroundColor: "green", color: "white" }}
                    onClick={() => handleRateComment(comment.id, true)}
                    disabled={hasVoted}
                    title={hasVoted ? "Już zagłosowano" : "Głos pozytywny"}
                >
                    +{comment.rating.positive}
                </Button>
                <Button
                    variant={isNegativeVote ? "default" : "outline"}
                    size="xs"
                    style={{ backgroundColor: "red", color: "white" }}
                    onClick={() => handleRateComment(comment.id, false)}
                    disabled={hasVoted}
                    title={hasVoted ? "Już zagłosowano" : "Głos negatywny"}
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
                placeholder="Napisz odpowiedź..."
                className="min-h-20 rounded-xl border-border bg-background text-foreground"
                disabled={!canComment || isSubmitting}
            />
            <div className="flex justify-end gap-2">
                <Button type="submit" size="xs" disabled={isSubmitting || (replyDrafts[commentId] ?? "").trim().length === 0}>
                    {isSubmitting ? "Publikowanie..." : "Dodaj odpowiedź"}
                </Button>
            </div>
        </form>
    );

    const renderComment = (
        comment: CommentItem,
        depth = 0
    ): ReactNode => {
        const userVote = isHydrated
            ? getVote(articleId, comment.id)
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
                                        odpowiedź
                                    </span>
                                ) : null}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {dateFormatter.format(
                                    new Date(comment.datePosted)
                                )}

                                {comment.editedAt
                                    ? " · edytowano"
                                    : ""}
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

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
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
                            {isReplyFormVisible
                                ? "Anuluj"
                                : "Odpowiedz"}
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
                    <div className="relative mt-3 border-l border-border/50 pl-4 space-y-3">
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
                <CardTitle className="text-xl text-foreground">Komentarze</CardTitle>
                <CardDescription>{commentsLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <form className="space-y-3" onSubmit={handleSubmit}>
                    <Textarea
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder={canComment ? "Napisz komentarz..." : "Zaloguj się, aby napisać komentarz"}
                        className="min-h-28 rounded-xl border-border bg-background text-foreground"
                        disabled={!canComment || isSubmitting}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">{sessionLabel}</p>
                        <Button type="submit" disabled={!canComment || isSubmitting || content.trim().length === 0}>
                            {isSubmitting ? "Publikowanie..." : "Dodaj komentarz"}
                        </Button>
                    </div>
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                </form>

                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                            Brak komentarzy.
                        </div>
                    ) : (
                        comments.map((comment) => renderComment(comment))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
