import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import ArticleCreateForm from "@/components/articles/articleCreateForm/articleCreateForm";
import { getCurrentUserId, requireAccessToken } from "@/lib/server/session";

export default async function CreateArticlePage() {
  await requireAccessToken();
  const t = await getTranslations();
  const userId = await getCurrentUserId();

  return (
    <section className="container-reading flex flex-col gap-8 pb-6 pt-10 sm:pt-14">
      <div>
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("common.backToArticles")}
        </Link>
        <h1 className="mt-4 title-page">{t("create.title")}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{t("create.description")}</p>
      </div>

      <ArticleCreateForm draftOwnerId={userId} />
    </section>
  );
}
