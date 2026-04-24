"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useVoteStore } from "@/hooks/stores/useVoteStore";
import { useAuthStore } from "@/hooks/stores/useAuthStore";
import { CommentItem } from "@/types/comments";
import {
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
    const [comments, setComments] = useState<CommentItem[]>(initialComments);
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    const { setVote, clearVote, getVote } = useVoteStore();

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        setComments(initialComments);
    }, [initialComments]);

    const canComment = Boolean(accessToken) && !authError;
    const commentsLabel = getCommentsLabel(comments.length);
    const sessionLabel = getSessionLabel(isLoading, canComment);
    const handleRateComment = createRateCommentHandler({
        articleId,
        accessToken,
        authError,
        setVote,
        clearVote,
        setComments,
        setError,
    });
    const submitComment = createSubmitCommentHandler({
        articleId,
        canComment,
        isSubmitting: isSubmitting,
        setComments,
        setContent,
        setIsSubmitting,
        setError,
    });

    const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        submitComment(content);
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
                        comments.map((comment) => (
                            <article key={comment.id} className="rounded-2xl border border-border bg-background p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{comment.user.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(comment.datePosted).toLocaleString("pl-PL", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "numeric",
                                                minute: "2-digit",
                                            })}
                                            {comment.editedAt ? " · edytowano" : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isHydrated ? (
                                            (() => {
                                                const userVote = getVote(articleId, comment.id);
                                                const isPositiveVote = userVote === "positive";
                                                const isNegativeVote = userVote === "negative";
                                                const hasVoted = userVote !== undefined;
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
                                            })()
                                        ) : (
                                            <>
                                                <Button variant="outline" size="xs" disabled>
                                                    +{comment.rating.positive}
                                                </Button>
                                                <Button variant="outline" size="xs" disabled>
                                                    -{comment.rating.negative}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{comment.content}</p>
                            </article>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
