import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ArticleRating } from "@/types/articles";

export default function ArticleRatingBadge({ rating }: Readonly<{ rating: ArticleRating }>) {
  const t = useTranslations("articles");

  return (
    <span className="inline-flex items-center gap-2.5 text-xs font-medium normal-case tracking-normal tabular-nums text-muted-foreground">
      <span className="sr-only">{t("ratingSummary", rating)}</span>
      <span className="inline-flex items-center gap-1" aria-hidden>
        <ThumbsUp className="size-3.5" aria-hidden />
        {rating.positive}
      </span>
      <span className="inline-flex items-center gap-1" aria-hidden>
        <ThumbsDown className="size-3.5" aria-hidden />
        {rating.negative}
      </span>
    </span>
  );
}
