"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SectionHeading } from "@/components/articles/articleReferences";
import { Button } from "@/components/ui/button";
import { apaCitation, bibtexCitation, type CitationParts } from "@/lib/citation";

export default function ArticleCitation({ parts }: Readonly<{ parts: CitationParts }>) {
    const t = useTranslations("article.cite");

    return (
        <div>
            <SectionHeading title={t("title")} />
            <dl className="mt-6 grid gap-6">
                <div>
                    <CitationLabel label="APA" text={apaCitation(parts)} />
                    <dd className="mt-2 font-serif text-[1.0625rem] leading-relaxed text-foreground wrap-anywhere">
                        {parts.author ? `${parts.author}. ` : ""}({parts.date}). <i>{parts.title}</i>. Compendia.{" "}
                        <a href={parts.url} className="text-link underline decoration-1 underline-offset-[3px]">
                            {parts.url}
                        </a>
                    </dd>
                </div>
                <div>
                    <CitationLabel label="BibTeX" text={bibtexCitation(parts)} />
                    <dd className="mt-2">
                        <pre className="overflow-x-auto rounded-sm border border-border bg-muted px-4 py-3 font-mono text-[0.8125rem] leading-6 text-foreground">
                            {bibtexCitation(parts)}
                        </pre>
                    </dd>
                </div>
            </dl>
        </div>
    );
}

function CitationLabel({ label, text }: Readonly<{ label: string; text: string }>) {
    const t = useTranslations("article.cite");
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
        }
    };

    return (
        <dt className="flex items-center gap-1 text-sm font-semibold text-foreground">
            {label}
            <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => void copy()}
                aria-label={copied ? t("copied") : t("copy", { format: label })}
                title={copied ? t("copied") : t("copy", { format: label })}
                className="text-muted-foreground"
            >
                {copied ? <Check className="text-foreground" /> : <Copy />}
            </Button>
        </dt>
    );
}
