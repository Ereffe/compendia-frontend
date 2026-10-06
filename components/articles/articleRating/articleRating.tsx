"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { articleVoteId, useVoteStore } from "@/hooks/stores/useVoteStore";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import type { ArticleRating as Rating } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";

import { createRateArticleHandler } from "./articleRatingController";

const voteClass = "gap-1.5 tabular-nums text-muted-foreground";

export default function ArticleRating({ articleId, initialRating }: Readonly<{ articleId: string; initialRating: Rating }>) {
  const t = useTranslations("article");
  const tErrors = useTranslations("errors");
  const tToasts = useTranslations("toasts");
  const mounted = useMounted();
  const { data: session, status } = useSession();
  const canVote = status === "authenticated" && !session?.error;
  const userKey = canVote ? (session?.user?.id ?? session?.user?.email ?? null) : null;
  const [rating, setRating] = useState(initialRating);
  const [error, setError] = useState<ErrorKey | null>(null);
  const getVote = useVoteStore((state) => state.getVote);
  const setVote = useVoteStore((state) => state.setVote);
  const clearVote = useVoteStore((state) => state.clearVote);
  const storedVote = useVoteStore((state) => (userKey ? state.votes[userKey]?.[articleVoteId(articleId)] : undefined));

  const userVote = mounted ? storedVote : undefined;
  const hasVoted = userVote !== undefined;
  const disabled = !mounted || !canVote || hasVoted;

  const rate = createRateArticleHandler({
    articleId,
    userKey,
    getVote,
    setVote,
    clearVote,
    setRating,
    setError,
    onRated: () => toast.success(tToasts("voteSaved")),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-muted-foreground">{hasVoted ? t("thanksForRating") : t("ratePrompt")}</p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className={cn(voteClass, userVote === "positive" && "text-emerald-700 disabled:opacity-100 dark:text-emerald-400")}
            onClick={() => rate(true)}
            disabled={disabled}
            aria-label={t("upvote", { count: rating.positive })}
            title={hasVoted ? t("alreadyRated") : undefined}
          >
            <ThumbsUp aria-hidden /> {rating.positive}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(voteClass, userVote === "negative" && "text-red-700 disabled:opacity-100 dark:text-red-400")}
            onClick={() => rate(false)}
            disabled={disabled}
            aria-label={t("downvote", { count: rating.negative })}
            title={hasVoted ? t("alreadyRated") : undefined}
          >
            <ThumbsDown aria-hidden /> {rating.negative}
          </Button>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {tErrors(error)}
        </p>
      ) : null}
    </div>
  );
}
