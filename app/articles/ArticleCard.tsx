"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { articleDateFormat } from "@/services/graphql/articles";
import type { ArticleSearchItem } from "@/types/articles";

const EXCERPT_LENGTH = 160;

export default function ArticleCard({ article }: Readonly<{ article: ArticleSearchItem }>) {
    const t = useTranslations("common");
    const format = useFormatter();
    const excerpt =
        article.content.length > EXCERPT_LENGTH
            ? `${article.content.slice(0, EXCERPT_LENGTH)}…`
            : article.content;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link href={`/articles/${article.id}`} className="block">
                    <article className="h-full rounded-2xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur transition-colors hover:border-teal-700/30">
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest">
                            <span className="text-muted-foreground">
                                {format.dateTime(new Date(article.datePosted), articleDateFormat)}
                            </span>
                        </div>
                        <h2 className="mt-4 text-center text-xl font-semibold text-foreground">{article.title}</h2>
                        <p className="mt-4 text-sm font-medium text-foreground/90">
                            {t("authorBy", { name: article.author ?? t("unknownAuthor") })}
                        </p>
                    </article>
                </Link>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">
                <p>{excerpt}</p>
            </TooltipContent>
        </Tooltip>
    );
}
