"use client";

import { FileText, Upload, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";

import { getPdfImportStatusAction, type PdfImportProgress } from "@/app/actions/pdfImport";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PDF_ACCEPT, PDF_MAX_BYTES, validatePdfFile } from "@/lib/pdfFile";
import { cn } from "@/lib/utils";
import type { ErrorKey } from "@/types/errors";

export const PDF_INPUT_ID = "pdf-file";

// The backend's REST rate limit is 100 GETs per minute shared by all users.
export const PDF_IMPORT_POLL_MS = 4000;

const MAX_STATUS_FAILURES = 3;

const rejectionError = (rejection: FileRejection): ErrorKey => {
  const code = rejection.errors[0]?.code;
  if (code === "file-too-large") return "pdfTooLarge";
  if (code === "too-many-files") return "pdfSingleFile";
  return "pdfInvalidType";
};

const pickError = (accepted: File | undefined, rejection: FileRejection | undefined): ErrorKey | null => {
  if (rejection) return rejectionError(rejection);
  return accepted ? validatePdfFile(accepted) : null;
};

type PdfDropzoneProps = Readonly<{
  file: File | null;
  onFileChange: (file: File | null) => void;
  jobId: string | null;
  onJobError: (error: ErrorKey) => void;
  disabled?: boolean;
}>;

export default function PdfDropzone({ file, onFileChange, jobId, onJobError, disabled = false }: PdfDropzoneProps) {
  const t = useTranslations();
  const format = useFormatter();
  const [error, setError] = useState<ErrorKey | null>(null);
  const [jobProgress, setJobProgress] = useState<{ jobId: string; status: PdfImportProgress } | null>(null);
  const progress = jobId && jobProgress?.jobId === jobId ? jobProgress.status : "PENDING";

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: PDF_ACCEPT,
    maxSize: PDF_MAX_BYTES,
    multiple: false,
    disabled,
    onDrop: (accepted, rejections) => {
      const picked = accepted[0];
      const nextError = pickError(picked, rejections[0]);
      setError(nextError);
      if (!nextError && picked) onFileChange(picked);
    },
  });

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const result = await getPdfImportStatusAction(jobId).catch(() => null);
      if (!active || result === undefined) return;
      if (result?.ok) {
        failures = 0;
        setJobProgress({ jobId, status: result.data.status });
      } else if (!result || result.error === "pdfImportStatusFailed") {
        failures += 1;
        if (failures >= MAX_STATUS_FAILURES) {
          onJobError("pdfImportStatusFailed");
          return;
        }
      } else {
        onJobError(result.error);
        return;
      }
      timer = setTimeout(poll, PDF_IMPORT_POLL_MS);
    };

    timer = setTimeout(poll, PDF_IMPORT_POLL_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [jobId, onJobError]);

  let hint = t("create.pdf.hint");
  if (jobId) hint = t(`create.pdf.progress.${progress}`);
  else if (file) hint = t("create.pdf.selectedHint");

  const clear = () => {
    onFileChange(null);
    setError(null);
  };

  return (
    <div className="grid gap-2">
      {file ? (
        <div className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5">
          {jobId ? (
            <Spinner className="size-5 shrink-0 text-muted-foreground" />
          ) : (
            <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {format.number(file.size / 1024 / 1024, { maximumFractionDigits: 1 })} MB
            </p>
          </div>
          {jobId ? null : (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={clear}
              disabled={disabled}
              aria-label={t("create.pdf.remove", { name: file.name })}
              title={t("create.pdf.remove", { name: file.name })}
            >
              <X />
            </Button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps({
            className: cn(
              "flex cursor-pointer flex-col items-center gap-1.5 rounded-md border border-dashed border-border px-4 py-6 text-center transition-colors outline-none",
              "hover:border-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
              isDragActive && "border-foreground bg-muted",
              disabled && "cursor-not-allowed opacity-55",
            ),
          })}
        >
          <input {...getInputProps({ id: PDF_INPUT_ID, "aria-describedby": "pdf-hint" })} />
          <Upload className="size-5 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium text-foreground">
            {isDragActive ? t("create.pdf.dropActive") : t("create.pdf.drop")}
          </span>
          <span className="text-xs text-muted-foreground">{t("create.pdf.browse")}</span>
        </div>
      )}
      {error ? (
        <p className="text-xs leading-5 text-destructive" role="alert">
          {t(`errors.${error}`)}
        </p>
      ) : null}
      <p id="pdf-hint" className="text-xs leading-5 text-muted-foreground" aria-live="polite">
        {hint}
      </p>
    </div>
  );
}
