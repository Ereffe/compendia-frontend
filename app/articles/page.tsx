import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ArticleSearchModal from "@/components/article-search-modal";
import { authOptions } from "@/lib/auth";
import Header from "@/components/header";

type GraphQLArticle = {
  id: string,
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
  excerpt: string;
  category: string;
  publishedAt: string;
  author: string;
  id: string;
};

const backendBaseUrl = process.env.BACKEND_URL;

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

const articleDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const trimArticleExcerpt = (content: string) => {
  const normalizedContent = content.replaceAll(/\s+/g, " ").trim();
  const excerpt = normalizedContent.slice(0, 120);

  return normalizedContent.length > excerpt.length ? `${excerpt}...` : excerpt;
};

const mapArticleToSearchItem = (article: GraphQLArticle): ArticleSearchItem => ({
  id: article.id,
  title: article.title,
  excerpt: trimArticleExcerpt(article.content),
  category: article.subject?.name ?? "Uncategorized",
  publishedAt: articleDateFormatter.format(new Date(article.datePosted)),
  author: article.author?.name ?? "Unknown author",
});

async function getNewestArticles(accessToken: string): Promise<ArticleSearchItem[]> {
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

  if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
    redirect("/");
  }

  const newestArticles = await getNewestArticles(session.accessToken);

  const hasAccess = Boolean(session?.accessToken) && session.error !== "RefreshAccessTokenError";

  return (
    <main className="compendia-surface min-h-screen overflow-x-clip text-foreground">
      <div className="compendia-noise pointer-events-none fixed inset-0 -z-20" aria-hidden />
      <div className="compendia-grid pointer-events-none fixed inset-0 -z-10 opacity-25" aria-hidden />

      <Header hasAccess={hasAccess}/>

      <section className="relative mx-auto flex min-h-[34vh] max-w-6xl items-center px-6 pt-10 sm:px-8 sm:pt-12">
        <div className="w-full fade-in-up" style={{ animationDelay: "60ms" }}>
          <ArticleSearchModal articles={newestArticles} />
        </div>
      </section>

      <section id="articles" className="relative mx-auto max-w-6xl px-6 pb-14 pt-4 sm:px-8 sm:pb-16 sm:pt-6">
        <div className="mb-8 fade-in-up" style={{ animationDelay: "80ms" }}>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-teal-700 dark:text-teal-300">For Computer Science Students and Lecturers</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Newest Articles</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            Compendia helps CS communities share knowledge through articles: lecture insights, coding patterns, lab
            walkthroughs, debugging tips, and exam preparation resources in one searchable place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {newestArticles.map((article, index) => (
            <Link href={`/articles/${article.id}`} className="contents" key={article.title}>
            <article
              key={article.title}
              className="fade-in-up rounded-2xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur"
              style={{ animationDelay: `${160 + index * 90}ms` }}
              >
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest">
                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200">{article.category}</span>
                <span className="text-muted-foreground">{article.publishedAt}</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">{article.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
              <p className="mt-4 text-sm font-medium text-foreground/90">By {article.author}</p>
            </article>
              </Link>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 sm:px-8">
        <div
          className="fade-in-up rounded-2xl border border-border/70 bg-card/80 px-5 py-5 text-sm text-muted-foreground backdrop-blur"
          style={{ animationDelay: "640ms" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold tracking-[0.18em] text-foreground">COMPENDIA</p>
            <p>Built for computer science students and lecturers who learn better together.</p>
            <p>© 2026 Compendia</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
