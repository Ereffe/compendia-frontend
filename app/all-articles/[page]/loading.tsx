import { useTranslations } from "next-intl";

import { ArticleCardSkeleton, LoadingRegion, PageHeadingSkeleton } from "@/components/skeletons";

export default function ArchiveLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <div className="container-page my-3 flex flex-col gap-8 py-8 sm:py-12">
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
