import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import LanguageSwitcher from "@/components/languageSwitcher";
import LoginCard from "@/components/loginCard/loginCard";
import ThemeToggle from "@/components/themeToggle";
import { getAccessToken } from "@/lib/server/session";

const highlightKeys = ["context", "quickAccess", "learning"] as const;

export default async function Home({
  searchParams,
}: Readonly<{ searchParams: Promise<{ sessionExpired?: string }> }>) {
  if (await getAccessToken()) {
    redirect("/articles");
  }

  const t = await getTranslations("landing");
  // Set by app/session-expired/route.ts after the backend rejected the user's token.
  const sessionExpired = (await searchParams).sessionExpired === "1";

  return (
    <section className="container-page relative flex flex-1 flex-col py-6 sm:py-10">
      {/* The header is hidden on the landing page, so expose language and theme here. */}
      <div className="flex items-center justify-end gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {sessionExpired ? (
        <p
          role="alert"
          className="mx-auto mt-4 w-full max-w-xl rounded-2xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {t("sessionExpired")}
        </p>
      ) : null}

      <div className="grid w-full flex-1 content-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="flex w-full flex-col gap-6 text-center lg:text-left">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-teal-700 dark:text-teal-300">Compendia</p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl">{t("title")}</h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">{t("subtitle")}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlightKeys.map((key) => (
              <div key={key} className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-foreground">{t(`highlights.${key}.title`)}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`highlights.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full justify-center lg:justify-end">
          <LoginCard />
        </div>
      </div>
    </section>
  );
}
