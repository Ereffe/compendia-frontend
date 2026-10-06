"use client";

import { BookOpenText, FileText, FlaskConical, Info, Send } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
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
import { COMPLEXITY_OPTIONS, createHandleArticleSubmit, TITLE_MAX_LENGTH } from "./articleCreateFormController";

// The editor is large and browser-only; keep it out of the server render and the initial bundle.
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <EditorSkeleton className="h-70 md:h-120" />,
});

const card = "rounded-2xl border border-border/70 bg-card/85 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur";
const fieldLabel = "text-sm font-semibold text-foreground";

export default function ArticleCreateForm({ initialScientific = false }: Readonly<{ initialScientific?: boolean }>) {
  const t = useTranslations();
  const { resolvedTheme } = useTheme();
  // resolvedTheme is undefined on the server: only set the editor's color mode after mount, so the
  // server HTML and the first client render match (no hydration mismatch).
  const mounted = useMounted();
  const editorColorMode = mounted ? (resolvedTheme === "dark" ? "dark" : "light") : undefined;
  // Below 768px a side-by-side preview leaves each pane ~140px wide; the toolbar still offers preview.
  const isMobile = useIsMobile();
  const [scientific, setScientific] = useState(initialScientific);
  const [title, setTitle] = useState("");
  const [doi, setDoi] = useState("");
  const [content, setContent] = useState("");
  const [complexity, setComplexity] = useState<ArticleComplexity>("SIMPLE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);

  // Warn before leaving with unsaved text (closing the tab, reloading, external links).
  const isDirty = Boolean(title.trim() || content.trim() || doi.trim());
  useEffect(() => {
    if (!isDirty || isSubmitting) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    globalThis.addEventListener("beforeunload", onBeforeUnload);
    return () => globalThis.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  const handleSubmit = createHandleArticleSubmit({
    scientific,
    title,
    content,
    doi,
    complexity,
    isSubmitting,
    setIsSubmitting,
    setError,
  });

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      {/* Main column: title + content */}
      <div className={cn(card, "flex flex-col gap-6 p-4 sm:p-6")}>
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="title" className={fieldLabel}>
              {t("create.titleLabel")}
            </label>
            <span className={cn("text-xs tabular-nums text-muted-foreground", title.length > TITLE_MAX_LENGTH * 0.9 && "text-amber-600")}>
              {t("create.titleCounter", { count: title.length, max: TITLE_MAX_LENGTH })}
            </span>
          </div>
          <Input
            id="title"
            value={title}
            maxLength={TITLE_MAX_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("create.titlePlaceholder")}
            className="h-12 rounded-xl border-border bg-background text-base font-medium sm:text-lg"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="content" className={fieldLabel}>
            {scientific ? t("create.scientificContentLabel") : t("create.contentLabel")}
          </label>
          <div className="overflow-hidden rounded-xl border border-border" data-color-mode={editorColorMode}>
            <MDEditor
              value={content}
              onChange={(value) => setContent(value ?? "")}
              preview={isMobile ? "edit" : "live"}
              height={isMobile ? 280 : 480}
              visibleDragbar={false}
              textareaProps={{
                id: "content",
                placeholder: t("create.contentPlaceholder"),
              }}
              className="bg-background text-sm"
            />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" /> {t("create.markdownHint")}
          </p>
        </div>
      </div>

      {/* Side column: settings + publish (sticks while scrolling on desktop) */}
      <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
        <div className={cn(card, "flex flex-col gap-5 p-4 sm:p-5")}>
          <fieldset className="grid gap-2">
            <legend className={cn(fieldLabel, "mb-2")}>{t("create.typeLabel")}</legend>
            <ChoiceCard
              name="article-type"
              checked={!scientific}
              onChange={() => setScientific(false)}
              icon={<FileText className="size-4" />}
              title={t("create.typeRegular")}
              description={t("create.typeRegularHint")}
            />
            <ChoiceCard
              name="article-type"
              checked={scientific}
              onChange={() => setScientific(true)}
              icon={<FlaskConical className="size-4" />}
              title={t("create.scientific")}
              description={t("create.typeScientificHint")}
            />
          </fieldset>

          {scientific ? (
            <div className="grid gap-2">
              <label htmlFor="doi" className={fieldLabel}>
                {t("create.doiLabel")}
              </label>
              <Input
                id="doi"
                value={doi}
                onChange={(event) => setDoi(event.target.value)}
                placeholder={t("create.doiPlaceholder")}
                className="h-11 rounded-xl border-border bg-background font-mono text-sm"
                aria-describedby="doi-hint"
              />
              <p id="doi-hint" className="text-xs text-muted-foreground">
                {t("create.doiHint")}
              </p>
            </div>
          ) : null}

          <fieldset className="grid gap-2">
            <legend className={cn(fieldLabel, "mb-2")}>{t("create.complexityLabel")}</legend>
            {COMPLEXITY_OPTIONS.map((option) => (
              <ChoiceCard
                key={option}
                name="complexity"
                value={option}
                checked={complexity === option}
                onChange={() => setComplexity(option)}
                title={t(`complexity.${option}`)}
                description={t(`create.complexityHints.${option}`)}
                compact
              />
            ))}
          </fieldset>
        </div>

        <div className={cn(card, "flex flex-col gap-3 p-4 sm:p-5")}>
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {t(`errors.${error}`)}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Spinner className="size-4" /> : <Send />}
            {isSubmitting ? t("create.submitting") : t("create.submit")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t("create.redirectHint")}</p>
        </div>

        <div className="hidden rounded-2xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground lg:block">
          <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
            <BookOpenText className="size-4 text-teal-600 dark:text-teal-400" /> {t("create.tipsTitle")}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs leading-5">
            <li>{t("create.tips.headings")}</li>
            <li>{t("create.tips.lists")}</li>
            <li>{t("create.tips.code")}</li>
            <li>{t("create.tips.links")}</li>
          </ul>
        </div>
      </aside>
    </form>
  );
}

function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  icon,
  title,
  description,
  compact = false,
}: Readonly<{
  name: string;
  value?: string;
  checked: boolean;
  onChange: () => void;
  icon?: ReactNode;
  title: string;
  description: string;
  compact?: boolean;
}>) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border bg-background/70 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-teal-500/50",
        compact ? "px-3 py-2.5" : "p-3",
        checked ? "border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 dark:bg-teal-950/30" : "border-border hover:border-teal-600/40",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          checked ? "border-teal-600 bg-teal-600" : "border-muted-foreground/40",
        )}
      >
        {checked ? <span className="size-1.5 rounded-full bg-white" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon ? <span className={cn("text-muted-foreground", checked && "text-teal-700 dark:text-teal-300")}>{icon}</span> : null}
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
