"use client";

import { Check, Copy, ExternalLink, Network } from "lucide-react";
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
        <div>
            <SectionHeading title={t("title")} meta={t("count", { count: references.length })} />
            <ol className="mt-6">
                {references.map((reference, index) => (
                    <ReferenceItem key={reference.doi} reference={reference} index={index} />
                ))}
            </ol>
        </div>
    );
}

export function SectionHeading({ id, title, meta }: Readonly<{ id?: string; title: string; meta?: string }>) {
    return (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id={id} className="font-serif text-2xl font-medium tracking-[-0.01em] text-foreground sm:text-[1.75rem]">
                {title}
            </h2>
            {meta ? <span className="text-sm tabular-nums text-muted-foreground">{meta}</span> : null}
        </div>
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
        <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 border-t border-border py-5 first:border-t-0 first:pt-0 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
            <span className="pt-px font-serif text-base tabular-nums text-muted-foreground">{index + 1}.</span>

            <div className="min-w-0 wrap-anywhere">
                <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-[1.0625rem] font-medium leading-snug text-foreground underline decoration-border decoration-1 underline-offset-[3px] transition-colors hover:decoration-foreground"
                >
                    {reference.title || reference.doi}
                    <ExternalLink className="ml-1 inline size-3.5 align-[-1px] text-muted-foreground" aria-hidden />
                </a>

                {authors.length > 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {authors.join(", ")}
                        {moreAuthors > 0 ? ` ${t("authorsMore", { count: moreAuthors })}` : ""}
                    </p>
                ) : null}

                {reference.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground/75">{reference.description}</p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground">
                    <span className="mr-1 truncate font-mono">doi:{reference.doi}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => void copyDoi()}
                        aria-label={copied ? t("copied") : t("copyDoi")}
                        title={copied ? t("copied") : t("copyDoi")}
                        className="text-muted-foreground"
                    >
                        {copied ? <Check className="text-teal-700 dark:text-teal-300" /> : <Copy />}
                    </Button>
                    <span aria-hidden className="mx-1 hidden text-border sm:inline">|</span>
                    <Button
                        type="button"
                        variant="link"
                        size="xs"
                        onClick={() => showReferenceInGraph(reference.doi)}
                        className="h-auto px-0 text-xs font-medium text-teal-800 dark:text-teal-300"
                    >
                        <Network /> {t("showInGraph")}
                    </Button>
                </div>
            </div>
        </li>
    );
}
