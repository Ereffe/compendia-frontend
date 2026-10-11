import { getTranslations } from "next-intl/server";

import ArticleFilters from "@/components/articleFilters";
import ArticleSearchModal from "@/components/articleSearchModal/articleSearchModal";
import { ARTICLE_SORT_FIELDS, type ArticleFilters as Filters, isRated, parseArticleFilters } from "@/lib/articleFilters";
import { authedQuery, requireAccessToken } from "@/lib/server/session";
import ArticleCard from "@/components/articleCard";
import EmptyState from "@/components/emptyState";
import { ARTICLES_QUERY, mapArticleToSearchItem } from "@/services/graphql/articles";
import type { ArticleSearchItem } from "@/types/articles";

const SECTION_SIZE = 6;

async function getArticles(accessToken: string, { sort, level }: Filters): Promise<ArticleSearchItem[]> {
  const data = await authedQuery(accessToken, ARTICLES_QUERY, {
    complexity: level,
    page: 0,
    size: SECTION_SIZE,
    sortBy: ARTICLE_SORT_FIELDS[sort],
    ascending: false,
    withCommentCount: true,
  });
  const articles = data.articles.content.map(mapArticleToSearchItem);
  return sort === "mostRated" ? articles.filter((article) => isRated(article.rating)) : articles;
}

export default async function ArticlesPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ sort?: string | string[]; level?: string | string[] }> }>) {
  const accessToken = await requireAccessToken();
  const filters = parseArticleFilters(await searchParams);
  const articles = await getArticles(accessToken, filters);
  const t = await getTranslations("articles");

  const tCommon = await getTranslations("common");
  let emptyMessage = t("empty");
  if (filters.sort !== "newest") emptyMessage = t("emptyRated");
  else if (filters.level) emptyMessage = t("emptyFiltered");
  const emptyAction =
    filters.sort === "newest" && !filters.level
      ? { href: "/articles/create", label: t("createFirst") }
      : { href: "/articles", label: tCommon("showAllArticles") };

  return (
    <section id="articles" className="container-page pb-6 pt-10 sm:pt-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="min-w-0">
          <h1 className="title-page">{t(`titles.${filters.sort}`)}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{t(`descriptions.${filters.sort}`)}</p>
        </div>
        <div className="w-full shrink-0 lg:w-96">
          <ArticleSearchModal articles={articles} />
        </div>
      </div>

      <div className="mb-8 mt-8 border-y border-border py-4">
        <ArticleFilters filters={filters} />
      </div>

      {articles.length === 0 ? (
        <EmptyState message={emptyMessage} action={emptyAction} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}
