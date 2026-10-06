import { getTranslations } from "next-intl/server";

import ArticleFilters from "@/components/articleFilters";
import ArticleSearchModal from "@/components/articleSearchModal/articleSearchModal";
import { type ArticleFilters as Filters, parseArticleFilters, rankArticles } from "@/lib/articleFilters";
import { authedQuery, requireAccessToken } from "@/lib/server/session";
import {
  ARTICLES_QUERY,
  type GraphqlArticleSummary,
  mapArticleToSearchItem,
  type PagedArticles,
} from "@/services/graphql/articles";
import type { ArticleSearchItem } from "@/types/articles";
import ArticleCard from "./ArticleCard";

const SECTION_SIZE = 6;
// The backend can't sort by rating, so rated views rank this many articles on the server.
const RANKING_POOL_SIZE = 1000;

async function getArticles(accessToken: string, { sort, level }: Filters): Promise<ArticleSearchItem[]> {
  const ranked = sort !== "newest";
  const data = await authedQuery<{ articles: PagedArticles<GraphqlArticleSummary> }>(accessToken, ARTICLES_QUERY, {
    complexity: level,
    page: 0,
    size: ranked ? RANKING_POOL_SIZE : SECTION_SIZE,
    sortBy: "datePosted",
    ascending: false,
  });
  const articles = data.articles.content.map(mapArticleToSearchItem);
  return ranked ? rankArticles(articles, sort).slice(0, SECTION_SIZE) : articles;
}

export default async function ArticlesPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ sort?: string | string[]; level?: string | string[] }> }>) {
  const accessToken = await requireAccessToken();
  const filters = parseArticleFilters(await searchParams);
  const articles = await getArticles(accessToken, filters);
  const t = await getTranslations("articles");

  let emptyMessage = t("empty");
  if (filters.sort !== "newest") emptyMessage = t("emptyRated");
  else if (filters.level) emptyMessage = t("emptyFiltered");

  return (
    <>
      <section className="container-page relative pt-8 sm:pt-12">
        <div className="w-full">
          <ArticleSearchModal articles={articles} />
        </div>
      </section>

      <section id="articles" className="container-page relative pb-14 pt-8 sm:pb-16 sm:pt-12">
        <div className="mb-8">
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">{t(`titles.${filters.sort}`)}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t(`descriptions.${filters.sort}`)}
          </p>
          <div className="mt-6">
            <ArticleFilters filters={filters} />
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-16 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
