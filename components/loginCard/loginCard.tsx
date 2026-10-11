"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import TermsDialog from "@/components/terms/termsDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { type AuthMode, createHandleCredentialsSignIn, type LoginError } from "./loginCardController";

const fieldLabel = "text-sm font-medium text-foreground";

export default function LoginCard() {
  const t = useTranslations("login");
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const actionLabel = t(`modes.${mode}`);
  const otherMode: AuthMode = mode === "login" ? "register" : "login";
  const handleCredentialsSignIn = createHandleCredentialsSignIn({
    mode,
    email,
    password,
    name,
    acceptedTerms,
    isLoading,
    setError,
    setIsLoading,
    router,
  });

  return (
    <section className="w-full max-w-sm rounded-sm border border-border bg-card p-6 sm:p-8">
      <h2 className="title-section text-foreground">{actionLabel}</h2>

      <form onSubmit={handleCredentialsSignIn} className="mt-6 grid gap-4">
        {mode === "register" ? (
          <div className="grid gap-1.5">
            <label htmlFor="name" className={fieldLabel}>
              {t("name")}
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className="h-10"
            />
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <label htmlFor="email" className={fieldLabel}>
            {t("email")}
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            className="h-10"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="password" className={fieldLabel}>
            {t("password")}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="h-10"
          />
        </div>

        {mode === "register" ? (
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="accept-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-0.5"
            />
            <p className="text-sm leading-5 text-foreground">
              <label htmlFor="accept-terms">{t("acceptTerms")}</label>
              <span aria-hidden> · </span>
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="font-medium text-link underline-offset-[3px] hover:underline"
              >
                {t("readTerms")}
              </button>
            </p>
          </div>
        ) : null}

        <Button type="submit" disabled={isLoading} className="mt-2 h-10 justify-self-start px-6">
          {isLoading ? `${actionLabel}…` : actionLabel}
        </Button>
      </form>

      <TermsDialog open={isTermsOpen} onOpenChange={setIsTermsOpen} onAccept={() => setAcceptedTerms(true)} />

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {t(`errors.${error.key}`, error.values)}
        </p>
      ) : null}

      <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
        {t(`switch.${otherMode}`)}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(otherMode);
            setError(null);
          }}
          className="font-medium text-link underline-offset-[3px] hover:underline"
        >
          {t(`modes.${otherMode}`)}
        </button>
      </p>
    </section>
  );
}
