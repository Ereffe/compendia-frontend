import { useTranslations } from "next-intl";

import { ArticleBodySkeleton, CommentsSkeleton, LoadingRegion } from "@/components/skeletons";

/** Shown while an article loads (mirrors app/articles/[id]/page.tsx). */
export default function ArticleLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <section className="container-reading relative py-8 sm:py-12">
        <ArticleBodySkeleton />
      </section>
      <section className="container-reading relative pb-10 pt-2 sm:pt-4">
        <CommentsSkeleton />
      </section>
    </LoadingRegion>
  );
}
