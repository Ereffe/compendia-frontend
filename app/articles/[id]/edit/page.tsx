import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import { getTranslations } from "next-intl/server";

import ArticleCreateForm from "@/components/articles/articleCreateForm/articleCreateForm";
import { cleanArticleMarkdown } from "@/lib/articleContent";
import { isValidArticleId } from "@/lib/articleId";
import { isNotFoundError } from "@/lib/graphqlErrors";
import { authedQuery, getCurrentUserId, requireAccessToken } from "@/lib/server/session";
import { EDITABLE_ARTICLE_QUERY, type GraphqlEditableArticle } from "@/services/graphql/articles";

async function fetchEditableArticle(id: string, accessToken: string): Promise<GraphqlEditableArticle | null> {
  try {
    const data = await authedQuery(accessToken, EDITABLE_ARTICLE_QUERY, { id });
    return data.article;
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

export default async function EditArticlePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const accessToken = await requireAccessToken();

  if (!isValidArticleId(id)) {
    notFound();
  }

  const [article, currentUserId] = await Promise.all([fetchEditableArticle(id, accessToken), getCurrentUserId()]);
  if (!article) {
    notFound();
  }
  if (!currentUserId || article.author?.id !== currentUserId) {
    redirect(`/articles/${id}`);
  }

  const t = await getTranslations();
  const references = (article.references ?? []).flatMap((reference) => (reference ? [reference.doi] : []));

  return (
    <section className="container-reading flex flex-col gap-8 pb-6 pt-10 sm:pt-14">
      <div>
        <Link
          href={`/articles/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("edit.backToArticle")}
        </Link>
        <h1 className="mt-4 title-page">{t("edit.title")}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{t("edit.description")}</p>
      </div>

      <ArticleCreateForm
        article={{
          id: article.id,
          title: article.title,
          content: cleanArticleMarkdown(article.content),
          complexity: article.complexity,
          references,
        }}
      />
    </section>
  );
}
