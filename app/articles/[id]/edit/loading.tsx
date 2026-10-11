import { useTranslations } from "next-intl";

import { CreateFormSkeleton, LoadingRegion, Skeleton } from "@/components/skeletons";

export default function EditArticleLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <section className="container-reading flex flex-col gap-8 pb-6 pt-10 sm:pt-14">
        <div>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-5 h-10 w-72 sm:h-12 sm:w-md" />
          <div className="mt-4 max-w-2xl space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <CreateFormSkeleton />
      </section>
    </LoadingRegion>
  );
}
