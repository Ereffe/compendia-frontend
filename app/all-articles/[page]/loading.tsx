import { useTranslations } from "next-intl";

import { ArchiveCardSkeleton, LoadingRegion, PageHeadingSkeleton } from "@/components/skeletons";

/** Shown while an archive page loads (mirrors app/all-articles/[page]/page.tsx). */
export default function ArchiveLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <div className="container-page my-3 flex flex-col gap-8 py-8 sm:py-12">
        <PageHeadingSkeleton withMeta />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ArchiveCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
