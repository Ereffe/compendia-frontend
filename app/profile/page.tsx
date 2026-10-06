import { getTranslations } from "next-intl/server";

import AccountSettings from "@/components/account/accountSettings";
import { authedQuery, requireAccessToken } from "@/lib/server/session";
import { CURRENT_USER_QUERY } from "@/services/graphql/users";

export default async function ProfilePage() {
  const accessToken = await requireAccessToken();
  const [{ getCurrentUser: user }, t] = await Promise.all([
    authedQuery(accessToken, CURRENT_USER_QUERY),
    getTranslations("account"),
  ]);

  return (
    <section className="container-page flex flex-col gap-8 py-8 sm:py-12">
      <div>
        <h1 className="font-serif text-4xl font-medium leading-tight tracking-[-0.02em] sm:text-5xl">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{t("description")}</p>
      </div>

      <AccountSettings user={user} />
    </section>
  );
}
