import { authOptions } from "@/lib/auth";
import { mapGraphqlCommentToCommentItem, type GraphqlCommentItem } from "@/services/graphql/comments";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Markdown from "react-markdown";
import ArticleComments from "../../../components/articles/articleComments/articleComments";
import type { CommentItem } from "@/types/comments";
import { query } from "../../ApolloClient";
import { gql } from "@apollo/client";

interface Article {
  id: string;
  title: string;
  content: string;
  datePosted: string;
  complexity: string;
  comments?: {
    content: GraphqlCommentItem[];
  };
  author?: {
    name: string;
  } | null;
  references?: Array<{
    doi: string;
    title: string;
    authors: string;
    description: string;
    url: string;
  }>;
}

const ARTICLE_QUERY = gql`
  query Article($id: String!, $page: Int!, $size: Int!) {
    article(id: $id) {
      id
      title
      content
      datePosted
      complexity
      comments(page: $page, size: $size, sortBy: "datePosted", ascending: false) {
        content {
          id
          content
          datePosted
          editedAt
          user {
            id
            name
          }
          rating {
            positive
            negative
          }
          parentComment {
            id
          }
        }
      }
      tags
      references {
        doi
        title
        authors
        description
        url
      }
      author {
        name
      }
    }
  }
`;

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

async function fetchArticle(id: string, accessToken: string): Promise<Article | null> {
  try {
    const result = await query<{ article: Article }>({
      query: ARTICLE_QUERY,
      variables: { id, page: 0, size: 10 },
      context: {
        // forward auth header to backend
        headers: { Authorization: `Bearer ${accessToken}` },
        fetchOptions: { next: { revalidate: 0 } },
      },
    });

    const article = result.data?.article;
    if (!article) return null;

    const normalizedComments: CommentItem[] =
      article.comments?.content.map(mapGraphqlCommentToCommentItem) ?? [];

    return {
      ...article,
      comments: { content: normalizedComments },
    };
  } catch (err) {
    console.error("fetchArticle (apollo) error:", err);
    return null;
  }
}

export default async function ArticlePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
    redirect("/");
  }

  const article = await fetchArticle(id, session.accessToken);
  if (!article) {
    notFound();
  }

  return (
    <>
      <section className="relative mx-auto max-w-3xl px-6 py-10 sm:px-8 sm:py-16">
        <article className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur sm:p-10">
          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-border pb-6">
            {article.complexity && (
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {article.complexity}
              </span>
            )}
            {article.datePosted && (
              <span className="ml-auto text-xs font-medium text-muted-foreground">
                {new Date(article.datePosted).toLocaleDateString("pl-PL", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
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
      <section className="mx-auto max-w-3xl px-6 py-2 sm:px-8 sm:py-4">
        {article.references && article.references.length > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur sm:p-10">
            <h2 className="mb-4 text-2xl font-bold leading-tight text-foreground">
              Źródła
            </h2>
            <ul className="list-disc list-inside space-y-3 text-muted-foreground">
              {article.references.map((reference) => (
                <li key={reference.doi}>
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-teal-600 hover:underline"
                  >
                    {reference.title}
                  </a>
                  <p className="text-sm text-muted-foreground">
                    {reference.authors}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {reference.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    DOI: {reference.doi}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    URL: {reference.url}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="relative mx-auto max-w-3xl px-6 pb-10 sm:px-8">
        <ArticleComments
          articleId={article.id}
          initialComments={article.comments?.content ?? []}
        />
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-8 sm:px-8">
        <div className="rounded-2xl border border-border/70 bg-card/80 px-5 py-5 text-sm text-muted-foreground backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold tracking-[0.18em] text-foreground">
              COMPENDIA
            </p>
            <p>
              Stworzone dla studentów i wykładowców, którzy uczą się lepiej
              razem.
            </p>
            <p>© 2026 Compendia</p>
          </div>
        </div>
      </footer>
    </>
  );
}
