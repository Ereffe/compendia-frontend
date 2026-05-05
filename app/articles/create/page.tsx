import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ArticleCreateForm from "@/components/articles/articleCreateForm";
import { authOptions } from "@/lib/auth";

const creationTips = [
  "Tytuł powinien być jasny i opisowy – ułatwia znalezienie artykułu innym użytkownikom.",
  "Zacznij od krótkiego wprowadzenia, a następnie podziel treść na logiczne sekcje.",
  "Używaj formatowania Markdown do wyróżnienia ważnych elementów i poprawy czytelności.",
  "Wybierz poprawny poziom zaawansowania – pomoże to innym w wyborze odpowiedniego materiału.",
];

export default async function CreateArticlePage() {
  const session = await getServerSession(authOptions);
  const hasAccess =
    Boolean(session?.accessToken) &&
    session?.error !== "RefreshAccessTokenError";

  if (!hasAccess) {
    redirect("/");
  }

  if (!session?.accessToken) {
    redirect("/");
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 my-3 sm:px-8 sm:py-12 bg-card/60 rounded-2xl">
      <div className="fade-in-up space-y-4" style={{ animationDelay: "40ms" }}>
        <Link
          href="/articles"
          className="inline-flex rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:bg-accent"
        >
          Wróć do artykułów
        </Link>
        <div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Utwórz nowy artykuł
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            Podziel się swoją wiedzą ze społecznością. Artykuły mogą zawierać
            notatki, wyjaśnienia, przykłady i materiały do nauki powiązane z
            wybranymi tematami.
          </p>
        </div>
      </div>

      <div className="fade-in-up space-y-6" style={{ animationDelay: "80ms" }}>
        <ArticleCreateForm />
      </div>
    </section>
  );
}
