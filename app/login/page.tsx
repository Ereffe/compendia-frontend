import Link from "next/link";
import LoginCard from "@/components/loginCard";

export default function LoginPage() {
  return (
    <main className="compendia-surface min-h-screen overflow-x-clip px-6 py-10 text-foreground sm:px-8 sm:py-14">
      <div className="compendia-noise pointer-events-none fixed inset-0 -z-20" aria-hidden />
      <div className="compendia-grid pointer-events-none fixed inset-0 -z-10 opacity-25" aria-hidden />

      <div className="mx-auto flex w-full max-w-6xl justify-between">
        <Link
          href="/"
          className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:bg-accent"
        >
          Wróć na stronę główną
        </Link>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-6xl items-center justify-center">
        <LoginCard />
      </div>
    </main>
  );
}