import { getTranslations } from "next-intl/server";

import ArticleSearchModal from "@/components/articleSearchModal/articleSearchModal";
import { authedQuery, requireAccessToken } from "@/lib/server/session";
import {
  ARTICLES_QUERY,
  type GraphqlArticleSummary,
  mapArticleToSearchItem,
  type PagedArticles,
} from "@/services/graphql/articles";
import type { ArticleSearchItem } from "@/types/articles";
import ArticleCard from "./ArticleCard";

const NEWEST_ARTICLES_COUNT = 4;

async function getNewestArticles(accessToken: string): Promise<ArticleSearchItem[]> {
  const data = await authedQuery<{ articles: PagedArticles<GraphqlArticleSummary> }>(accessToken, ARTICLES_QUERY, {
    page: 0,
    size: NEWEST_ARTICLES_COUNT,
    sortBy: "datePosted",
    ascending: false,
  });

  return data.articles.content.map(mapArticleToSearchItem);
}

export default async function ArticlesPage() {
  const accessToken = await requireAccessToken();
  // Errors propagate to app/error.tsx instead of rendering an empty list.
  const newestArticles = await getNewestArticles(accessToken);
  const t = await getTranslations("articles");

  return (
    <>
      <section className="container-page relative pt-8 sm:pt-12">
        <div className="w-full">
          <ArticleSearchModal articles={newestArticles} />
        </div>
      </section>

      <section id="articles" className="container-page relative pb-14 pt-8 sm:pb-16 sm:pt-12">
        <div className="mb-8">
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{t("description")}</p>
        </div>

        {newestArticles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 py-16 text-center text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {newestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
