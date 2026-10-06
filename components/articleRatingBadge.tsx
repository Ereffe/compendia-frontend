import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ArticleRating } from "@/types/articles";

export default function ArticleRatingBadge({ rating }: Readonly<{ rating: ArticleRating | null }>) {
  const t = useTranslations("articles");
  if (!rating) return null;

  return (
    <span
      className="inline-flex items-center gap-2.5 text-xs font-medium normal-case tracking-normal tabular-nums text-muted-foreground"
      aria-label={t("ratingSummary", rating)}
      role="img"
    >
      <span className="inline-flex items-center gap-1">
        <ThumbsUp className="size-3.5" aria-hidden />
        {rating.positive}
      </span>
      <span className="inline-flex items-center gap-1">
        <ThumbsDown className="size-3.5" aria-hidden />
        {rating.negative}
      </span>
    </span>
  );
}
