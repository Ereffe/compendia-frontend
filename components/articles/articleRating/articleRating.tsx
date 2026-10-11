"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Vote } from "@/lib/votes";
import type { ArticleRating as Rating } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";

import { createRateArticleHandler } from "./articleRatingController";

const voteClass = "gap-1.5 tabular-nums text-muted-foreground";

type ArticleRatingProps = Readonly<{ articleId: string; initialRating: Rating; initialVote: Vote }>;

export default function ArticleRating({ articleId, initialRating, initialVote }: ArticleRatingProps) {
  const t = useTranslations("article");
  const tErrors = useTranslations("errors");
  const tToasts = useTranslations("toasts");
  const { data: session, status } = useSession();
  const canVote = status === "authenticated" && !session?.error;
  const [rating, setRating] = useState(initialRating);
  const [vote, setVote] = useState(initialVote);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const disabled = !canVote || pending;

  const rate = createRateArticleHandler({
    articleId,
    canVote,
    vote,
    setVote,
    setRating,
    setPending,
    setError,
    onRated: (next) => toast.success(tToasts(next === null ? "voteRemoved" : "voteSaved")),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-muted-foreground">{vote === null ? t("ratePrompt") : t("thanksForRating")}</p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className={cn(voteClass, vote === true && "text-foreground disabled:opacity-100 [&_svg]:fill-current")}
            onClick={() => rate(true)}
            disabled={disabled}
            aria-pressed={vote === true}
            aria-label={t("upvote", { count: rating.positive })}
            title={vote === true ? t("removeVote") : undefined}
          >
            <ThumbsUp aria-hidden /> {rating.positive}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(voteClass, vote === false && "text-foreground disabled:opacity-100 [&_svg]:fill-current")}
            onClick={() => rate(false)}
            disabled={disabled}
            aria-pressed={vote === false}
            aria-label={t("downvote", { count: rating.negative })}
            title={vote === false ? t("removeVote") : undefined}
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
