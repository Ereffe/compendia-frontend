import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import ArticleRatingBadge from "@/components/articleRatingBadge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { parsePageParam } from "@/lib/pagination";
import { authedQuery, requireAccessToken } from "@/lib/server/session";
import {
  ARTICLES_QUERY,
  articleDateFormat,
  type GraphqlArticleSummary,
  type PagedArticles,
} from "@/services/graphql/articles";

const ARTICLES_PER_PAGE = 12;

async function fetchArticles(page: number, accessToken: string) {
  const data = await authedQuery<{ articles: PagedArticles<GraphqlArticleSummary> }>(accessToken, ARTICLES_QUERY, {
    page,
    size: ARTICLES_PER_PAGE,
    sortBy: "datePosted",
    ascending: false,
  });
  return data.articles;
}

function ArchiveArticleCard({ article }: Readonly<{ article: GraphqlArticleSummary }>) {
  const t = useTranslations("common");
  const format = useFormatter();

  return (
    <Link href={`/articles/${article.id}`} className="block">
      <article className="h-full rounded-2xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur transition-all hover:border-teal-700/30 hover:shadow-[0_18px_60px_-36px_rgba(15,23,42,0.8)]">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest">
          <span className="text-muted-foreground">{format.dateTime(new Date(article.datePosted), articleDateFormat)}</span>
          <ArticleRatingBadge rating={article.rating ?? null} />
        </div>
        <h2 className="mt-4 line-clamp-2 text-lg font-semibold text-foreground">{article.title}</h2>
        {article.author?.name ? <p className="mt-3 text-sm text-muted-foreground">{t("authorBy", { name: article.author.name })}</p> : null}
      </article>
    </Link>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
}: Readonly<{
  currentPage: number;
  totalPages: number;
}>) {
  const t = useTranslations("archive");

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    const halfWindow = Math.floor(maxVisible / 2);

    let startPage = Math.max(0, currentPage - halfWindow);
    const endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(0, endPage - maxVisible + 1);
    }

    if (startPage > 0) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink href="/all-articles/1">1</PaginationLink>
        </PaginationItem>,
      );
      if (startPage > 1) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis label={t("morePages")} />
          </PaginationItem>,
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href={`/all-articles/${i + 1}`}
            isActive={i === currentPage}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis label={t("morePages")} />
          </PaginationItem>,
        );
      }
      items.push(
        <PaginationItem key="last">
          <PaginationLink href={`/all-articles/${totalPages}`}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <Pagination className="mt-8" aria-label={t("pagination")}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            label={t("previous")}
            href={currentPage > 0 ? `/all-articles/${currentPage}` : undefined}
            className={
              currentPage === 0
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>

        {getPaginationItems()}

        <PaginationItem>
          <PaginationNext
            label={t("next")}
            href={
              currentPage < totalPages - 1
                ? `/all-articles/${currentPage + 2}`
                : undefined
            }
            className={
              currentPage === totalPages - 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default async function AllArticlesPage({
  params,
}: Readonly<{ params: Promise<{ page: string }> }>) {
  const { page: pageParam } = await params;
  const accessToken = await requireAccessToken();

  const page = parsePageParam(pageParam);
  if (page === null) {
    notFound();
  }

  const data = await fetchArticles(page, accessToken);
  const t = await getTranslations("archive");

  if (data.totalPages > 0 && page >= data.totalPages) {
    redirect(`/all-articles/${data.totalPages}`);
  }

  return (
    <>
      <div className="container-page my-3 flex flex-col gap-8 py-8 sm:py-12">
        <div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{t("description")}</p>
          {data.totalPages > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("pageOf", { page: page + 1, total: data.totalPages })}
            </p>
          ) : null}
        </div>

        {data.content.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 py-16 text-center">
            <p className="text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.content.map((article) => (
                <ArchiveArticleCard key={article.id} article={article} />
              ))}
            </div>

            {data.totalPages > 1 ? <PaginationControls currentPage={page} totalPages={data.totalPages} /> : null}
          </>
        )}
      </div>
    </>
  );
}
