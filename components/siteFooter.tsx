import { useTranslations } from "next-intl";

export default function SiteFooter({ className = "" }: Readonly<{ className?: string }>) {
  const t = useTranslations("footer");

  return (
    <footer className={`container-page pb-8 pt-8 sm:pb-10 ${className}`}>
      <div className="rounded-2xl border border-border/70 bg-card/80 px-5 py-5 text-sm text-muted-foreground backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          <p className="font-semibold tracking-[0.18em] text-foreground">COMPENDIA</p>
          <p>{t("tagline")}</p>
          <p>© {new Date().getFullYear()} Compendia</p>
        </div>
      </div>
    </footer>
  );
}
