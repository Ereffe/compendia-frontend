"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  const t = useTranslations();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-page relative flex flex-1 items-center py-12">
      <div className="w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold sm:text-5xl">{t("error.title")}</h1>
          <p className="mx-auto max-w-md text-base leading-7 text-muted-foreground">{t("error.description")}</p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">{t("error.code", { digest: error.digest })}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            {t("error.retry")}
          </button>
          <Link
            href="/articles"
            className="inline-flex justify-center rounded-lg border border-border/70 bg-card/80 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-accent"
          >
            {t("common.goToArticles")}
          </Link>
        </div>
      </div>
    </section>
  );
}
