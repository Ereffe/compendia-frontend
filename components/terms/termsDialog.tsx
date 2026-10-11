"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TermsContent from "./termsContent";

type TermsDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}>;

export default function TermsDialog({ open, onOpenChange, onAccept }: TermsDialogProps) {
  const t = useTranslations("terms");
  const tCommon = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-2xl" closeLabel={tCommon("close")}>
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6 pr-12">
          <DialogTitle className="title-section">{t("title")}</DialogTitle>
          <DialogDescription>{t("effective")}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 py-6">
          <TermsContent />
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onAccept();
              onOpenChange(false);
            }}
          >
            {t("accept")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
