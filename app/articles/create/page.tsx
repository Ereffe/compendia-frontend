import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import ArticleCreateForm from "@/components/articles/articleCreateForm/articleCreateForm";
import { requireAccessToken } from "@/lib/server/session";

export default async function CreateArticlePage() {
  await requireAccessToken();
  const t = await getTranslations();

  return (
    <section className="container-page flex flex-col gap-8 py-8 sm:py-12">
      <div>
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("common.backToArticles")}
        </Link>
        <h1 className="mt-4 font-serif text-4xl font-medium leading-tight tracking-[-0.02em] sm:text-5xl">{t("create.title")}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{t("create.description")}</p>
      </div>

      <ArticleCreateForm />
    </section>
  );
}
