import { useTranslations } from "next-intl";

import { ArticleCardSkeleton, LoadingRegion, PageHeadingSkeleton, SearchBarSkeleton } from "@/components/skeletons";

export default function ArticlesLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <section className="container-page relative pt-8 sm:pt-12">
        <SearchBarSkeleton />
      </section>
      <section className="container-page relative pb-14 pt-8 sm:pb-16 sm:pt-12">
        <div className="mb-8">
          <PageHeadingSkeleton />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </LoadingRegion>
  );
}
