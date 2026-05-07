import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12 sm:px-8">
      <div className="w-full text-center">
        <div
          className="fade-in-up space-y-6"
          style={{ animationDelay: "40ms" }}
        >
          <div className="space-y-2">
            <h1 className="text-6xl font-bold sm:text-7xl">404</h1>
            <p className="text-2xl font-semibold text-foreground">
              Artykuł nie znaleziony
            </p>
          </div>

          <p className="mx-auto max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
            Szukany artykuł nie istnieje lub został usunięty. Sprawdź adres URL
            lub przejdź do listy artykułów.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/articles"
              className="inline-flex rounded-lg border border-border/70 bg-teal-600 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-teal-700"
            >
              Wróć do artykułów
            </Link>
            <Link
              href="/articles/create"
              className="inline-flex rounded-lg border border-border/70 bg-card/80 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-accent"
            >
              Utwórz artykuł
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
