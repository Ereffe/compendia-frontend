"use client";

import { type ComponentProps, useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginCard() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailSignInEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_SIGNIN === "true";

  const actionLabel = mode === "login" ? "Log in" : "Sign up";

  const handleProviderSignIn = async (provider: "google" | "github") => {
    setError(null);
    setIsLoading(true);

    const response = await signIn(provider, { callbackUrl: "/" });

    if (response?.error) {
      setError(`${actionLabel} failed. Please verify provider setup.`);
      setIsLoading(false);
    }
  };

  const handleEmailSignIn: NonNullable<ComponentProps<"form">["onSubmit"]> = async (event) => {
    event.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setError(null);
    setIsLoading(true);

    const response = await signIn("email", {
      email,
      callbackUrl: "/",
      redirect: false,
    });

    if (response?.ok) {
      setIsLoading(false);
      setError(`Check your inbox for the ${mode === "login" ? "log in" : "sign up"} link.`);
      return;
    }

    setError(`Email ${mode === "login" ? "log in" : "sign up"} failed. Configure the email provider in NextAuth.`);
    setIsLoading(false);
  };

  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-900/10 bg-white/85 p-6 shadow-[0_20px_80px_-42px_rgba(15,23,42,0.7)] backdrop-blur sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">Compendia Access</p>
      <div className="mt-4 inline-flex rounded-full border border-slate-900/15 bg-white p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mode === "login" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mode === "signup" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Sign up
        </button>
      </div>

      <h1 className="mt-3 text-3xl font-bold text-slate-950">{actionLabel} with</h1>
      <p className="mt-2 text-sm text-slate-600">
        Continue with your academic account to publish and read computer science articles.
      </p>

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={() => handleProviderSignIn("google")}
          disabled={isLoading}
          className="rounded-xl border border-slate-900/15 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel} with Google
        </button>
        <button
          type="button"
          onClick={() => handleProviderSignIn("github")}
          disabled={isLoading}
          className="rounded-xl border border-slate-900/15 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel} with GitHub
        </button>
      </div>

      {emailSignInEnabled ? (
        <>
          <div className="my-6 h-px bg-slate-900/10" />

          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Or {mode === "login" ? "log in" : "sign up"} with email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@university.edu"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-900/15 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send {mode === "login" ? "Login" : "Sign-up"} Link
            </button>
          </form>
        </>
      ) : (
        <p className="mt-6 text-xs text-slate-500">Email magic-link login is disabled. Enable NEXT_PUBLIC_ENABLE_EMAIL_SIGNIN=true to show it.</p>
      )}

      {error ? <p className="mt-4 text-sm text-slate-600">{error}</p> : null}
    </section>
  );
}