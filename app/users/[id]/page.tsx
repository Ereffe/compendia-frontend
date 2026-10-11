import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { getTranslations } from "next-intl/server";

import ArticleCard from "@/components/articleCard";
import EmptyState from "@/components/emptyState";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/userAvatar";
import { isNotFoundError } from "@/lib/graphqlErrors";
import { authedQuery, getCurrentUserId, requireAccessToken } from "@/lib/server/session";
import { ALL_ARTICLES_SIZE, isValidUserId } from "@/lib/users";
import { ARTICLES_QUERY, mapArticleToSearchItem } from "@/services/graphql/articles";
import { USER_QUERY } from "@/services/graphql/users";

async function fetchUser(id: string, accessToken: string) {
  try {
    return (await authedQuery(accessToken, USER_QUERY, { id })).getUserById;
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

async function fetchArticlesBy(id: string, accessToken: string) {
  const data = await authedQuery(accessToken, ARTICLES_QUERY, {
    page: 0,
    size: ALL_ARTICLES_SIZE,
    sortBy: "datePosted",
    ascending: false,
    withCommentCount: false,
  });
  return data.articles.content.filter((article) => article.author?.id === id).map(mapArticleToSearchItem);
}

export default async function UserPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const accessToken = await requireAccessToken();

  if (!isValidUserId(id)) {
    notFound();
  }

  const [user, articles, currentUserId] = await Promise.all([
    fetchUser(id, accessToken),
    fetchArticlesBy(id, accessToken),
    getCurrentUserId(),
  ]);
  if (!user) {
    notFound();
  }

  const t = await getTranslations("users");
  const tRoles = await getTranslations("account.roles");
  const isOwnProfile = user.id === currentUserId;

  return (
    <section className="container-page flex flex-col gap-8 pb-6 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-4 border-b border-border pb-8">
        <UserAvatar name={user.name} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-3xl font-medium leading-tight tracking-[-0.01em] wrap-anywhere">{user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tRoles(user.role)}
            <span aria-hidden> · </span>
            {t("articleCount", { count: articles.length })}
          </p>
        </div>
        {isOwnProfile ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">{t("accountSettings")}</Link>
          </Button>
        ) : null}
      </header>

      <div>
        <h2 className="title-section">{t("articlesHeading")}</h2>
        {articles.length === 0 ? (
          <EmptyState
            message={isOwnProfile ? t("noOwnArticles") : t("noArticles")}
            action={isOwnProfile ? { href: "/articles/create", label: t("createFirst") } : undefined}
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
