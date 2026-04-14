import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ArticleSearchModal from "@/components/article-search-modal";
import LoginModal from "@/components/login-modal";
import { authOptions } from "@/lib/auth";
import { User } from "lucide-react";

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
  const normalizedContent = content.replace(/\s+/g, " ").trim();
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
    <main className="compendia-surface min-h-screen overflow-x-clip text-slate-950">
      <div className="compendia-noise pointer-events-none fixed inset-0 -z-20" aria-hidden />
      <div className="compendia-grid pointer-events-none fixed inset-0 -z-10 opacity-25" aria-hidden />

      <header className="relative mx-auto max-w-6xl px-6 pt-6 sm:px-8 sm:pt-10">
        <nav className="fade-in-up flex items-center justify-between rounded-full border border-slate-950/15 bg-white/75 px-4 py-2.5 backdrop-blur md:px-6">
          <Link href="/articles" className="text-sm font-semibold tracking-[0.2em] text-slate-900">
            COMPENDIA
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="#articles"
              className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors duration-200 hover:bg-slate-900/5"
            >
              Newest Articles
            </Link>
            <Link
              href="#"
              className="rounded-full border border-slate-900/15 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-800 transition-colors duration-200 hover:bg-slate-900/5"
              aria-label="Open messenger"
            >
              Messenger
            </Link>
           {hasAccess ? <User/> : <LoginModal />}
          </div>
        </nav>
      </header>

      <section className="relative mx-auto flex min-h-[34vh] max-w-6xl items-center px-6 pt-10 sm:px-8 sm:pt-12">
        <div className="w-full fade-in-up" style={{ animationDelay: "60ms" }}>
          <ArticleSearchModal articles={newestArticles} />
        </div>
      </section>

      <section id="articles" className="relative mx-auto max-w-6xl px-6 pb-14 pt-4 sm:px-8 sm:pb-16 sm:pt-6">
        <div className="mb-8 fade-in-up" style={{ animationDelay: "80ms" }}>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-teal-700">For Computer Science Students and Lecturers</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Newest Articles</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
            Compendia helps CS communities share knowledge through articles: lecture insights, coding patterns, lab
            walkthroughs, debugging tips, and exam preparation resources in one searchable place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {newestArticles.map((article, index) => (
            <Link href={`/articles/${article.id}`} className="contents" key={article.title}>
            <article
              key={article.title}
              className="fade-in-up rounded-2xl border border-slate-950/10 bg-white/75 p-5 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur"
              style={{ animationDelay: `${160 + index * 90}ms` }}
              >
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest">
                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-teal-800">{article.category}</span>
                <span className="text-slate-600">{article.publishedAt}</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">{article.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{article.excerpt}</p>
              <p className="mt-4 text-sm font-medium text-slate-700">By {article.author}</p>
            </article>
              </Link>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 sm:px-8">
        <div
          className="fade-in-up rounded-2xl border border-slate-950/10 bg-white/70 px-5 py-5 text-sm text-slate-700 backdrop-blur"
          style={{ animationDelay: "640ms" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold tracking-[0.18em] text-slate-900">COMPENDIA</p>
            <p>Built for computer science students and lecturers who learn better together.</p>
            <p>© 2026 Compendia</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
