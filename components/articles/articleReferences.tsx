"use client";

import { BookOpen, Check, Copy, ExternalLink, Network } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ArticleReference } from "@/types/articles";

/** Event the citation graph listens for (see ArticleGraphContainer). */
export const SHOW_IN_GRAPH_EVENT = "compendia:show-in-graph";

export const showReferenceInGraph = (doi: string) =>
    globalThis.dispatchEvent(new CustomEvent<string>(SHOW_IN_GRAPH_EVENT, { detail: doi }));

const MAX_AUTHORS = 4;

export default function ArticleReferences({ references }: Readonly<{ references: ArticleReference[] }>) {
    const t = useTranslations("references");

    return (
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur">
            <header className="flex items-center gap-3 border-b border-border/70 p-4 sm:p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300">
                    <BookOpen className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">{t("title")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {t("count", { count: references.length })}
                </span>
            </header>

            <ol className="flex flex-col gap-3 p-4 sm:p-6">
                {references.map((reference, index) => (
                    <ReferenceItem key={reference.doi} reference={reference} index={index} />
                ))}
            </ol>
        </section>
    );
}

function ReferenceItem({ reference, index }: Readonly<{ reference: ArticleReference; index: number }>) {
    const t = useTranslations("references");
    const [copied, setCopied] = useState(false);
    const authors = reference.authors.slice(0, MAX_AUTHORS);
    const moreAuthors = reference.authors.length - authors.length;

    const copyDoi = async () => {
        try {
            await navigator.clipboard.writeText(reference.doi);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard can be unavailable (insecure context); the DOI text stays selectable.
        }
    };

    return (
        <li className="flex gap-3 rounded-xl border border-border/60 bg-background/60 p-4 transition-colors hover:border-teal-600/40 sm:gap-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                {index + 1}
            </span>

            <div className="min-w-0 flex-1 wrap-anywhere">
                <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline font-semibold leading-snug text-foreground transition-colors hover:text-teal-700 dark:hover:text-teal-300"
                >
                    {reference.title || reference.doi}
                    <ExternalLink className="ml-1 inline size-3.5 align-[-2px] text-muted-foreground transition-colors group-hover:text-teal-600" />
                </a>

                {authors.length > 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {authors.join(", ")}
                        {moreAuthors > 0 ? ` ${t("authorsMore", { count: moreAuthors })}` : ""}
                    </p>
                ) : null}

                {reference.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground/90">{reference.description}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex max-w-full items-center gap-1 rounded-lg border border-border bg-muted/40 py-0.5 pl-2.5 pr-0.5">
                        <code className="truncate text-xs text-foreground">{reference.doi}</code>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => void copyDoi()}
                            aria-label={copied ? t("copied") : t("copyDoi")}
                            title={copied ? t("copied") : t("copyDoi")}
                        >
                            {copied ? <Check className="text-teal-600" /> : <Copy />}
                        </Button>
                    </span>
                    <Button type="button" variant="ghost" size="xs" onClick={() => showReferenceInGraph(reference.doi)} className="text-teal-700 dark:text-teal-300">
                        <Network /> {t("showInGraph")}
                    </Button>
                </div>
            </div>
        </li>
    );
}
