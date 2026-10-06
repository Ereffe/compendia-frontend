"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { deleteArticleAction } from "@/app/actions/articles";
import ConfirmDeleteDialog from "@/components/confirmDeleteDialog";
import { Button } from "@/components/ui/button";
import type { ErrorKey } from "@/types/errors";

const actionClass = "px-1.5 text-muted-foreground hover:text-foreground";

/** Edit and delete controls under the byline. The page renders them only for the article's author. */
export default function ArticleOwnerActions({ articleId }: Readonly<{ articleId: string }>) {
  const t = useTranslations("article");
  const tErrors = useTranslations("errors");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setError(null);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      // On success the action redirects to /articles on the server and this call doesn't return.
      const result = await deleteArticleAction(articleId);
      if (result && !result.ok) {
        setError(result.error);
        setIsDeleting(false);
      }
    } catch {
      setError("deleteArticleFailed");
      setIsDeleting(false);
    }
  };

  return (
    <div className="-ml-1.5 mt-3 flex flex-wrap items-center gap-1">
      <Button asChild variant="ghost" size="xs" className={actionClass}>
        <Link href={`/articles/${articleId}/edit`}>
          <Pencil aria-hidden />
          {t("edit")}
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="xs"
        className="px-1.5 text-muted-foreground hover:text-destructive"
        onClick={() => setIsDialogOpen(true)}
      >
        <Trash2 aria-hidden />
        {t("delete")}
      </Button>

      <ConfirmDeleteDialog
        open={isDialogOpen}
        onOpenChange={handleOpenChange}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={t("deleteConfirm")}
        pendingLabel={t("deleting")}
        cancelLabel={t("cancel")}
        isPending={isDeleting}
        error={error ? tErrors(error) : null}
        onConfirm={handleDelete}
      />
    </div>
  );
}
