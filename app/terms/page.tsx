import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import TermsContent from "@/components/terms/termsContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("terms");
  return { title: `${t("title")} · Compendia`, description: t("description") };
}

export default function TermsPage() {
  const t = useTranslations("terms");

  return (
    <article className="container-reading flex flex-col gap-8 pb-6 pt-10 sm:pt-14">
      <header className="border-b border-border pb-6">
        <h1 className="title-page">{t("title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("effective")}</p>
      </header>
      <TermsContent />
    </article>
  );
}
