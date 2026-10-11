import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import Markdown from "react-markdown";
import "katex/dist/katex.min.css";

import ArticleCitation from "@/components/articles/articleCitation";
import ArticleComments from "@/components/articles/articleComments/articleComments";
import ArticleOwnerActions from "@/components/articles/articleOwnerActions";
import ArticleRating from "@/components/articles/articleRating/articleRating";
import ArticleReferences from "@/components/articles/articleReferences";
import ArticleGraphContainer from "@/components/articles/articleGraph/ArticleGraphContainer";
import {
  articleRehypePlugins,
  articleRemarkPlugins,
  articleUrlTransform,
  cleanArticleMarkdown,
  rehypeArticleSections,
  type ArticleSection,
} from "@/lib/articleContent";
import { isValidArticleId } from "@/lib/articleId";
import { siteUrl } from "@/lib/config";
import { isNotFoundError } from "@/lib/graphqlErrors";
import { authedQuery, getCurrentUserId, requireAccessToken } from "@/lib/server/session";
import { ARTICLE_QUERY, articleDateFormat, COMMENTS_PAGE_SIZE, type GraphqlArticle } from "@/services/graphql/articles";
import { mapGraphqlCommentToCommentItem } from "@/services/graphql/comments";
import type { ArticleReference } from "@/types/articles";

const readingColumn = "mx-auto w-full max-w-[40rem]";
const sectionClass = "border-t border-border px-5 py-10 sm:px-12 sm:py-14";
const proseClass = [
  "prose prose-ink max-w-none font-serif text-[1.125rem] leading-[1.7] wrap-break-word sm:text-[1.1875rem]",
  "prose-headings:scroll-mt-6 prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-[-0.01em]",
  "prose-a:text-link prose-a:decoration-1 prose-a:underline-offset-[3px] hover:prose-a:decoration-2 hyphens-auto [font-variant-numeric:oldstyle-nums_proportional-nums]",
  "prose-code:font-mono prose-code:text-[0.85em] prose-pre:overflow-x-auto prose-pre:font-mono prose-pre:text-sm",
  "prose-img:rounded-md [&_table]:block [&_table]:overflow-x-auto [&_table]:font-sans [&_table]:text-sm",
  "[&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1",
].join(" ");

async function fetchArticle(id: string, accessToken: string): Promise<GraphqlArticle | null> {
  try {
    return (await authedQuery(accessToken, ARTICLE_QUERY, { id, commentsPage: 0, commentsSize: COMMENTS_PAGE_SIZE })).article;
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
  const sections: ArticleSection[] = [];
  // Called directly, not as JSX: it renders synchronously so `sections` is filled before the contents list.
  const body = Markdown({
    children: cleanArticleMarkdown(article.content),
    remarkPlugins: articleRemarkPlugins,
    rehypePlugins: [[rehypeArticleSections, sections], ...articleRehypePlugins],
    urlTransform: articleUrlTransform,
  });
  const datePosted = new Date(article.datePosted);
  const citation = {
    id: article.id,
    author: article.author?.name ?? null,
    title: article.title,
    date: `${format.dateTime(datePosted, { year: "numeric" })}, ${format.dateTime(datePosted, { month: "long", day: "numeric" })}`,
    year: format.dateTime(datePosted, { year: "numeric" }),
    url: `${siteUrl}/articles/${article.id}`,
  };

  return (
    <div className="container-reading py-6 sm:py-12">
      <div className="sheet">
        <article className="px-5 pb-12 pt-10 sm:px-12 sm:pb-16 sm:pt-16">
          <header className={readingColumn}>
            <h1 className="title-display wrap-break-word text-foreground">
              {article.title}
            </h1>
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {article.author ? (
                <Link href={`/users/${article.author.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                  {article.author.name}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{t("common.unknownAuthor")}</span>
              )}
              <span aria-hidden>·</span>
              <time dateTime={article.datePosted}>{format.dateTime(datePosted, articleDateFormat)}</time>
              <span aria-hidden>·</span>
              <span>{t("article.level", { level: t(`complexity.${article.complexity}`) })}</span>
            </p>
            {isAuthor ? <ArticleOwnerActions articleId={article.id} /> : null}
          </header>

          {sections.length >= 3 ? (
            <nav aria-labelledby="contents-heading" className={`${readingColumn} mt-10 border-t border-border pt-6`}>
              <h2 id="contents-heading" className="text-sm font-semibold text-foreground">{t("article.contents")}</h2>
              <ol className="mt-3 grid gap-1.5 text-[0.9375rem] leading-snug">
                {sections.map((section, index) => (
                  <li key={section.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)]">
                    <span className="tabular-nums text-muted-foreground">{index + 1}.</span>
                    <a href={`#${section.id}`} className="text-link underline-offset-[3px] hover:underline wrap-anywhere">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className={`${readingColumn} mt-10 border-t border-border pt-10`}>
            <div className={proseClass}>{body}</div>
            <div className="mt-12 border-t border-border pt-6">
              <ArticleRating articleId={article.id} initialRating={article.rating} initialVote={article.myVote} />
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
            <ArticleCitation parts={citation} />
          </div>
        </section>

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
