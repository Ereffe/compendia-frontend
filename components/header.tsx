"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/skeletons";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "./languageSwitcher";
import LoginModal from "./login-modal";
import ThemeToggle from "./themeToggle";
import UserAvatar from "./userAvatar";

const pillLink =
  "rounded-full border border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors duration-200 hover:bg-accent";

const navLinks = [
  { href: "/all-articles/1", key: "allArticles" },
  { href: "/articles/create", key: "createArticle" },
] as const;

export default function Header() {
  const t = useTranslations("header");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasAccess = status === "authenticated" && !session?.error;
  const showLogin = !hasAccess && status !== "loading";
  const userName = session?.user?.name;
  const avatarSeed = session?.user?.id ?? session?.user?.email ?? "";
  const accountLabel = userName ? t("accountOf", { name: userName }) : t("account");

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="container-page pt-4 sm:pt-8">
      <nav
        aria-label={t("navigation")}
        className="flex items-center justify-between gap-2 rounded-full border border-border/60 bg-card/75 py-2 pl-5 pr-2 backdrop-blur md:px-6 md:py-2.5"
      >
        <div className="flex items-center gap-2">
          <Link href="/articles" className="text-sm font-semibold tracking-[0.2em] text-foreground">
            COMPENDIA
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Link href={navLinks[0].href} className={pillLink}>
              {t(navLinks[0].key)}
            </Link>
          </div>
        </div>

        <div className="hidden md:block">
          <Link href={navLinks[1].href} className={pillLink}>
            {t(navLinks[1].key)}
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {hasAccess ? (
            <Link
              href="/profile"
              aria-label={accountLabel}
              title={accountLabel}
              aria-current={pathname === "/profile" ? "page" : undefined}
              className="rounded-full p-0.5 ring-1 ring-border/60 transition-shadow duration-200 hover:ring-foreground/40 aria-[current=page]:ring-2 aria-[current=page]:ring-foreground/60"
            >
              <UserAvatar userId={avatarSeed} size={32} />
            </Link>
          ) : null}
          {showLogin ? <LoginModal /> : null}
          {status === "loading" ? <Skeleton className="size-9 rounded-full" aria-hidden /> : null}
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="rounded-full border border-border/60 bg-background/80 p-2 text-foreground transition-colors hover:bg-accent md:hidden"
              aria-label={t("openMenu")}
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(20rem,85vw)] gap-0" closeLabel={tCommon("close")}>
            <SheetHeader className="border-b border-border">
              <SheetTitle className="tracking-[0.2em]">COMPENDIA</SheetTitle>
              <SheetDescription className={cn(!userName && "sr-only")}>{userName ?? t("menu")}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname.startsWith(link.href.replace(/\/1$/, "")) ? "page" : undefined}
                  className="rounded-xl px-3 py-3 text-sm font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-accent aria-[current=page]:bg-accent"
                >
                  {t(link.key)}
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border p-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            <div className="mt-auto border-t border-border p-4">
              {hasAccess ? (
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname === "/profile" ? "page" : undefined}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-foreground transition-colors hover:bg-accent aria-[current=page]:bg-accent"
                >
                  <UserAvatar userId={avatarSeed} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{userName ?? t("account")}</span>
                    {userName ? <span className="block text-xs text-muted-foreground">{t("account")}</span> : null}
                  </span>
                </Link>
              ) : null}
              {showLogin ? <LoginModal /> : null}
              {status === "loading" ? <Skeleton className="h-11 w-full rounded-xl" aria-hidden /> : null}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
