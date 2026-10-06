"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { setLocaleAction } from "@/app/actions/locale";
import { locales } from "@/i18n/config";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ className }: Readonly<{ className?: string }>) {
  const t = useTranslations("language");
  const activeLocale = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn(
        "inline-flex rounded-full border border-border/80 bg-background/95 p-0.5 text-xs font-semibold shadow-sm",
        isPending && "opacity-60",
        className,
      )}
    >
      {locales.map((locale) => {
        const isActive = locale === activeLocale;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={isActive}
            aria-label={t("switchTo", { language: t(locale) })}
            title={t(locale)}
            disabled={isPending}
            onClick={() => {
              if (isActive) return;
              startTransition(() => setLocaleAction(locale));
            }}
            className={cn(
              "rounded-full px-2.5 py-1 uppercase tracking-wider transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
