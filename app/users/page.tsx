import Form from "next/form";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/userAvatar";
import { authedQuery, requireAccessToken } from "@/lib/server/session";
import { ALL_ARTICLES_SIZE, findAuthors } from "@/lib/users";
import { ARTICLE_AUTHORS_QUERY } from "@/services/graphql/users";

export default async function UsersPage({ searchParams }: Readonly<{ searchParams: Promise<{ q?: string | string[] }> }>) {
  const accessToken = await requireAccessToken();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const data = await authedQuery(accessToken, ARTICLE_AUTHORS_QUERY, { size: ALL_ARTICLES_SIZE });
  const users = findAuthors(data.articles.content.map((article) => article.author), query);
  const t = await getTranslations("users");
  const tRoles = await getTranslations("account.roles");

  return (
    <section className="container-page pb-6 pt-10 sm:pt-14">
      <div className="border-b border-border pb-6">
        <h1 className="title-page">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{t("description")}</p>
        <Form action="/users" role="search" className="mt-6 flex max-w-xl gap-3">
          <label htmlFor="user-search" className="sr-only">
            {t("searchLabel")}
          </label>
          <Input id="user-search" name="q" type="search" defaultValue={query} placeholder={t("placeholder")} className="h-10" />
          <Button type="submit" className="h-10">
            {t("submit")}
          </Button>
        </Form>
      </div>

      {users.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{query.trim() ? t("noResults") : t("empty")}</p>
      ) : (
        <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <li key={user.id} className="border-b border-border">
              <Link href={`/users/${user.id}`} className="-mx-2 flex items-center gap-3 rounded-sm px-2 py-4 transition-colors hover:bg-muted">
                <UserAvatar name={user.name} size={40} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{user.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {tRoles(user.role)}
                    <span aria-hidden> · </span>
                    {t("articleCount", { count: user.articleCount })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
