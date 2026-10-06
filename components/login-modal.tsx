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
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
        >
          {t("modes.login")}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-1.5rem)] border-none bg-transparent p-0 shadow-none sm:max-w-md" showCloseButton closeLabel={tCommon("close")}>
        <DialogHeader className="sr-only">
          <DialogTitle>{t("modalTitle")}</DialogTitle>
          <DialogDescription>{t("modalDescription")}</DialogDescription>
        </DialogHeader>
        <LoginCard />
      </DialogContent>
    </Dialog>
  );
}