"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import LoginModal from "./login-modal";
import ThemeToggle from "./themeToggle";
import { useAuthStore } from "@/hooks/stores/useAuthStore";

type HeaderProps = {
  hasAccess: boolean;
};

export default function Header({ hasAccess }: Readonly<HeaderProps>) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    useAuthStore.getState().logout();
    await signOut({ redirect: false });
    router.replace("/");
    router.refresh();
  };

  return pathname == "/" ? null : (
    <header className="sticky mx-auto w-full px-6 pt-6 sm:px-8 sm:pt-10">
      <nav className="flex items-center justify-between rounded-full border border-border/60 bg-card/75 px-4 py-2.5 backdrop-blur md:px-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/articles"
            className="text-sm font-semibold tracking-[0.2em] text-foreground"
          >
            COMPENDIA
          </Link>
          <ThemeToggle />
          <Link
            href="/all-articles/1"
            className="rounded-full border border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors duration-200 hover:bg-accent"
          >
            Wszystkie artykuły
          </Link>
        </div>

        <div>
          <Link
            href="/articles/create"
            className="rounded-full border border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors duration-200 hover:bg-accent"
          >
            Stwórz artykuł
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {hasAccess ? (
            <button
              type="button"
              onClick={() => handleLogout()}
              className="rounded-full border border-border/60 bg-background/80 p-2 text-foreground transition-colors duration-200 hover:bg-accent"
              aria-label="Wyloguj"
              title="Wyloguj"
            >
              <User className="size-5" />
            </button>
          ) : (
            <LoginModal />
          )}
        </div>
      </nav>
    </header>
  );
}
