"use client";

import { ChevronRight, Download, History } from "lucide-react";
import dynamic from "next/dynamic";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import { EditorSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import type { ArticleComplexity } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";
import {
  COMPLEXITY_OPTIONS,
  createHandleArticleSubmit,
  createHandleFetchDoiMetadata,
  type DoiMetadataStatus,
  type EditableArticle,
  TITLE_MAX_LENGTH,
} from "./articleCreateFormController";
import {
  clearDraft,
  DRAFT_SAVE_DELAY_MS,
  forgetInitialDraft,
  getDraftKey,
  getInitialDraftRaw,
  isDraftEmpty,
  parseDraft,
  subscribeToNothing,
  writeDraft,
} from "./articleDraft";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <EditorSkeleton className="h-75 md:h-125" />,
});

const fieldLabel = "text-sm font-medium text-foreground";
const panelSection = "px-5 py-5";

type ArticleCreateFormProps = Readonly<{
  initialScientific?: boolean;
  article?: EditableArticle;
  draftOwnerId?: string | null;
}>;

export default function ArticleCreateForm({ initialScientific = false, article, draftOwnerId = null }: ArticleCreateFormProps) {
  const t = useTranslations();
  const format = useFormatter();
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const editorColorMode = mounted ? (resolvedTheme === "dark" ? "dark" : "light") : undefined;
  const isMobile = useIsMobile();
  const isEditing = article !== undefined;
  const hasReference = Boolean(article?.doi);
  const [scientific, setScientific] = useState(article ? hasReference : initialScientific);
  const [title, setTitle] = useState(article?.title ?? "");
  const [doi, setDoi] = useState(article?.doi ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [complexity, setComplexity] = useState<ArticleComplexity>(article?.complexity ?? "SIMPLE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataStatus, setMetadataStatus] = useState<DoiMetadataStatus | null>(null);
  const [draftDecided, setDraftDecided] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const draftKey = isEditing ? null : getDraftKey(draftOwnerId);
  const initialDraftRaw = useSyncExternalStore(subscribeToNothing, () => getInitialDraftRaw(draftKey), () => null);
  const savedDraft = draftDecided ? null : parseDraft(initialDraftRaw);

  useEffect(() => () => forgetInitialDraft(draftKey), [draftKey]);

  useEffect(() => {
    if (!draftKey || savedDraft || isSubmitting || isDraftEmpty({ title, content, doi })) return;
    const timer = globalThis.setTimeout(() => {
      const savedAt = new Date().toISOString();
      if (writeDraft(draftKey, { scientific, title, content, doi, complexity, savedAt })) setDraftSavedAt(savedAt);
    }, DRAFT_SAVE_DELAY_MS);
    return () => globalThis.clearTimeout(timer);
  }, [draftKey, savedDraft, isSubmitting, scientific, title, content, doi, complexity]);

  const restoreDraft = () => {
    if (!savedDraft) return;
    setScientific(savedDraft.scientific);
    setTitle(savedDraft.title);
    setContent(savedDraft.content);
    setDoi(savedDraft.doi);
    setComplexity(savedDraft.complexity);
    setDraftSavedAt(savedDraft.savedAt);
    setDraftDecided(true);
  };

  const discardDraft = () => {
    clearDraft(draftKey);
    setDraftDecided(true);
  };

  const isDirty = article
    ? title !== article.title || content !== article.content || doi !== article.doi || complexity !== article.complexity
    : Boolean(title.trim() || content.trim() || doi.trim());
  useEffect(() => {
    if (!isDirty || isSubmitting) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    globalThis.addEventListener("beforeunload", onBeforeUnload);
    return () => globalThis.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  const handleSubmit = createHandleArticleSubmit({
    editedArticle: article,
    scientific,
    title,
    content,
    doi,
    complexity,
    isSubmitting,
    setIsSubmitting,
    setError,
    onSubmitStart: () => clearDraft(draftKey),
  });

  const handleFetchMetadata = createHandleFetchDoiMetadata({
    doi,
    title,
    content,
    labels: { authors: t("create.metadata.authorsHeading"), abstract: t("create.metadata.abstractHeading") },
    isFetching: isFetchingMetadata,
    setIsFetching: setIsFetchingMetadata,
    setTitle,
    setContent,
    setStatus: setMetadataStatus,
  });

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
      {savedDraft ? (
        <div
          role="region"
          aria-label={t("create.draft.foundTitle")}
          className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-2"
        >
          <div className="flex min-w-0 items-start gap-3">
            <History className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 text-sm">
              <p className="font-medium text-foreground">
                {t("create.draft.foundTitle")}
                {" · "}
                <span className="font-normal text-muted-foreground">
                  {format.dateTime(new Date(savedDraft.savedAt), { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </p>
              {savedDraft.title.trim() ? <p className="mt-0.5 truncate text-muted-foreground">{savedDraft.title}</p> : null}
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{t("create.draft.foundHint")}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" size="sm" onClick={restoreDraft}>
              {t("create.draft.restore")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={discardDraft}>
              {t("create.draft.discard")}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="sheet flex min-w-0 flex-col overflow-hidden">
        <div className="px-5 pt-5 sm:px-8 sm:pt-7">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="title" className={fieldLabel}>
              {t("create.titleLabel")}
            </label>
            <span
              className={cn(
                "text-xs tabular-nums text-muted-foreground",
                title.length > TITLE_MAX_LENGTH * 0.9 && "text-amber-700 dark:text-amber-400",
              )}
            >
              {t("create.titleCounter", { count: title.length, max: TITLE_MAX_LENGTH })}
            </span>
          </div>
          <input
            id="title"
            value={title}
            maxLength={TITLE_MAX_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("create.titlePlaceholder")}
            autoComplete="off"
            className="mt-1 w-full border-b border-border bg-transparent pb-4 pt-1 font-serif text-[1.75rem] font-medium leading-tight tracking-[-0.01em] text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-foreground/50 sm:text-[2.125rem]"
          />
        </div>

        <div className="px-5 pb-2 pt-6 sm:px-8">
          <label htmlFor="content" className={fieldLabel}>
            {scientific ? t("create.scientificContentLabel") : t("create.contentLabel")}
          </label>
        </div>
        <div className="px-5 sm:px-8">
          <div className="overflow-hidden rounded-md border border-border" data-color-mode={editorColorMode}>
            <MDEditor
              value={content}
              onChange={(value) => setContent(value ?? "")}
              preview={isMobile ? "edit" : "live"}
              height={isMobile ? 300 : 500}
              visibleDragbar={false}
              textareaProps={{
                id: "content",
                placeholder: t("create.contentPlaceholder"),
              }}
              className="rounded-none! bg-background text-sm shadow-none!"
            />
          </div>
        </div>

        <details className="group px-5 py-4 text-sm text-muted-foreground sm:px-8">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden />
            {t("create.markdownHint")}
          </summary>
          <ul className="mt-3 grid gap-x-8 gap-y-1.5 pl-5.5 text-xs leading-5 sm:grid-cols-2">
            <li>{t("create.tips.headings")}</li>
            <li>{t("create.tips.lists")}</li>
            <li>{t("create.tips.code")}</li>
            <li>{t("create.tips.links")}</li>
          </ul>
        </details>
      </div>

      <aside className="sheet divide-y divide-border lg:sticky lg:top-6">
        <div className={panelSection}>
          <fieldset>
            <legend className={cn(fieldLabel, "mb-3")}>{t("create.typeLabel")}</legend>
            <div className="overflow-hidden rounded-md border border-border">
              <ChoiceRow
                name="article-type"
                checked={!scientific}
                onChange={() => setScientific(false)}
                disabled={hasReference}
                title={t("create.typeRegular")}
                description={t("create.typeRegularHint")}
              />
              <ChoiceRow
                name="article-type"
                checked={scientific}
                onChange={() => setScientific(true)}
                title={t("create.scientific")}
                description={t("create.typeScientificHint")}
              />
            </div>

            {scientific ? (
              <div className="mt-4 grid gap-2">
                <label htmlFor="doi" className={fieldLabel}>
                  {t("create.doiLabel")}
                </label>
                <Input
                  id="doi"
                  value={doi}
                  onChange={(event) => {
                    setDoi(event.target.value);
                    setMetadataStatus(null);
                  }}
                  placeholder={t("create.doiPlaceholder")}
                  className="bg-background font-mono text-sm"
                  aria-describedby="doi-hint"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchMetadata}
                  disabled={isFetchingMetadata || isSubmitting}
                  className="w-full"
                >
                  {isFetchingMetadata ? <Spinner className="size-4" /> : <Download className="size-4" aria-hidden />}
                  {isFetchingMetadata ? t("create.metadata.fetching") : t("create.metadata.fetch")}
                </Button>
                {metadataStatus?.kind === "error" ? (
                  <p className="text-xs leading-5 text-destructive" role="alert">
                    {t(`errors.${metadataStatus.error}`)}
                  </p>
                ) : null}
                <p className="text-xs leading-5 text-muted-foreground" role="status">
                  {metadataStatus?.kind === "info" ? t(`create.metadata.${metadataStatus.message}`) : null}
                </p>
                <p id="doi-hint" className="text-xs leading-5 text-muted-foreground">
                  {hasReference ? `${t("edit.doiUnchangedHint")} ${t("edit.referenceLocked")}` : t("create.doiHint")}
                </p>
              </div>
            ) : null}
          </fieldset>
        </div>

        <div className={panelSection}>
          <fieldset>
            <legend className={cn(fieldLabel, "mb-3")}>{t("create.complexityLabel")}</legend>
            <div className="overflow-hidden rounded-md border border-border">
              {COMPLEXITY_OPTIONS.map((option) => (
                <ChoiceRow
                  key={option}
                  name="complexity"
                  value={option}
                  checked={complexity === option}
                  onChange={() => setComplexity(option)}
                  title={t(`complexity.${option}`)}
                  description={t(`create.complexityHints.${option}`)}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div className={cn(panelSection, "flex flex-col gap-3")}>
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {t(`errors.${error}`)}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Spinner className="size-4" /> : null}
            {isSubmitting ? t(isEditing ? "edit.submitting" : "create.submitting") : t(isEditing ? "edit.submit" : "create.submit")}
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">{t(isEditing ? "edit.redirectHint" : "create.redirectHint")}</p>
          {draftKey ? (
            <p className="text-xs leading-5 text-muted-foreground" aria-live="polite">
              {draftSavedAt
                ? t("create.draft.savedAt", { time: format.dateTime(new Date(draftSavedAt), { timeStyle: "short" }) })
                : t("create.draft.autosaveHint")}
            </p>
          ) : null}
        </div>
      </aside>
    </form>
  );
}

function ChoiceRow({
  name,
  value,
  checked,
  onChange,
  disabled = false,
  title,
  description,
}: Readonly<{
  name: string;
  value?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  title: string;
  description: string;
}>) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 border-t border-border px-3 py-2.5 transition-colors first:border-t-0",
        "has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-ring",
        checked ? "bg-muted/70" : "hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-55 hover:bg-transparent",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "mt-0.75 flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
          checked ? "border-foreground" : "border-muted-foreground/50",
        )}
      >
        {checked ? <span className="size-1.5 rounded-full bg-foreground" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm text-foreground", checked && "font-medium")}>{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
