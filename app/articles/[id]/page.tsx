import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Markdown from "react-markdown";

interface Article {
    id: string;
    title: string;
    content: string;
    datePosted: string;
    complexity: string;
    author?: {
      name: string;
    } | null;
    subject?: {
      name: string;
    } | null;
}

const articleQuery = `
query Article($id: String!) {
  article(id: $id) {
    id
    title
    content
    datePosted
    complexity
    author {
      name
    }
    subject {
      name
    }
  }
}
`

const backendBaseUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

async function fetchArticle(id: string, accessToken: string): Promise<Article | null> {
  try {
    const response = await fetch(`${backendBaseUrl}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      body: JSON.stringify({
        query: articleQuery,
        variables: { id },
      }),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { data?: { article?: Article } };
    return payload.data?.article ?? null;
  } catch {
    return null;
  }
}

export default async function ArticlePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
    redirect("/");
  }

  const article = await fetchArticle(id, session.accessToken);
    if (!article) return <div>Article not found</div>;

  return (
    <main className="compendia-surface min-h-screen overflow-x-clip text-foreground">
      <div className="compendia-noise pointer-events-none fixed inset-0 -z-20" aria-hidden />
      <div className="compendia-grid pointer-events-none fixed inset-0 -z-10 opacity-25" aria-hidden />

      <header className="relative mx-auto max-w-6xl px-6 pt-6 sm:px-8 sm:pt-10">
        <nav className="fade-in-up flex items-center gap-4 rounded-full border border-border/70 bg-card/80 px-4 py-2.5 backdrop-blur md:px-6">
          <Link href="/articles" className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground/90 transition-colors duration-200 hover:bg-accent">
            ← Back
          </Link>
          <div className="h-6 w-px bg-border" />
          <span className="text-xs font-semibold tracking-[0.2em] text-foreground">
            {article.subject?.name || 'ARTICLE'}
          </span>
        </nav>
      </header>

      <section className="relative mx-auto max-w-3xl px-6 py-10 sm:px-8 sm:py-16">
        <article className="fade-in-up rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur sm:p-10">
          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-border pb-6">
            {article.subject?.name && (
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal-800 dark:bg-teal-950/60 dark:text-teal-200">
                {article.subject.name}
              </span>
            )}
            {article.complexity && (
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {article.complexity}
              </span>
            )}
            {article.datePosted && (
              <span className="ml-auto text-xs font-medium text-muted-foreground">
                {new Date(article.datePosted).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          <h1 className="mb-4 text-4xl font-bold leading-tight text-foreground sm:text-5xl wrap-break-words">
            {article.title}
          </h1>

          {article.author?.name && (
            <p className="mb-8 border-b border-border pb-5 text-base font-medium text-muted-foreground">
              By <span className="font-semibold">{article.author.name}</span>
            </p>
          )}

          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground dark:prose-invert">
            <Markdown>{article.content}</Markdown>
          </div>
        </article>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-8 sm:px-8">
        <div className="fade-in-up rounded-2xl border border-border/70 bg-card/80 px-5 py-5 text-sm text-muted-foreground backdrop-blur">
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