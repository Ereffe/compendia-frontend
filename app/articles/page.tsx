import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ArticleSearchModal from "@/components/articleSearchModal/articleSearchModal";
import { authOptions } from "@/lib/auth";
import { query } from "../ApolloClient";
import { gql } from "@apollo/client";

type GraphQLArticle = {
  id: string;
  title: string;
  content: string;
  datePosted: string;
  author?: {
    name: string;
  } | null;
};

type ArticleSearchItem = {
  title: string;
  publishedAt: string;
  author: string;
  id: string;
};

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const NEWEST_ARTICLES_QUERY = gql`
  query GetNewestArticles($page: Int!, $size: Int!, $sortBy: String, $ascending: Boolean) {
    articles(page: $page, size: $size, sortBy: $sortBy, ascending: $ascending) {
      content {
        id
        title
        content
        datePosted
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

async function getNewestArticles(accessToken: string): Promise<ArticleSearchItem[]> {
  try {
    const res = await query<{ articles: { content: GraphQLArticle[] } }>({
      query: NEWEST_ARTICLES_QUERY,
      variables: { page: 0, size: 4, sortBy: "datePosted", ascending: false },
      context: { headers: { Authorization: `Bearer ${accessToken}` }, fetchOptions: { next: { revalidate: 0 } } },
    });

    return (res.data?.articles?.content ?? []).map(mapArticleToSearchItem);
  } catch (e) {
    console.error("getNewestArticles (apollo) error:", e);
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
