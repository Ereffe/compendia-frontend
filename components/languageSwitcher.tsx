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
        "inline-flex items-center text-sm",
        isPending && "opacity-60",
        className,
      )}
    >
      {locales.map((locale, index) => {
        const isActive = locale === activeLocale;
        return [
          index > 0 ? (
            <span key={`${locale}-sep`} aria-hidden className="px-0.5 text-border">
              /
            </span>
          ) : null,
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
              "rounded-sm px-1 py-0.5 uppercase transition-colors",
              isActive ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {locale}
          </button>,
        ];
      })}
    </div>
  );
}
