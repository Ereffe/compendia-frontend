import Link from "next/link";
import { useTranslations } from "next-intl";

import LoginCard from "@/components/loginCard/loginCard";

export default function LoginPage() {
  const t = useTranslations("common");

  return (
    <div className="container-page py-8 sm:py-14">
      <div className="flex justify-between">
        <Link
          href="/"
          className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:bg-accent"
        >
          {t("backToHome")}
        </Link>
      </div>

      <div className="mt-10 flex items-center justify-center">
        <LoginCard />
      </div>
    </div>
  );
}
