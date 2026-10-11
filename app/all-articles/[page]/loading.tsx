import { useTranslations } from "next-intl";

import { ArticleCardSkeleton, LoadingRegion, PageHeadingSkeleton } from "@/components/skeletons";

export default function ArchiveLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <div className="container-page flex flex-col gap-8 pb-6 pt-10 sm:pt-14">
        <PageHeadingSkeleton withMeta />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
