import Link from "next/link";
import { getTranslations } from "next-intl/server";

import ArticleCreateForm from "@/components/articles/articleCreateForm/articleCreateForm";
import { requireAccessToken } from "@/lib/server/session";

export default async function CreateArticlePage() {
  await requireAccessToken();
  const t = await getTranslations();

  return (
    <section className="container-page my-3 flex flex-col gap-8 py-8 sm:py-12">
      <div className="space-y-3">
        <Link
          href="/articles"
          className="inline-flex rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:bg-accent"
        >
          {t("common.backToArticles")}
        </Link>
        <div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{t("create.title")}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{t("create.description")}</p>
        </div>
      </div>

      <ArticleCreateForm />
    </section>
  );
}
