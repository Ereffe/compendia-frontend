import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { authOptions } from "@/lib/auth";
import { query } from "../../ApolloClient";
import { gql } from "@apollo/client";

type GraphQLArticle = {
  id: string;
  title: string;
  datePosted: string;
};

type PaginatedResponse = {
  content: GraphQLArticle[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
};

const ARTICLES_PER_PAGE = 12;
const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const ALL_ARTICLES_QUERY = gql`
  query GetAllArticles($page: Int!, $size: Int!, $sortBy: String, $ascending: Boolean) {
    articles(page: $page, size: $size, sortBy: $sortBy, ascending: $ascending) {
      content {
        id
        title
        datePosted
      }
      totalPages
      totalElements
      page
      size
    }
  }
`;

const articleDateFormatter = new Intl.DateTimeFormat("pl-PL", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

async function fetchArticles(page: number, accessToken: string): Promise<PaginatedResponse | null> {
  try {
    const result = await query<{ articles: PaginatedResponse }>({
      query: ALL_ARTICLES_QUERY,
      variables: {
        page,
        size: ARTICLES_PER_PAGE,
        sortBy: "datePosted",
        ascending: false,
      },
      context: {
        headers: { Authorization: `Bearer ${accessToken}` },
        fetchOptions: { next: { revalidate: 0 } },
      },
    });

    return result.data?.articles ?? null;
  } catch (error) {
    console.error("Error fetching articles (apollo):", error);
    return null;
  }
}

function ArticleCard({
  article,
  index,
}: Readonly<{ article: GraphQLArticle; index: number }>) {
  return (
    <Link href={`/articles/${article.id}`} className="contents">
      <article
        className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur transition-all hover:shadow-[0_18px_60px_-36px_rgba(15,23,42,0.8)] hover:border-teal-700/30"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest">
          <span className="text-muted-foreground">
            {articleDateFormatter.format(new Date(article.datePosted))}
          </span>
        </div>
        <h2 className="mt-4 line-clamp-2 text-lg font-semibold text-foreground">
          {article.title}
        </h2>
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
            <PaginationEllipsis />
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
            <PaginationEllipsis />
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
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
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
  const { page: pageStr } = await params;
  const session = await getServerSession(authOptions);

  // Validate auth
  if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
    redirect("/");
  }

  // Parse page number (1-indexed from URL, 0-indexed for API)
  const page = Math.max(0, Number.parseInt(pageStr, 10) - 1);

  // Fetch articles
  const data = await fetchArticles(page, session.accessToken);

  if (!data) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 my-3 sm:px-8 sm:py-12">
        <div className="text-center text-muted-foreground">
          Nie udało się załadować artykułów
        </div>
      </div>
    );
  }

  const validPage = Math.min(Math.max(page, 0), data.totalPages - 1);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 my-3 sm:px-8 sm:py-12">
      <div className="space-y-4" style={{ animationDelay: "40ms" }}>
        <div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Wszystkie artykuły
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            Przeglądaj wszystkie artykuły dostępne na platformie. Znajdź
            inspirację, poszerz swoją wiedzę i odkryj nowe tematy
          </p>
          {data.totalPages > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Strona {validPage + 1} z {data.totalPages}
            </p>
          )}
        </div>
      </div>

      {data.content.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 py-16 text-center">
          <p className="text-muted-foreground">
            Brak artykułów do wyświetlenia
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.content.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <PaginationControls
              currentPage={validPage}
              totalPages={data.totalPages}
            />
          )}
        </>
      )}

      <footer className="mt-8 rounded-2xl border border-border/70 bg-card/80 px-5 py-5 text-sm text-muted-foreground backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold tracking-[0.18em] text-foreground">
            COMPENDIA
          </p>
          <p>
            Stworzone dla studentów i wykładowców, którzy uczą się lepiej razem.
          </p>
          <p>© 2026 Compendia</p>
        </div>
      </footer>
    </div>
  );
}
