import { useTranslations } from "next-intl";

import {
  ArticleCardSkeleton,
  ArticleFiltersSkeleton,
  LoadingRegion,
  PageHeadingSkeleton,
  SearchBarSkeleton,
} from "@/components/skeletons";

export default function ArticlesLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <section className="container-page pb-6 pt-10 sm:pt-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <PageHeadingSkeleton />
          <div className="w-full shrink-0 lg:w-96">
            <SearchBarSkeleton />
          </div>
        </div>
        <div className="mb-8 mt-8 border-y border-border py-4">
          <ArticleFiltersSkeleton />
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
