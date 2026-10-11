import Link from "next/link";
import { useTranslations } from "next-intl";

export default function SiteFooter({ className = "" }: Readonly<{ className?: string }>) {
  const t = useTranslations("footer");

  return (
    <footer className={`mt-12 border-t border-border ${className}`}>
      <div className="container-page flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <p>
          <span className="font-serif text-base text-foreground">Compendia</span>
          <span aria-hidden> · </span>
          {t("tagline")}
        </p>
        <p className="flex items-baseline gap-4">
          <Link href="/terms" className="underline-offset-[3px] hover:text-foreground hover:underline">
            {t("terms")}
          </Link>
          <span className="tabular-nums">© {new Date().getFullYear()}</span>
        </p>
      </div>
    </footer>
  );
}
