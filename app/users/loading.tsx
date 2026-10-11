import { useTranslations } from "next-intl";

import { LoadingRegion, PageHeadingSkeleton, SearchBarSkeleton, Skeleton } from "@/components/skeletons";

export default function UsersLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <section className="container-page pb-6 pt-10 sm:pt-14">
        <div className="border-b border-border pb-6">
          <PageHeadingSkeleton />
          <div className="mt-6 max-w-xl">
            <SearchBarSkeleton />
          </div>
        </div>
        <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border py-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </LoadingRegion>
  );
}
