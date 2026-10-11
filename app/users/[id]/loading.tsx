import { useTranslations } from "next-intl";

import { ArticleCardSkeleton, LoadingRegion, Skeleton } from "@/components/skeletons";

export default function UserLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <section className="container-page flex flex-col gap-8 pb-6 pt-10 sm:pt-14">
        <div className="flex items-center gap-5 border-b border-border pb-8">
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="w-full space-y-2.5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        </div>
        <div>
          <Skeleton className="h-7 w-32" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </LoadingRegion>
  );
}
