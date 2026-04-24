"use client";

import { type SyntheticEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";

export default function LoginCard() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signin">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actionLabel = mode === "login" ? "Zaloguj się" : "Zarejestruj się";

  const handleCredentialsSignIn = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (!email || !password || (mode === "signin" && !name.trim())) {
      setError(mode === "signin" ? "Wpisz imię, e-mail i hasło." : "Wpisz e-mail i hasło.");
      return;
    }

    setError(null);
    setIsLoading(true);

    void (async () => {
      try {
        const response = await signIn("credentials", {
          mode,
          name: name.trim(),
          email,
          password,
          callbackUrl: "/articles",
          redirect: false,
        });

        if (response?.ok || response?.url) {
          router.replace("/articles");
          router.refresh();
          return;
        }

        const session = await getSession();
        if (session) {
          router.replace("/articles");
          router.refresh();
          return;
        }

        if (response?.error === "CredentialsSignin") {
          setError(mode === "signin" ? "Rejestracja nie powiodła się. Spróbuj innego e-maila albo sprawdź logi backendu." : "Nieprawidłowy e-mail lub hasło.");
        } else {
          setError(response?.error ?? "Nieprawidłowy e-mail lub hasło.");
        }
      } catch {
        setError("Żądanie nie powiodło się. Sprawdź adres backendu i status serwera.");
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <section className="w-full max-w-md rounded-3xl border border-border/70 bg-card/85 p-6 shadow-[0_20px_80px_-42px_rgba(15,23,42,0.7)] backdrop-blur sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">Compendia</p>

      <div className="mt-4 inline-flex rounded-full border border-border bg-background p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
        >
          Zaloguj się
        </button>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
        >
          Zarejestruj się
        </button>
      </div>

      <h1 className="mt-3 text-3xl font-bold text-foreground">{actionLabel}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "login" ? "Wpisz e-mail i hasło, aby kontynuować." : "Utwórz konto, podając imię, e-mail i hasło."}
      </p>

      <form onSubmit={handleCredentialsSignIn} className="mt-6 space-y-3">
        {mode === "signin" ? (
          <>
            <label htmlFor="name" className="text-sm font-medium text-foreground/90">
              Imię
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Twoje imię"
              autoComplete="name"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </>
        ) : null}

        <label htmlFor="email" className="text-sm font-medium text-foreground/90">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="student@uczelnia.edu"
          autoComplete="email"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />

        <label htmlFor="password" className="text-sm font-medium text-foreground/90">
          Hasło
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Wpisz hasło"
          autoComplete="current-password"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? `${actionLabel}...` : actionLabel}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}