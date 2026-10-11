"use client";

import { ChevronRight, History, ImagePlus } from "lucide-react";
import dynamic from "next/dynamic";
import { useFormatter, useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "katex/dist/katex.min.css";

import { EditorSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMounted } from "@/hooks/use-mounted";
import { articleRehypePlugins, articleUrlTransform, mathRemarkPlugins } from "@/lib/articleContent";
import { IMAGE_ACCEPT } from "@/lib/imageFile";
import { cn } from "@/lib/utils";
import type { ArticleComplexity } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";
import {
  areReferencesEqual,
  COMPLEXITY_OPTIONS,
  createHandleArticleSubmit,
  createHandleFillFromMetadata,
  type DoiMetadataMessage,
  type EditableArticle,
  TITLE_MAX_LENGTH,
} from "./articleCreateFormController";
import {
  type ArticleDraft,
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
import { createHandleImageFiles, stripUploadPlaceholders } from "./editorImagesController";
import ArticleReferencesEditor from "./articleReferencesEditor";
import PdfDropzone, { PDF_INPUT_ID } from "./pdfDropzone";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <EditorSkeleton className="h-75 md:h-125" />,
});

const fieldLabel = "text-sm font-medium text-foreground";

const toColorMode = (theme: string | undefined) => (theme === "dark" ? "dark" : "light");

function useEditorColorMode() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  return mounted ? toColorMode(resolvedTheme) : undefined;
}

function useSavedDraft(draftKey: string | null) {
  const [draftDecided, setDraftDecided] = useState(false);
  const initialDraftRaw = useSyncExternalStore(subscribeToNothing, () => getInitialDraftRaw(draftKey), () => null);
  useEffect(() => () => forgetInitialDraft(draftKey), [draftKey]);
  return { savedDraft: draftDecided ? null : parseDraft(initialDraftRaw), decideDraft: () => setDraftDecided(true) };
}

type FormValues = Pick<EditableArticle, "title" | "content" | "complexity" | "references"> & { doiInput: string; pdfFile: File | null };

const hasUnsavedChanges = (values: FormValues, article: EditableArticle | undefined): boolean => {
  if (!article) {
    return Boolean(values.title.trim() || values.content.trim() || values.references.length > 0 || values.doiInput.trim() || values.pdfFile);
  }
  return (
    values.title !== article.title ||
    values.content !== article.content ||
    values.complexity !== article.complexity ||
    !areReferencesEqual(values.references, article.references) ||
    Boolean(values.doiInput.trim())
  );
};

const readContentSelection = (fallback: number) => {
  const textarea = document.getElementById("content");
  return textarea instanceof HTMLTextAreaElement
    ? { start: textarea.selectionStart, end: textarea.selectionEnd }
    : { start: fallback, end: fallback };
};

const allowFileDrop = (event: React.DragEvent) => {
  if (event.dataTransfer.types.includes("Files")) event.preventDefault();
};

const submitLabelKey =(hasPdf: boolean, isSubmitting: boolean, isEditing: boolean) => {
  if (hasPdf) return isSubmitting ? "create.pdf.submitting" : "create.pdf.submit";
  if (isSubmitting) return isEditing ? "edit.submitting" : "create.submitting";
  return isEditing ? "edit.submit" : "create.submit";
};

type ArticleCreateFormProps = Readonly<{
  initialScientific?: boolean;
  article?: EditableArticle;
  draftOwnerId?: string | null;
}>;

export default function ArticleCreateForm({ initialScientific = false, article, draftOwnerId = null }: ArticleCreateFormProps) {
  const t = useTranslations();
  const editorColorMode = useEditorColorMode();
  const isMobile = useIsMobile();
  const isEditing = article !== undefined;
  const initialReferences = article?.references ?? [];
  const hasReference = initialReferences.length > 0;
  const [scientific, setScientific] = useState(article ? hasReference : initialScientific);
  const [title, setTitle] = useState(article?.title ?? "");
  const [references, setReferences] = useState(initialReferences);
  const [doiInput, setDoiInput] = useState("");
  const [content, setContent] = useState(article?.content ?? "");
  const [complexity, setComplexity] = useState<ArticleComplexity>(article?.complexity ?? "SIMPLE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfJobId, setPdfJobId] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<ErrorKey | null>(null);
  const [fillMessage, setFillMessage] = useState<DoiMetadataMessage | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const draftKey = isEditing ? null : getDraftKey(draftOwnerId);
  const { savedDraft, decideDraft } = useSavedDraft(draftKey);

  useEffect(() => {
    if (!draftKey || savedDraft || isSubmitting || isDraftEmpty({ title, content, references })) return;
    const timer = globalThis.setTimeout(() => {
      const savedAt = new Date().toISOString();
      if (writeDraft(draftKey, { scientific, title, content, references, complexity, uploadedImages, savedAt })) setDraftSavedAt(savedAt);
    }, DRAFT_SAVE_DELAY_MS);
    return () => globalThis.clearTimeout(timer);
  }, [draftKey, savedDraft, isSubmitting, scientific, title, content, references, complexity, uploadedImages]);

  const restoreDraft = () => {
    if (!savedDraft) return;
    setScientific(savedDraft.scientific);
    setTitle(savedDraft.title);
    setContent(stripUploadPlaceholders(savedDraft.content));
    setReferences(savedDraft.references);
    setComplexity(savedDraft.complexity);
    setUploadedImages(savedDraft.uploadedImages);
    setDraftSavedAt(savedDraft.savedAt);
    decideDraft();
  };

  const discardDraft = () => {
    clearDraft(draftKey);
    decideDraft();
  };

  const isDirty = hasUnsavedChanges({ title, content, complexity, references, doiInput, pdfFile }, article);
  useEffect(() => {
    if (!isDirty || isSubmitting) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    globalThis.addEventListener("beforeunload", onBeforeUnload);
    return () => globalThis.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  const submitArticle = createHandleArticleSubmit({
    editedArticle: article,
    scientific,
    title,
    content,
    references,
    pendingDoiInput: doiInput,
    complexity,
    uploadedImages,
    pdfFile,
    isSubmitting,
    setIsSubmitting,
    setError,
    onSubmitStart: () => clearDraft(draftKey),
    onPdfImportStarted: setPdfJobId,
  });

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    if (pendingUploads > 0 && !pdfFile) {
      event.preventDefault();
      setError("imageUploadPending");
      return;
    }
    void submitArticle(event);
  };

  const handleImageFiles = createHandleImageFiles({
    defaultAlt: t("create.images.defaultAlt"),
    getSelection: () => readContentSelection(content.length),
    setContent,
    setPendingUploads,
    setImageError,
    onUploaded: (assetId) => setUploadedImages((ids) => [...ids, assetId]),
  });

  const takeImageFiles = (event: React.ClipboardEvent | React.DragEvent, files: FileList) => {
    const images = [...files].filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    event.preventDefault();
    void handleImageFiles(images);
  };

  const handlePdfJobError = (jobError: ErrorKey) => {
    setPdfJobId(null);
    setIsSubmitting(false);
    setError(jobError);
  };

  const submitLabel = t(submitLabelKey(pdfFile !== null, isSubmitting, isEditing));
  const editorLocked = pdfFile !== null;

  const handleFillFromMetadata = createHandleFillFromMetadata({
    title,
    content,
    labels: { authors: t("create.metadata.authorsHeading"), abstract: t("create.metadata.abstractHeading") },
    setTitle,
    setContent,
    setMessage: setFillMessage,
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {savedDraft ? <DraftNotice draft={savedDraft} onRestore={restoreDraft} onDiscard={discardDraft} /> : null}

      <div className="sheet flex min-w-0 flex-col overflow-hidden">
        <div className="grid gap-3 border-b border-border px-5 py-5 sm:px-10">
          <InlineChoices
            legend={t("create.typeLabel")}
            hint={scientific ? t("create.typeScientificHint") : t("create.typeRegularHint")}
          >
            <InlineChoice name="article-type" checked={!scientific} onChange={() => setScientific(false)} title={t("create.typeRegular")} />
            <InlineChoice name="article-type" checked={scientific} onChange={() => setScientific(true)} title={t("create.scientific")} />
          </InlineChoices>
          <InlineChoices legend={t("create.complexityLabel")} hint={t(`create.complexityHints.${complexity}`)}>
            {COMPLEXITY_OPTIONS.map((option) => (
              <InlineChoice
                key={option}
                name="complexity"
                value={option}
                checked={complexity === option}
                onChange={() => setComplexity(option)}
                title={t(`complexity.${option}`)}
              />
            ))}
          </InlineChoices>
        </div>

        <div className="px-5 pt-8 sm:px-10">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="title" className={fieldLabel}>
              {t("create.titleLabel")}
            </label>
            <span
              className={cn(
                "text-xs tabular-nums text-muted-foreground",
                title.length > TITLE_MAX_LENGTH * 0.9 && "font-medium text-foreground",
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
            className="mt-1 w-full border-b border-input bg-transparent pb-4 pt-1 font-serif text-[1.75rem] font-medium leading-tight tracking-[-0.01em] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground sm:text-[2.25rem]"
          />
        </div>

        <div className="flex items-end justify-between gap-3 px-5 pb-2 pt-7 sm:px-10">
          <label htmlFor="content" className={fieldLabel}>
            {scientific ? t("create.scientificContentLabel") : t("create.contentLabel")}
          </label>
          <ImageInsertButton disabled={isSubmitting || editorLocked} onFiles={(files) => void handleImageFiles(files)} />
        </div>
        <div className="relative px-5 sm:px-10">
          {pdfFile ? <PdfLockNotice fileName={pdfFile.name} onRemove={() => setPdfFile(null)} disabled={isSubmitting} /> : null}
          <div
            className={cn("overflow-hidden rounded-sm border border-border", editorLocked && "pointer-events-none opacity-40")}
            data-color-mode={editorColorMode}
            aria-disabled={editorLocked || undefined}
            inert={editorLocked || undefined}
          >
            <MDEditor
              value={content}
              onChange={(value) => setContent(value ?? "")}
              preview={isMobile || editorLocked ? "edit" : "live"}
              height={isMobile ? 300 : 520}
              hideToolbar={editorLocked}
              visibleDragbar={false}
              previewOptions={{
                urlTransform: articleUrlTransform,
                remarkPlugins: mathRemarkPlugins,
                rehypePlugins: articleRehypePlugins,
              }}
              textareaProps={{
                id: "content",
                placeholder: t("create.contentPlaceholder"),
                "aria-describedby": "content-images-hint",
                onPaste: (event) => takeImageFiles(event, event.clipboardData.files),
                onDragOver: allowFileDrop,
                onDrop: (event) => takeImageFiles(event, event.dataTransfer.files),
              }}
              className="rounded-none! bg-background text-sm shadow-none!"
            />
          </div>
        </div>

        <div className="grid gap-1 px-5 pt-2 text-xs leading-5 sm:px-10">
          {imageError ? (
            <p className="text-destructive" role="alert">
              {t(`errors.${imageError}`)}
            </p>
          ) : null}
          <ContentHint editorLocked={editorLocked} pendingUploads={pendingUploads} />
        </div>

        <details className="group px-5 pb-6 pt-3 text-sm text-muted-foreground sm:px-10">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden />
            {t("create.markdownHint")}
          </summary>
          <ul className="mt-3 grid gap-x-8 gap-y-1.5 pl-5.5 font-mono text-xs leading-5 sm:grid-cols-2">
            <li>{t("create.tips.headings")}</li>
            <li>{t("create.tips.lists")}</li>
            <li>{t("create.tips.code")}</li>
            <li>{t("create.tips.links")}</li>
            <li>{t("create.tips.math")}</li>
          </ul>
        </details>

        {scientific ? (
          <section className="border-t border-border px-5 py-7 sm:px-10" aria-labelledby="article-references-heading">
            <ArticleReferencesEditor
              references={references}
              onReferencesChange={setReferences}
              doiInput={doiInput}
              onDoiInputChange={setDoiInput}
              disabled={isSubmitting}
              onFill={handleFillFromMetadata}
              fillMessage={fillMessage}
            />
          </section>
        ) : null}

        {isEditing ? null : (
          <div className="grid gap-3 border-t border-border px-5 py-6 sm:px-10 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
            <label htmlFor={PDF_INPUT_ID} className="title-item">
              {t("create.pdf.label")}
            </label>
            <PdfDropzone file={pdfFile} onFileChange={setPdfFile} jobId={pdfJobId} onJobError={handlePdfJobError} disabled={isSubmitting} />
          </div>
        )}

        <FormFooter
          error={error}
          autosave={draftKey !== null}
          draftSavedAt={draftSavedAt}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          submitDisabled={isSubmitting || (pendingUploads > 0 && !pdfFile)}
          submitLabel={submitLabel}
        />
      </div>
    </form>
  );
}

function FormFooter({
  error,
  autosave,
  draftSavedAt,
  isEditing,
  isSubmitting,
  submitDisabled,
  submitLabel,
}: Readonly<{
  error: ErrorKey | null;
  autosave: boolean;
  draftSavedAt: string | null;
  isEditing: boolean;
  isSubmitting: boolean;
  submitDisabled: boolean;
  submitLabel: string;
}>) {
  const t = useTranslations();
  const format = useFormatter();
  const autosaveText = draftSavedAt
    ? t("create.draft.savedAt", { time: format.dateTime(new Date(draftSavedAt), { timeStyle: "short" }) })
    : t("create.draft.autosaveHint");
  return (
    <div className="flex flex-col gap-4 border-t border-border bg-muted px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
      <div className="grid min-w-0 gap-1 text-xs leading-5 text-muted-foreground">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {t(`errors.${error}`)}
          </p>
        ) : null}
        {autosave ? <p aria-live="polite">{autosaveText}</p> : null}
        <p>{t(isEditing ? "edit.redirectHint" : "create.redirectHint")}</p>
      </div>
      <Button type="submit" size="lg" disabled={submitDisabled} className="w-full shrink-0 sm:w-auto">
        {isSubmitting ? <Spinner className="size-4" /> : null}
        {submitLabel}
      </Button>
    </div>
  );
}

function DraftNotice({ draft, onRestore, onDiscard }: Readonly<{ draft: ArticleDraft; onRestore: () => void; onDiscard: () => void }>) {
  const t = useTranslations("create.draft");
  const format = useFormatter();
  return (
    <section
      aria-label={t("foundTitle")}
      className="flex flex-col gap-3 rounded-sm border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <History className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 text-sm">
          <p className="font-medium text-foreground">
            {t("foundTitle")}
            {" · "}
            <span className="font-normal text-muted-foreground">
              {format.dateTime(new Date(draft.savedAt), { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </p>
          {draft.title.trim() ? <p className="mt-0.5 truncate text-muted-foreground">{draft.title}</p> : null}
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{t("foundHint")}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" onClick={onRestore}>
          {t("restore")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDiscard}>
          {t("discard")}
        </Button>
      </div>
    </section>
  );
}

function PdfLockNotice({ fileName, onRemove, disabled }: Readonly<{ fileName: string; onRemove: () => void; disabled: boolean }>) {
  const t = useTranslations("create.pdf");
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center px-10 sm:px-16">
      <div className="max-w-sm rounded-sm border border-border bg-card px-6 py-5 text-center">
        <output className="block">
          <span className="title-item block text-foreground">{t("editorLockedTitle")}</span>
          <span className="mt-1.5 block text-sm leading-6 text-muted-foreground">{t("editorLocked")}</span>
        </output>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRemove} disabled={disabled}>
          {t("remove", { name: fileName })}
        </Button>
      </div>
    </div>
  );
}

function ImageInsertButton({ disabled, onFiles }: Readonly<{ disabled: boolean; onFiles: (files: File[]) => void }>) {
  const t = useTranslations("create.images");
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length > 0) onFiles(files);
  };
  return (
    <Button asChild variant="ghost" size="sm" className="-mb-1 -mr-2 text-muted-foreground">
      <label className={cn("cursor-pointer", disabled && "pointer-events-none opacity-50")}>
        <ImagePlus aria-hidden />
        {t("insert")}
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled}
          aria-describedby="content-images-hint"
          onChange={handleChange}
        />
      </label>
    </Button>
  );
}

function ContentHint({ editorLocked, pendingUploads }: Readonly<{ editorLocked: boolean; pendingUploads: number }>) {
  const t = useTranslations("create");
  let hint = t("images.hint");
  if (editorLocked) hint = t("pdf.editorLocked");
  else if (pendingUploads > 0) hint = t("images.uploading", { count: pendingUploads });
  return (
    <p id="content-images-hint" className="text-muted-foreground" aria-live="polite">
      {hint}
    </p>
  );
}

function InlineChoices({ legend, hint, children }: Readonly<{ legend: string; hint: string; children: React.ReactNode }>) {
  return (
    <fieldset className="grid gap-x-6 gap-y-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-baseline">
      <legend className="float-left text-sm text-muted-foreground sm:w-32">{legend}</legend>
      <div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">{children}</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>
    </fieldset>
  );
}

function InlineChoice({
  name,
  value,
  checked,
  onChange,
  title,
}: Readonly<{
  name: string;
  value?: string;
  checked: boolean;
  onChange: () => void;
  title: string;
}>) {
  return (
    <label
      className={cn(
        "cursor-pointer rounded-sm text-sm decoration-1 underline-offset-[6px] transition-colors",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
        checked ? "font-medium text-foreground underline" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {title}
    </label>
  );
}
