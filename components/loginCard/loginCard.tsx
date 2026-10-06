"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { type AuthMode, createHandleCredentialsSignIn, type LoginError } from "./loginCardController";

export default function LoginCard() {
  const t = useTranslations("login");
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const actionLabel = t(`modes.${mode}`);
  const descriptionLabel = t(`descriptions.${mode}`);
  const handleCredentialsSignIn = createHandleCredentialsSignIn({
    mode,
    email,
    password,
    name,
    isLoading,
    setError,
    setIsLoading,
    router,
  });

  return (
    <section className="w-full max-w-md rounded-3xl border border-border/70 bg-card/85 p-5 shadow-[0_20px_80px_-42px_rgba(15,23,42,0.7)] backdrop-blur sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">Compendia</p>

      <div className="mt-4 inline-flex rounded-full border border-border bg-background p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
        >
          {t("modes.login")}
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
        >
          {t("modes.register")}
        </button>
      </div>

      <h1 className="mt-3 text-3xl font-bold text-foreground">{actionLabel}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{descriptionLabel}</p>

      <form onSubmit={handleCredentialsSignIn} className="mt-6 space-y-3">
        {mode === "register" ? (
          <>
            <label htmlFor="name" className="text-sm font-medium text-foreground/90">
              {t("name")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              autoComplete="name"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </>
        ) : null}

        <label htmlFor="email" className="text-sm font-medium text-foreground/90">
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />

        <label htmlFor="password" className="text-sm font-medium text-foreground/90">
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t("passwordPlaceholder")}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
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

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {t(`errors.${error.key}`, error.values)}
        </p>
      ) : null}
    </section>
  );
}