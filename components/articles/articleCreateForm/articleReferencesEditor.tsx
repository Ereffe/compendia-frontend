"use client";

import { ArrowDown, ArrowUp, Download, ExternalLink, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { SectionHeading } from "@/components/articles/articleReferences";
import { type DoiRecord, toNodeId } from "@/components/articles/articleGraph/articleGraphController";
import { fetchDoiRecord } from "@/components/articles/articleGraph/doiMetadata";
import { Skeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ErrorKey } from "@/types/errors";
import {
  addReferences,
  type DoiMetadata,
  type DoiMetadataMessage,
  moveReference,
  removeReference,
} from "./articleCreateFormController";

const MAX_AUTHORS = 4;

export const REFERENCE_INPUT_ID = "reference-doi";

type ArticleReferencesEditorProps = Readonly<{
  references: string[];
  onReferencesChange: (references: string[]) => void;
  doiInput: string;
  onDoiInputChange: (value: string) => void;
  minCount: number;
  disabled: boolean;
  onFill: (metadata: DoiMetadata | null) => void;
  fillMessage: DoiMetadataMessage | null;
}>;

export default function ArticleReferencesEditor({
  references,
  onReferencesChange,
  doiInput,
  onDoiInputChange,
  minCount,
  disabled,
  onFill,
  fillMessage,
}: ArticleReferencesEditorProps) {
  const t = useTranslations();
  const [records, setRecords] = useState<Record<string, DoiRecord>>({});
  const [addError, setAddError] = useState<ErrorKey | null>(null);
  const nextToLoad = references.find((doi) => !(toNodeId(doi) in records));

  // Crossref allows one request at a time, so previews load one by one.
  useEffect(() => {
    if (!nextToLoad) return;
    let active = true;
    void fetchDoiRecord(nextToLoad).then((record) => {
      if (active) setRecords((current) => ({ ...current, [toNodeId(nextToLoad)]: record }));
    });
    return () => {
      active = false;
    };
  }, [nextToLoad]);

  const add = () => {
    const result = addReferences(references, doiInput);
    setAddError(result.error);
    if (result.error) return;
    onReferencesChange(result.references);
    onDoiInputChange("");
  };

  const canRemove = references.length > minCount;

  return (
    <div>
      <SectionHeading
        id="article-references-heading"
        title={t("references.title")}
        meta={references.length > 0 ? t("references.count", { count: references.length }) : undefined}
      />

      {references.length > 0 ? (
        <ol className="mt-5" aria-labelledby="article-references-heading">
          {references.map((doi, index) => (
            <ReferenceRow
              key={toNodeId(doi)}
              doi={doi}
              index={index}
              record={records[toNodeId(doi)]}
              isFirst={index === 0}
              isLast={index === references.length - 1}
              canRemove={canRemove}
              disabled={disabled}
              onMove={(offset) => onReferencesChange(moveReference(references, index, offset))}
              onRemove={() => onReferencesChange(removeReference(references, index))}
              onFill={onFill}
            />
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{t("create.references.empty")}</p>
      )}

      <p className="mt-3 text-xs leading-5 text-muted-foreground empty:hidden" role="status">
        {fillMessage ? t(`create.metadata.${fillMessage}`) : null}
      </p>
      {!canRemove && minCount > 0 ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("create.references.locked")}</p>
      ) : null}

      <div className="mt-5 grid gap-2">
        <label htmlFor={REFERENCE_INPUT_ID} className="text-sm font-medium text-foreground">
          {t("create.references.addLabel")}
        </label>
        <div className="flex items-start gap-2">
          <Textarea
            id={REFERENCE_INPUT_ID}
            value={doiInput}
            rows={1}
            disabled={disabled}
            onChange={(event) => {
              onDoiInputChange(event.target.value);
              setAddError(null);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
              event.preventDefault();
              add();
            }}
            placeholder={t("create.references.placeholder")}
            aria-describedby="reference-doi-hint"
            aria-invalid={addError ? true : undefined}
            className="min-h-9 resize-none bg-background font-mono text-sm"
          />
          <Button type="button" variant="outline" onClick={add} disabled={disabled} className="shrink-0">
            <Plus className="size-4" aria-hidden />
            {t("create.references.add")}
          </Button>
        </div>
        {addError ? (
          <p className="text-xs leading-5 text-destructive" role="alert">
            {t(`errors.${addError}`)}
          </p>
        ) : null}
        <p id="reference-doi-hint" className="text-xs leading-5 text-muted-foreground">
          {t("create.references.hint")}
        </p>
      </div>
    </div>
  );
}

function ReferenceRow({
  doi,
  index,
  record,
  isFirst,
  isLast,
  canRemove,
  disabled,
  onMove,
  onRemove,
  onFill,
}: Readonly<{
  doi: string;
  index: number;
  record: DoiRecord | undefined;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  disabled: boolean;
  onMove: (offset: number) => void;
  onRemove: () => void;
  onFill: (metadata: DoiMetadata | null) => void;
}>) {
  const t = useTranslations();
  const node = record?.node ?? null;
  const authors = node?.authors?.slice(0, MAX_AUTHORS) ?? [];
  const moreAuthors = (node?.authors?.length ?? 0) - authors.length;

  return (
    <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 border-t border-border py-4 first:border-t-0 first:pt-0 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
      <span className="pt-px font-serif text-base tabular-nums text-muted-foreground">{index + 1}.</span>

      <div className="min-w-0 wrap-anywhere">
        {record === undefined ? (
          <div className="grid gap-2 pt-1" aria-label={t("create.references.loading")} role="img">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        ) : node ? (
          <>
            <a
              href={`https://doi.org/${doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-[1.0625rem] font-medium leading-snug text-foreground underline decoration-border decoration-1 underline-offset-[3px] transition-colors hover:decoration-foreground"
            >
              {node.title}
              <ExternalLink className="ml-1 inline size-3.5 align-[-1px] text-muted-foreground" aria-hidden />
            </a>
            {authors.length > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {authors.join(", ")}
                {moreAuthors > 0 ? ` ${t("references.authorsMore", { count: moreAuthors })}` : ""}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-amber-800 dark:text-amber-300">{t("create.references.notFound")}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground">
          <span className="mr-1 font-mono">doi:{doi}</span>
          <span className="ml-auto flex items-center gap-0.5">
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={() => onFill(node)}
              disabled={disabled || record === undefined}
              aria-label={t("create.references.fill", { doi })}
              className="h-auto px-1 text-xs font-medium text-teal-800 dark:text-teal-300"
            >
              <Download /> {t("create.metadata.fetch")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onMove(-1)}
              disabled={disabled || isFirst}
              aria-label={t("create.references.moveUp", { doi })}
              title={t("create.references.moveUp", { doi })}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onMove(1)}
              disabled={disabled || isLast}
              aria-label={t("create.references.moveDown", { doi })}
              title={t("create.references.moveDown", { doi })}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onRemove}
              disabled={disabled || !canRemove}
              aria-label={t("create.references.remove", { doi })}
              title={t("create.references.remove", { doi })}
              className="hover:text-destructive"
            >
              <X />
            </Button>
          </span>
        </div>
      </div>
    </li>
  );
}
