import { useTranslations } from "next-intl";

import { ArticleSheetSkeleton, LoadingRegion } from "@/components/skeletons";

export default function ArticleLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")} className="container-reading py-6 sm:py-12">
      <ArticleSheetSkeleton />
    </LoadingRegion>
  );
}
