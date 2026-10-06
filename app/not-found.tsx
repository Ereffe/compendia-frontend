import { useTranslations } from "next-intl";

import NotFoundView from "@/components/notFoundView";

export default function NotFound() {
  const t = useTranslations();

  return (
    <NotFoundView
      title={t("notFound.title")}
      description={t("notFound.description")}
      primary={{ href: "/articles", label: t("common.goToArticles") }}
      secondary={{ href: "/", label: t("common.backToHome") }}
    />
  );
}
