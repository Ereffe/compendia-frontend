import { useTranslations } from "next-intl";

import { AccountSettingsSkeleton, LoadingRegion } from "@/components/skeletons";

export default function ProfileLoading() {
  const t = useTranslations("common");

  return (
    <LoadingRegion label={t("loading")}>
      <section className="container-reading pb-6 pt-10 sm:pt-14">
        <AccountSettingsSkeleton />
      </section>
    </LoadingRegion>
  );
}
