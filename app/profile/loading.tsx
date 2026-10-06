import { useTranslations } from "next-intl";

import { AccountSettingsSkeleton, LoadingRegion, PageHeadingSkeleton } from "@/components/skeletons";

export default function ProfileLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <section className="container-page flex flex-col gap-8 py-8 sm:py-12">
        <PageHeadingSkeleton />
        <AccountSettingsSkeleton />
      </section>
    </LoadingRegion>
  );
}
