import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ArticleSearchModal from "@/components/articleSearchModal";
import { authOptions } from "@/lib/auth";

type GraphQLArticle = {
  id: string;
  title: string;
  content: string;
  datePosted: string;
  subject?: {
    name: string;
  } | null;
  author?: {
    name: string;
  } | null;
};

type ArticleSearchItem = {
  title: string;
  category: string;
  publishedAt: string;
  author: string;
  id: string;
};

const backendBaseUrl =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:8080";

const newestArticlesQuery = `
  query GetNewestArticles($page: Int!, $size: Int!, $sortBy: String, $ascending: Boolean) {
    articles(page: $page, size: $size, sortBy: $sortBy, ascending: $ascending) {
      content {
        id
        title
        content
        datePosted
        subject {
          name
        }
        author {
          name
        }
      }
    }
  }
`;

const articleDateFormatter = new Intl.DateTimeFormat("pl-PL", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const pageIntro = {
  title: "Najnowsze artykuły",
  description:
    "Przeglądaj najnowsze wpisy, otwieraj pełne artykuły i wracaj do czytania bez utraty kontekstu.",
};

const mapArticleToSearchItem = (
  article: GraphQLArticle,
): ArticleSearchItem => ({
  id: article.id,
  title: article.title,
  category: article.subject?.name ?? "Uncategorized",
  publishedAt: articleDateFormatter.format(new Date(article.datePosted)),
  author: article.author?.name ?? "Unknown author",
});

function ArticleCard({
  article,
  index,
}: Readonly<{ article: ArticleSearchItem; index: number }>) {
  return (
    <Link href={`/articles/${article.id}`} className="contents">
      <article
        className="fade-in-up rounded-2xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur"
        style={{ animationDelay: `${160 + index * 90}ms` }}
      >
        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest">
          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200">
            {article.category}
          </span>
          <span className="text-muted-foreground">{article.publishedAt}</span>
        </div>
        <h2 className="mt-4 text-center text-xl font-semibold text-foreground">
          {article.title}
        </h2>
        <p className="mt-4 text-sm font-medium text-foreground/90">
          By {article.author}
        </p>
      </article>
    </Link>
  );
}

function ArticlesGrid({
  articles,
}: Readonly<{ articles: ArticleSearchItem[] }>) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {articles.map((article, index) => (
        <ArticleCard key={article.id} article={article} index={index} />
      ))}
    </div>
  );
}

function ArticlesIntro() {
  return (
    <div className="mb-8 fade-in-up" style={{ animationDelay: "80ms" }}>
      <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
        {pageIntro.title}
      </h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
        {pageIntro.description}
      </p>
    </div>
  );
}

function ArticlesFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="mx-auto max-w-2xl px-6 pb-10 sm:px-8">
      <div
        className="fade-in-up rounded-2xl border border-border/70 bg-card/80 px-5 py-5 text-sm text-muted-foreground backdrop-blur"
        style={{ animationDelay: "640ms" }}
      >
        <div className="flex justify-center">
          <p>{currentYear} Compendia</p>
        </div>
      </div>
    </footer>
  );
}

async function getNewestArticles(
  accessToken: string,
): Promise<ArticleSearchItem[]> {
  try {
    const response = await fetch(`${backendBaseUrl}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      body: JSON.stringify({
        query: newestArticlesQuery,
        variables: {
          page: 0,
          size: 4,
          sortBy: "datePosted",
          ascending: false,
        },
      }),
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      data?: {
        articles?: {
          content?: GraphQLArticle[];
        };
      };
    };

    return (payload.data?.articles?.content ?? []).map(mapArticleToSearchItem);
  } catch {
    return [];
  }
}

export default async function ArticlesPage() {
  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken;
  const hasAccess =
    Boolean(session?.accessToken) &&
    session?.error !== "RefreshAccessTokenError";

  if (!hasAccess) {
    redirect("/");
  }

  const newestArticles = await getNewestArticles(accessToken!);

  return (
    <>
      <section className="relative mx-auto flex min-h-[20vh] max-w-6xl items-center px-6 pt-10 sm:px-8 sm:pt-12">
        <div className="w-full fade-in-up" style={{ animationDelay: "60ms" }}>
          <ArticleSearchModal articles={newestArticles} />
        </div>
      </section>

      <section
        id="articles"
        className="relative mx-auto max-w-6xl px-6 pb-14 pt-4 sm:px-8 sm:pb-16 sm:pt-6"
      >
        <ArticlesIntro />
        <ArticlesGrid articles={newestArticles} />
      </section>

      <ArticlesFooter />
    </>
  );
}
