import { useTranslations } from "next-intl";

import { CreateFormSkeleton, LoadingRegion, PageHeadingSkeleton, Skeleton } from "@/components/skeletons";

/** Shown while the create page loads (mirrors app/articles/create/page.tsx). */
export default function CreateArticleLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <section className="container-page my-3 flex flex-col gap-8 py-8 sm:py-12">
        <div className="space-y-3">
          <Skeleton className="h-8 w-44 rounded-full" />
          <PageHeadingSkeleton />
        </div>
        <CreateFormSkeleton />
      </section>
    </LoadingRegion>
  );
}
