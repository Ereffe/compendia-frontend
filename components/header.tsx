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

const navLink =
  "text-sm text-muted-foreground underline-offset-[6px] transition-colors hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline";

const navLinks = [
  { href: "/all-articles/1", key: "allArticles" },
  { href: "/articles/create", key: "createArticle" },
  { href: "/users", key: "users" },
] as const;

const isCurrent = (pathname: string, href: string) => pathname.startsWith(href.replace(/\/1$/, ""));

const ariaCurrent = (current: boolean) => (current ? ("page" as const) : undefined);

export default function Header() {
  const t = useTranslations("header");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasAccess = status === "authenticated" && !session?.error;
  const showLogin = !hasAccess && status !== "loading";
  const userName = session?.user?.name;
  const accountLabel = userName ? t("accountOf", { name: userName }) : t("account");

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="border-b border-border">
      <nav aria-label={t("navigation")} className="container-page flex h-14 items-center justify-between gap-6 sm:h-16">
        <div className="flex items-baseline gap-8">
          <Link href="/articles" className="font-serif text-xl font-medium tracking-[-0.01em] text-foreground">
            Compendia
          </Link>
          <div className="hidden items-baseline gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={ariaCurrent(isCurrent(pathname, link.href))}
                className={navLink}
              >
                {t(link.key)}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          {hasAccess ? (
            <Link
              href="/profile"
              aria-label={accountLabel}
              title={accountLabel}
              aria-current={ariaCurrent(pathname === "/profile")}
              className="rounded-full ring-1 ring-border transition-shadow hover:ring-muted-foreground aria-[current=page]:ring-2 aria-[current=page]:ring-foreground"
            >
              <UserAvatar name={userName ?? ""} size={30} />
            </Link>
          ) : null}
          {showLogin ? <LoginModal /> : null}
          {status === "loading" ? <Skeleton className="size-8 rounded-full" aria-hidden /> : null}
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="-mr-2 rounded-md p-2 text-foreground transition-colors hover:bg-accent md:hidden"
              aria-label={t("openMenu")}
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(20rem,85vw)] gap-0" closeLabel={tCommon("close")}>
            <SheetHeader className="border-b border-border">
              <SheetTitle className="font-serif text-xl font-medium">Compendia</SheetTitle>
              <SheetDescription className={cn(!userName && "sr-only")}>{userName ?? t("menu")}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col p-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={ariaCurrent(isCurrent(pathname, link.href))}
                  className="rounded-md px-3 py-3 text-base text-foreground transition-colors hover:bg-accent aria-[current=page]:font-semibold"
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
                  aria-current={ariaCurrent(pathname === "/profile")}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-foreground transition-colors hover:bg-accent aria-[current=page]:bg-accent"
                >
                  <UserAvatar name={userName ?? ""} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{userName ?? t("account")}</span>
                    {userName ? <span className="block text-xs text-muted-foreground">{t("account")}</span> : null}
                  </span>
                </Link>
              ) : null}
              {showLogin ? <LoginModal /> : null}
              {status === "loading" ? <Skeleton className="h-11 w-full rounded-md" aria-hidden /> : null}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
