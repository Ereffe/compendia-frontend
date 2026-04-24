import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ArticleCreateForm from "@/components/articles/articleCreateForm";
import { authOptions } from "@/lib/auth";

const creationTips = [
    "Tytuł powinien jasno opisywać temat.",
    "Treść możesz zacząć od krótkiego wstępu i listy sekcji.",
    "Subject ID musi istnieć w bazie danych backendu.",
    "Complexity wybierz zgodnie z poziomem trudności materiału.",
];

export default async function CreateArticlePage() {
    const session = await getServerSession(authOptions);
    const hasAccess = Boolean(session?.accessToken) && session?.error !== "RefreshAccessTokenError";

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
                    <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Utwórz artykuł</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                        To jest przykładowa strona tworzenia artykułu. Formularz wysyła dane do backendu GraphQL i po utworzeniu
                        przekierowuje do nowego wpisu.
                    </p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                <ArticleCreateForm />

                <aside className="fade-in-up h-fit rounded-3xl border border-border/70 bg-card/80 p-6 backdrop-blur" style={{ animationDelay: "120ms" }}>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground">Wskazówki</p>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                        {creationTips.map((tip) => (
                            <li key={tip} className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                                {tip}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 rounded-2xl border border-border/60 bg-teal-50/60 p-4 text-sm text-foreground dark:bg-teal-950/30">
                        <p className="font-semibold">Przykładowe wartości</p>
                        <p className="mt-2 text-muted-foreground">
                            Subject ID: 1, 2, 3 lub inny istniejący rekord. Complexity: SIMPLE, INTERMEDIATE albo COMPLEX.
                        </p>
                    </div>
                </aside>
            </div>
        </section>
    );
}
