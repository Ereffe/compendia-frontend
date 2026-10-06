import { useTranslations } from "next-intl";

import NotFoundView from "@/components/notFoundView";

export default function ArticleNotFound() {
  const t = useTranslations();

  return (
    <NotFoundView
      title={t("article.notFoundTitle")}
      description={t("article.notFoundDescription")}
      primary={{ href: "/articles", label: t("common.backToArticles") }}
      secondary={{ href: "/articles/create", label: t("common.createArticle") }}
    />
  );
}
