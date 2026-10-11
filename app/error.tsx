"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  const t = useTranslations();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-page flex flex-1 items-center py-16">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="title-page">{t("error.title")}</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{t("error.description")}</p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">{t("error.code", { digest: error.digest })}</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" size="lg" onClick={reset}>
            {t("error.retry")}
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/articles">{t("common.goToArticles")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
