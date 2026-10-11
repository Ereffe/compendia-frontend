import { notFound, redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import ArticleCard from "@/components/articleCard";
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
import { ARTICLES_QUERY, mapArticleToSearchItem } from "@/services/graphql/articles";

const ARTICLES_PER_PAGE = 12;

async function fetchArticles(page: number, accessToken: string) {
  const data = await authedQuery(accessToken, ARTICLES_QUERY, {
    page,
    size: ARTICLES_PER_PAGE,
    sortBy: "datePosted",
    ascending: false,
    withCommentCount: true,
  });
  return data.articles;
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
      <div className="container-page flex flex-col gap-8 pb-6 pt-10 sm:pt-14">
        <div className="border-b border-border pb-6">
          <h1 className="title-page">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            {t("description")}
            {data.totalPages > 0 ? (
              <span className="tabular-nums"> {t("pageOf", { page: page + 1, total: data.totalPages })}.</span>
            ) : null}
          </p>
        </div>

        {data.content.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.content.map((article) => (
                <ArticleCard key={article.id} article={mapArticleToSearchItem(article)} />
              ))}
            </div>

            {data.totalPages > 1 ? <PaginationControls currentPage={page} totalPages={data.totalPages} /> : null}
          </>
        )}
      </div>
    </>
  );
}
