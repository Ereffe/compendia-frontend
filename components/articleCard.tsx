import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";

import ArticleRatingBadge from "@/components/articleRatingBadge";
import { toExcerpt } from "@/lib/excerpt";
import { articleDateFormat } from "@/services/graphql/articles";
import type { ArticleSearchItem } from "@/types/articles";

export default function ArticleCard({ article }: Readonly<{ article: ArticleSearchItem }>) {
  const t = useTranslations("common");
  const tArticles = useTranslations("articles");
  const tComplexity = useTranslations("complexity");
  const format = useFormatter();
  const excerpt = toExcerpt(article.content);

  return (
    <article className="relative flex h-full flex-col rounded-sm border border-border bg-card p-5 text-left transition-colors hover:border-muted-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <time dateTime={article.datePosted}>{format.dateTime(new Date(article.datePosted), articleDateFormat)}</time>
        <span aria-hidden>·</span>
        <span>{tComplexity(article.complexity)}</span>
      </p>
      <h2 className="mt-3 line-clamp-3 font-serif text-xl font-medium leading-snug text-foreground wrap-break-word">
        <Link href={`/articles/${article.id}`} className="outline-none after:absolute after:inset-0 after:rounded-sm">
          {article.title}
        </Link>
      </h2>
      {excerpt ? (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground wrap-anywhere">{excerpt}</p>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-muted-foreground">
        {article.author && article.authorId ? (
          <Link href={`/users/${article.authorId}`} className="relative z-10 min-w-0 truncate underline-offset-4 hover:text-foreground hover:underline">
            {t("authorBy", { name: article.author })}
          </Link>
        ) : (
          <span className="min-w-0 truncate">{t("authorBy", { name: t("unknownAuthor") })}</span>
        )}
        <span className="flex shrink-0 items-center gap-3">
          {article.rating.positive + article.rating.negative > 0 ? <ArticleRatingBadge rating={article.rating} /> : null}
          {!article.commentCount ? null : (
            <span
              className="inline-flex items-center gap-1 tabular-nums"
              role="img"
              aria-label={tArticles("commentCount", { count: article.commentCount })}
            >
              <MessageSquare className="size-3.5" aria-hidden />
              {article.commentCount}
            </span>
          )}
        </span>
      </div>
    </article>
  );
}
