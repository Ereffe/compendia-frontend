
import AccountSettings from "@/components/account/accountSettings";
import { authedQuery, requireAccessToken } from "@/lib/server/session";
import { CURRENT_USER_QUERY } from "@/services/graphql/users";

export default async function ProfilePage() {
  const accessToken = await requireAccessToken();
  const { getCurrentUser: user } = await authedQuery(accessToken, CURRENT_USER_QUERY);
  const { email } = user;
  if (!email) throw new Error("getCurrentUser returned no e-mail for the signed-in user");

  return (
    <section className="container-reading pb-6 pt-10 sm:pt-14">
      <AccountSettings user={{ ...user, email }} />
    </section>
  );
}
