import LoginCard from "@/components/loginCard";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.accessToken && session.error !== "RefreshAccessTokenError") {
    redirect("/articles");
  }

  return (
    <main className="compendia-surface min-h-screen overflow-x-clip text-foreground">
      <div className="compendia-noise pointer-events-none fixed inset-0 -z-20" aria-hidden />
      <div className="compendia-grid pointer-events-none fixed inset-0 -z-10 opacity-25" aria-hidden />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12 sm:px-8">
        <div className="fade-in-up flex w-full flex-col items-center gap-5" style={{ animationDelay: "80ms" }}>
          <LoginCard />
        </div>
      </section>
    </main>
  );
}
