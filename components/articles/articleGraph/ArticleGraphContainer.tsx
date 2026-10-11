"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeading, SHOW_IN_GRAPH_EVENT } from "@/components/articles/articleReferences";
import { cn } from "@/lib/utils";
import ArticleGraph from "./ArticleGraph";

type GraphReference = { doi: string; title?: string | null };

export default function ArticleGraphContainer({
    references,
    headerClassName,
}: Readonly<{ references: GraphReference[]; headerClassName?: string }>) {
    const t = useTranslations("graph");
    const [selectedDoi, setSelectedDoi] = useState(references[0]?.doi ?? "");
    const [expanded, setExpanded] = useState(true);
    const sectionRef = useRef<HTMLDivElement>(null);

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
        <div ref={sectionRef} data-testid="citation-graph">
            <header className={cn("flex flex-col gap-4", headerClassName)}>
                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <SectionHeading title={t("title")} />
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

                {expanded ? <ReferencePicker references={references} selected={selected} onSelect={setSelectedDoi} /> : null}
            </header>

            {expanded && selected ? (
                <div className="mt-6 overflow-hidden rounded-md border border-border bg-card">
                    <ArticleGraph key={selected.doi} doi={selected.doi} initialLevel={2} />
                </div>
            ) : null}
        </div>
    );
}

function ReferencePicker({
    references,
    selected,
    onSelect,
}: Readonly<{ references: GraphReference[]; selected: GraphReference; onSelect: (doi: string) => void }>) {
    const t = useTranslations("graph");
    if (references.length === 1) {
        return (
            <p className="truncate text-sm text-muted-foreground">
                {t("reference")}: <span className="font-serif text-base text-foreground">{selected.title || selected.doi}</span>
            </p>
        );
    }
    return (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm text-muted-foreground">{t("reference")}</span>
            <Select value={selected.doi} onValueChange={onSelect}>
                <SelectTrigger className="w-full min-w-0 bg-background sm:max-w-md" aria-label={t("chooseReference")}>
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
    );
}
