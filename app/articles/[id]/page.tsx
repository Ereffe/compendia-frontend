import { notFound, unstable_rethrow } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import Markdown from "react-markdown";

import ArticleComments from "@/components/articles/articleComments/articleComments";
import ArticleOwnerActions from "@/components/articles/articleOwnerActions";
import ArticleReferences from "@/components/articles/articleReferences";
import ArticleGraphContainer from "@/components/articles/articleGraph/ArticleGraphContainer";
import { isKnownComplexity } from "@/lib/articleComplexity";
import { isValidArticleId } from "@/lib/articleId";
import { isNotFoundError } from "@/lib/graphqlErrors";
import { authedQuery, getCurrentUserId, requireAccessToken } from "@/lib/server/session";
import { ARTICLE_QUERY, articleDateFormat, COMMENTS_PAGE_SIZE, type GraphqlArticle } from "@/services/graphql/articles";
import { mapGraphqlCommentToCommentItem } from "@/services/graphql/comments";
import type { ArticleReference } from "@/types/articles";

const readingColumn = "mx-auto w-full max-w-[40rem]";
const sectionClass = "border-t border-border px-5 py-10 sm:px-12 sm:py-14";
const proseClass = [
  "prose prose-neutral max-w-none font-serif text-[1.125rem] leading-[1.7] wrap-break-word dark:prose-invert sm:text-[1.1875rem]",
  "prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-[-0.01em]",
  "prose-a:text-teal-800 prose-a:underline-offset-[3px] hover:prose-a:text-teal-950 dark:prose-a:text-teal-300",
  "prose-code:font-mono prose-code:text-[0.85em] prose-pre:overflow-x-auto prose-pre:font-mono prose-pre:text-sm",
  "prose-img:rounded-md [&_table]:block [&_table]:overflow-x-auto [&_table]:font-sans [&_table]:text-sm",
].join(" ");

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
    throw error;
  }
}

export default async function ArticlePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const accessToken = await requireAccessToken();

  if (!isValidArticleId(id)) {
    notFound();
  }

  const [article, currentUserId] = await Promise.all([fetchArticle(id, accessToken), getCurrentUserId()]);
  if (!article) {
    notFound();
  }
  const isAuthor = currentUserId !== null && article.author?.id === currentUserId;

  const t = await getTranslations();
  const format = await getFormatter();
  const references = (article.references ?? []).filter((reference): reference is ArticleReference => reference != null);
  const comments = article.comments.content.map(mapGraphqlCommentToCommentItem);

  let complexity: string | null = article.complexity ?? null;
  if (complexity && isKnownComplexity(complexity)) complexity = t(`complexity.${complexity}`);

  return (
    <div className="container-reading py-6 sm:py-12">
      <div className="sheet">
        <article className="px-5 pb-12 pt-10 sm:px-12 sm:pb-16 sm:pt-16">
          <header className={readingColumn}>
            <h1 className="wrap-break-word text-balance font-serif text-4xl font-medium leading-[1.08] tracking-[-0.02em] text-foreground sm:text-[3.25rem]">
              {article.title}
            </h1>
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{article.author?.name ?? t("common.unknownAuthor")}</span>
              <span aria-hidden>·</span>
              <time dateTime={article.datePosted}>{format.dateTime(new Date(article.datePosted), articleDateFormat)}</time>
              {complexity ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{t("article.level", { level: complexity })}</span>
                </>
              ) : null}
            </p>
            {isAuthor ? <ArticleOwnerActions articleId={article.id} /> : null}
          </header>

          <div className={`${readingColumn} mt-10 border-t border-border pt-10`}>
            <div className={proseClass}>
              <Markdown>{article.content}</Markdown>
            </div>
          </div>
        </article>

        {references.length > 0 ? (
          <>
            <section className={sectionClass}>
              <div className={readingColumn}>
                <ArticleReferences references={references} />
              </div>
            </section>
            <section id="citation-graph" className={`${sectionClass} scroll-mt-6`}>
              <ArticleGraphContainer references={references} headerClassName={readingColumn} />
            </section>
          </>
        ) : null}

        <section className={sectionClass}>
          <div className={readingColumn}>
            <ArticleComments
              articleId={article.id}
              initialComments={comments}
              totalCount={article.comments.totalElements}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
