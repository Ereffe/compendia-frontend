"use client";

import { ChevronDown, Network } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SHOW_IN_GRAPH_EVENT } from "@/components/articles/articleReferences";
import { cn } from "@/lib/utils";
import ArticleGraph from "./ArticleGraph";

type GraphReference = { doi: string; title?: string | null };

export default function ArticleGraphContainer({ references }: Readonly<{ references: GraphReference[] }>) {
    const t = useTranslations("graph");
    const [selectedDoi, setSelectedDoi] = useState(references[0]?.doi ?? "");
    const [expanded, setExpanded] = useState(true);
    const sectionRef = useRef<HTMLElement>(null);

    // "Show in graph" buttons in the references list switch the graph to that reference.
    useEffect(() => {
        const onShow = (event: Event) => {
            const doi = (event as CustomEvent<string>).detail;
            if (!references.some((reference) => reference.doi === doi)) return;
            setSelectedDoi(doi);
            setExpanded(true);
            sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        globalThis.addEventListener(SHOW_IN_GRAPH_EVENT, onShow);
        return () => globalThis.removeEventListener(SHOW_IN_GRAPH_EVENT, onShow);
    }, [references]);

    if (references.length === 0) {
        return null;
    }

    const selected = references.find((reference) => reference.doi === selectedDoi) ?? references[0];

    return (
        <section
            ref={sectionRef}
            data-testid="citation-graph"
            className="overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur"
        >
            <header className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300">
                        <Network className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">{t("title")}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground"
                        onClick={() => setExpanded((value) => !value)}
                        aria-expanded={expanded}
                    >
                        <span className="hidden sm:inline">{expanded ? t("hide") : t("show")}</span>
                        <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
                    </Button>
                </div>

                {expanded ? (
                    references.length > 1 ? (
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("reference")}</span>
                            <Select value={selected.doi} onValueChange={setSelectedDoi}>
                                <SelectTrigger className="w-full min-w-0 bg-background sm:max-w-xl" aria-label={t("chooseReference")}>
                                    <SelectValue placeholder={t("chooseReference")} />
                                </SelectTrigger>
                                <SelectContent className="max-w-[min(36rem,calc(100vw-2rem))]">
                                    {references.map((reference) => (
                                        <SelectItem key={reference.doi} value={reference.doi}>
                                            <span className="truncate">{reference.title || reference.doi}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <p className="truncate text-sm text-muted-foreground">
                            <span className="font-semibold uppercase tracking-wider text-xs">{t("reference")}:</span>{" "}
                            <span className="text-foreground">{selected.title || selected.doi}</span>
                        </p>
                    )
                ) : null}
            </header>

            {expanded && selected ? <ArticleGraph key={selected.doi} doi={selected.doi} initialLevel={2} /> : null}
        </section>
    );
}
