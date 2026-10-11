import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import LanguageSwitcher from "@/components/languageSwitcher";
import LoginCard from "@/components/loginCard/loginCard";
import ThemeToggle from "@/components/themeToggle";
import { ARTICLE_SORT_FIELDS } from "@/lib/articleFilters";
import { toExcerpt } from "@/lib/excerpt";
import { getServerClient } from "@/lib/server/apollo";
import { getAccessToken } from "@/lib/server/session";
import { ARTICLES_QUERY, articleDateFormat, mapArticleToSearchItem } from "@/services/graphql/articles";
import type { ArticleSearchItem } from "@/types/articles";

async function getRecentArticles(): Promise<ArticleSearchItem[]> {
  try {
    const { data } = await getServerClient().query({
      query: ARTICLES_QUERY,
      variables: { page: 0, size: 5, sortBy: ARTICLE_SORT_FIELDS.newest, ascending: false, withCommentCount: false },
      fetchPolicy: "no-cache",
    });
    return data?.articles.content.map(mapArticleToSearchItem) ?? [];
  } catch (error) {
    console.error("landing: recent articles failed:", error);
    return [];
  }
}

export default async function Home({
  searchParams,
}: Readonly<{ searchParams: Promise<{ sessionExpired?: string }> }>) {
  if (await getAccessToken()) {
    redirect("/articles");
  }

  const t = await getTranslations("landing");
  const tCommon = await getTranslations("common");
  const tComplexity = await getTranslations("complexity");
  const format = await getFormatter();
  const sessionExpired = (await searchParams).sessionExpired === "1";
  const articles = await getRecentArticles();

  return (
    <>
      <div className="border-b border-border">
        <div className="container-page flex h-14 items-center justify-between gap-4 sm:h-16">
          <p className="font-serif text-xl font-medium tracking-[-0.01em]">Compendia</p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <section className="container-page flex flex-1 flex-col py-10 sm:py-16">
        {sessionExpired ? (
          <p
            role="alert"
            className="mb-10 w-full max-w-xl rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground"
          >
            {t("sessionExpired")}
          </p>
        ) : null}

        <div className="grid flex-1 gap-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-20">
          <div className="max-w-2xl">
            <h1 className="title-display">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">{t("subtitle")}</p>

            {articles.length > 0 ? (
              <section aria-labelledby="recent-articles" className="mt-12">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-foreground pb-2">
                  <h2 id="recent-articles" className="text-xs font-semibold uppercase tracking-[0.12em]">
                    {t("recent")}
                  </h2>
                  <p className="text-xs text-muted-foreground">{t("recentHint")}</p>
                </div>
                <ol>
                  {articles.map((article) => {
                    const excerpt = toExcerpt(article.content);
                    return (
                      <li key={article.id} className="border-b border-border py-5">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <time dateTime={article.datePosted}>
                            {format.dateTime(new Date(article.datePosted), articleDateFormat)}
                          </time>
                          <span aria-hidden>·</span>
                          <span>{tComplexity(article.complexity)}</span>
                        </p>
                        <h3 className="mt-2 font-serif text-xl font-medium leading-snug wrap-break-word">{article.title}</h3>
                        {excerpt ? (
                          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground wrap-anywhere">{excerpt}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {tCommon("authorBy", { name: article.author ?? tCommon("unknownAuthor") })}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null}
          </div>

          <div className="flex justify-center lg:sticky lg:top-8 lg:justify-end">
            <LoginCard />
          </div>
        </div>
      </section>
    </>
  );
}
