"use client";

import { useTranslations } from "next-intl";

import LoginCard from "@/components/loginCard/loginCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function LoginModal() {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("modes.login")}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-1.5rem)] border-none bg-transparent p-0 shadow-none sm:max-w-sm" showCloseButton closeLabel={tCommon("close")}>
        <DialogHeader className="sr-only">
          <DialogTitle>{t("modalTitle")}</DialogTitle>
          <DialogDescription>{t("modalDescription")}</DialogDescription>
        </DialogHeader>
        <LoginCard />
      </DialogContent>
    </Dialog>
  );
}