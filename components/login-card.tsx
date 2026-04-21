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
  const actionLabel = mode === "login" ? "Log in" : "Sign in";

  const handleCredentialsSignIn = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (!email || !password || (mode === "signin" && !name.trim())) {
      setError(mode === "signin" ? "Please enter name, email, and password." : "Please enter both email and password.");
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
          setError(mode === "signin" ? "Sign in failed. Try another email or check backend logs." : "Invalid email or password.");
        } else {
          setError(response?.error ?? "Invalid email or password.");
        }
      } catch {
        setError("Request failed. Check backend URL and server status.");
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
          className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          Sign in
        </button>
      </div>

      <h1 className="mt-3 text-3xl font-bold text-foreground">{actionLabel}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "login" ? "Enter your email and password to continue." : "Create your account with name, email, and password."}
      </p>

      <form onSubmit={handleCredentialsSignIn} className="mt-6 space-y-3">
        {mode === "signin" ? (
          <>
            <label htmlFor="name" className="text-sm font-medium text-foreground/90">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </>
        ) : null}

        <label htmlFor="email" className="text-sm font-medium text-foreground/90">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="student@university.edu"
          autoComplete="email"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />

        <label htmlFor="password" className="text-sm font-medium text-foreground/90">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
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