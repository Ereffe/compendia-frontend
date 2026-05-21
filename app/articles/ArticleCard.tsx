"use client";

import { ArticleSearchItem } from "@/components/articleSearchModal/articleSearchModalController";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/dist/client/link";

export default function ArticleCard({
    article,
    index,
}: Readonly<{ article: ArticleSearchItem; index: number }>) {
    const excerpt =
        article.content.length > 100
            ? `${article.content.slice(0, 100)}...`
            : article.content;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={`/articles/${article.id}`}>
                        <article
                            className="fade-in-up rounded-2xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur"
                            style={{ animationDelay: `${160 + index * 90}ms` }}
                        >
                            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest">
                                <span className="text-muted-foreground">{article.publishedAt}</span>
                            </div>
                            <h2 className="mt-4 text-center text-xl font-semibold text-foreground">
                                {article.title}
                            </h2>
                            <p className="mt-4 text-sm font-medium text-foreground/90">
                                By {article.author}
                            </p>
                        </article>
                    </Link>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                    <p>{excerpt}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}