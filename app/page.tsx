import type { ReactNode } from "react";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import LoginCard from "@/components/loginCard";
import { authOptions } from "@/lib/auth";

const landingHighlights = [
  {
    title: "Notatki w kontekście",
    description: "Zachowuj powiązania między artykułami, pomysłami i materiałami do nauki.",
  },
  {
    title: "Szybki dostęp",
    description: "Wracaj do najnowszych treści bez przeklikiwania menu.",
  },
  {
    title: "Stworzone do nauki",
    description: "Skupiona przestrzeń dla studentów i wykładowców pracujących razem.",
  },
];

function LandingShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="compendia-surface min-h-screen overflow-x-clip text-foreground">
      <div className="compendia-noise pointer-events-none fixed inset-0 -z-20" aria-hidden />
      <div className="compendia-grid pointer-events-none fixed inset-0 -z-10 opacity-25" aria-hidden />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12 sm:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          {children}
        </div>
      </section>
    </main>
  );
}

function LandingHighlights() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {landingHighlights.map((item, index) => (
        <div
          key={item.title}
          className="fade-in-up rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur"
          style={{ animationDelay: `${140 + index * 70}ms` }}
        >
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const hasAccess = Boolean(session?.accessToken) && session?.error !== "RefreshAccessTokenError";

  if (hasAccess) {
    redirect("/articles");
  }

  return (
    <LandingShell>
      <div className="flex w-full flex-col gap-6 text-center lg:text-left">
        <div className="fade-in-up space-y-4" style={{ animationDelay: "40ms" }}>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-teal-700 dark:text-teal-300">Compendia</p>
          <h1 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
            Jedno miejsce na notatki, artykuły i uporządkowaną naukę.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Zaloguj się, aby kontynuować dokładnie tam, gdzie skończyłeś, i trzymać materiały w jednym miejscu.
          </p>
        </div>

        <LandingHighlights />
      </div>

      <div className="fade-in-up flex w-full justify-center lg:justify-end" style={{ animationDelay: "120ms" }}>
        <LoginCard />
      </div>
    </LandingShell>
  );
}
