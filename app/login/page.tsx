import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import LoginCard from "@/components/loginCard/loginCard";

export default function LoginPage() {
  const t = useTranslations("common");

  return (
    <div className="container-page py-8 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToHome")}
      </Link>

      <div className="mt-10 flex items-center justify-center">
        <LoginCard />
      </div>
    </div>
  );
}
