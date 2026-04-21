"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useVoteStore } from "@/hooks/stores/useVoteStore";
import { useAuthStore } from "@/hooks/stores/useAuthStore";

type CommentItem = {
    id: string;
    content: string;
    datePosted: string;
    editedAt?: string | null;
    user: {
        id: string;
        name: string;
    };
    rating: {
        positive: number;
        negative: number;
    };
};

type ArticleCommentsProps = Readonly<{
    articleId: string;
    initialComments: CommentItem[];
}>;

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8080";

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
  }
}
`;

const upvoteCommentMutation = `
mutation RateComment($commentId: Int!, $positive: Boolean!) {
  rateComment(commentId: $commentId, positive: $positive)
}
`

const updateCommentRating = (comments: CommentItem[], commentId: string, voteType: "positive" | "negative", delta: 1 | -1) =>
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
    let commentsLabel = "Be the first to comment on this article.";
    if (comments.length > 0) {
        commentsLabel = `${comments.length} comment${comments.length === 1 ? "" : "s"}`;
    }

    let sessionLabel = "You need to be signed in to comment.";
    if (isLoading) {
        sessionLabel = "Checking your session...";
    } else if (canComment) {
        sessionLabel = "";
    }

    const handleRateComment = (commentId: string, positive: boolean) => {
        if (!accessToken || authError) {
            setError("You must be signed in to vote");
            return;
        }

        const voteType = positive ? "positive" : "negative";
        setVote(articleId, commentId, voteType);
        setComments((currentComments) => updateCommentRating(currentComments, commentId, voteType, 1));
        setError(null);

        void (async () => {
            try {
                const response = await fetch(`${backendBaseUrl}/graphql`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
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
            } catch (rateError) {
                clearVote(articleId, commentId);
                setComments((currentComments) => updateCommentRating(currentComments, commentId, voteType, -1));
                setError(rateError instanceof Error ? rateError.message : "Failed to rate comment");
            }
        })();
    };

    const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedContent = content.trim();
        if (!trimmedContent || !canComment || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        void (async () => {
            try {
                const response = await fetch(`${backendBaseUrl}/graphql`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    cache: "no-store",
                    body: JSON.stringify({
                        query: addCommentMutation,
                        variables: {
                            articleId,
                            content: trimmedContent,
                            parentCommentId: null,
                        },
                    }),
                });

                const payload = (await response.json()) as { data?: { addComment?: CommentItem }; errors?: Array<{ message?: string }> };
                const addedComment = payload.data?.addComment;

                if (!response.ok || !addedComment) {
                    throw new Error(payload.errors?.[0]?.message ?? "Failed to add comment");
                }

                setComments((currentComments) => [addedComment, ...currentComments]);
                setContent("");
            } catch (submitError) {
                setError(submitError instanceof Error ? submitError.message : "Failed to add comment");
            } finally {
                setIsSubmitting(false);
            }
        })();
    };

    return (
        <Card className="border-border/70 bg-card/80 backdrop-blur">
            <CardHeader className="border-b border-border">
                <CardTitle className="text-xl text-foreground">Comments</CardTitle>
                <CardDescription>{commentsLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <form className="space-y-3" onSubmit={handleSubmit}>
                    <Textarea
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder={canComment ? "Write a comment..." : "Sign in to write a comment"}
                        className="min-h-28 rounded-xl border-border bg-background text-foreground"
                        disabled={!canComment || isSubmitting}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">{sessionLabel}</p>
                        <Button type="submit" disabled={!canComment || isSubmitting || content.trim().length === 0}>
                            {isSubmitting ? "Posting..." : "Post comment"}
                        </Button>
                    </div>
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                </form>

                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                            No comments yet.
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <article key={comment.id} className="rounded-2xl border border-border bg-background p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{comment.user.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(comment.datePosted).toLocaleString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "numeric",
                                                minute: "2-digit",
                                            })}
                                            {comment.editedAt ? " · edited" : ""}
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
                                                            title={hasVoted ? "Already voted" : "Upvote"}
                                                        >
                                                            +{comment.rating.positive}
                                                        </Button>
                                                        <Button
                                                            variant={isNegativeVote ? "default" : "outline"}
                                                            size="xs"
                                                            style={{ backgroundColor: "red", color: "white" }}
                                                            onClick={() => handleRateComment(comment.id, false)}
                                                            disabled={hasVoted}
                                                            title={hasVoted ? "Already voted" : "Downvote"}
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
