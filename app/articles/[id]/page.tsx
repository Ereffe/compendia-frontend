import { notFound, unstable_rethrow } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import Markdown from "react-markdown";

import ArticleComments from "@/components/articles/articleComments/articleComments";
import ArticleReferences from "@/components/articles/articleReferences";
import ArticleGraphContainer from "@/components/articles/articleGraph/ArticleGraphContainer";
import { isValidArticleId } from "@/lib/articleId";
import { isNotFoundError } from "@/lib/graphqlErrors";
import { authedQuery, requireAccessToken } from "@/lib/server/session";
import { ARTICLE_QUERY, articleDateFormat, COMMENTS_PAGE_SIZE, type GraphqlArticle } from "@/services/graphql/articles";
import { mapGraphqlCommentToCommentItem } from "@/services/graphql/comments";
import type { ArticleComplexity, ArticleReference } from "@/types/articles";

const isKnownComplexity = (value: string): value is ArticleComplexity =>
  value === "SIMPLE" || value === "INTERMEDIATE" || value === "COMPLEX";

async function fetchArticle(id: string, accessToken: string): Promise<GraphqlArticle | null> {
  try {
    const data = await authedQuery<{ article: GraphqlArticle | null }>(accessToken, ARTICLE_QUERY, {
      id,
      commentsPage: 0,
      commentsSize: COMMENTS_PAGE_SIZE,
    });
    return data.article;
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFoundError(error)) {
      return null;
    }
    // Network/server failures go to app/error.tsx instead of masquerading as a 404.
    throw error;
  }
}

export default async function ArticlePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const accessToken = await requireAccessToken();

  if (!isValidArticleId(id)) {
    notFound();
  }

  const article = await fetchArticle(id, accessToken);
  if (!article) {
    notFound();
  }

  const t = await getTranslations();
  const format = await getFormatter();
  const references = (article.references ?? []).filter((reference): reference is ArticleReference => reference != null);
  const comments = article.comments.content.map(mapGraphqlCommentToCommentItem);

  return (
    <>
      <section className="container-reading relative py-8 sm:py-12">
        <article className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur sm:p-10">
          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-border pb-6">
            {article.complexity ? (
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {isKnownComplexity(article.complexity) ? t(`complexity.${article.complexity}`) : article.complexity}
              </span>
            ) : null}
            <span className="ml-auto text-xs font-medium text-muted-foreground">
              {format.dateTime(new Date(article.datePosted), articleDateFormat)}
            </span>
          </div>

          <h1 className="wrap-break-word mb-4 text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            {article.title}
          </h1>

          {article.author?.name ? (
            <p className="mb-8 border-b border-border pb-5 text-base font-medium text-muted-foreground">
              {t("common.authorBy", { name: article.author.name })}
            </p>
          ) : null}

          <div className="prose max-w-none space-y-6 text-muted-foreground wrap-break-word dark:prose-invert sm:prose-lg prose-img:rounded-xl prose-pre:overflow-x-auto [&_table]:block [&_table]:overflow-x-auto">
            <Markdown>{article.content}</Markdown>
          </div>
        </article>
      </section>

      {references.length > 0 ? (
        <>
          <section className="container-reading py-2 sm:py-4">
            <ArticleReferences references={references} />
          </section>
          <section id="citation-graph" className="container-reading scroll-mt-6 py-2 sm:py-4">
            <ArticleGraphContainer references={references} />
          </section>
        </>
      ) : null}

      <section className="container-reading relative pb-10 pt-2 sm:pt-4">
        <ArticleComments
          articleId={article.id}
          initialComments={comments}
          totalCount={article.comments.totalElements}
        />
      </section>
    </>
  );
}
