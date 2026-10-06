"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { MAX_EMAIL_LENGTH } from "@/lib/account";
import type { ErrorKey } from "@/types/errors";
import { createHandleEmailConfirm, createHandlePasswordConfirm, type FormStatus } from "./accountController";

const fieldLabel = "text-sm font-medium text-foreground";

function ActionSheet({ title, description, children }: Readonly<{ title: string; description: string; children: ReactNode }>) {
  const t = useTranslations("accountAction");
  return (
    <div className="sheet mx-auto w-full max-w-lg">
      <div className="px-5 pb-2 pt-6 sm:px-8 sm:pt-8">
        <h1 className="font-serif text-3xl font-medium leading-tight tracking-[-0.02em]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="px-5 py-6 sm:px-8">{children}</div>
      <p className="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-8">{t("linkHint")}</p>
    </div>
  );
}

function ActionDone({ message, href, linkLabel }: Readonly<{ message: string; href: string; linkLabel: string }>) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="flex items-start gap-2 text-sm leading-6" role="status">
        <CircleCheck className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
        {message}
      </p>
      <Button asChild>
        <Link href={href}>{linkLabel}</Link>
      </Button>
    </div>
  );
}

function FormFooter({ error, pending, label, pendingLabel }: Readonly<{ error: ErrorKey | null; pending: boolean; label: string; pendingLabel: string }>) {
  const tErrors = useTranslations("errors");
  return (
    <>
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {tErrors(error)}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner className="size-4" /> : null}
        {pending ? pendingLabel : label}
      </Button>
    </>
  );
}

export function ConfirmEmailChangeForm({ actionId }: Readonly<{ actionId: string }>) {
  const t = useTranslations("accountAction");
  const { status: sessionStatus, update } = useSession();
  const signedIn = sessionStatus === "authenticated";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<ErrorKey | null>(null);

  const handleSubmit = createHandleEmailConfirm({
    actionId,
    email,
    status,
    setStatus,
    setError,
    onConfirmed: () => {
      if (signedIn) void update();
    },
  });

  return (
    <ActionSheet title={t("email.title")} description={t("email.description")}>
      {status === "done" ? (
        <ActionDone
          message={t("email.done")}
          href={signedIn ? "/profile" : "/"}
          linkLabel={signedIn ? t("goToAccount") : t("goToSignIn")}
        />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid gap-2">
            <label htmlFor="confirm-email" className={fieldLabel}>
              {t("email.label")}
            </label>
            <Input
              id="confirm-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={MAX_EMAIL_LENGTH}
              autoComplete="email"
              aria-invalid={error ? true : undefined}
              className="bg-background"
            />
          </div>
          <FormFooter error={error} pending={status === "pending"} label={t("email.submit")} pendingLabel={t("email.submitting")} />
        </form>
      )}
    </ActionSheet>
  );
}

export function ConfirmPasswordChangeForm({ actionId }: Readonly<{ actionId: string }>) {
  const t = useTranslations("accountAction");
  const { status: sessionStatus } = useSession();
  const signedIn = sessionStatus === "authenticated";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<ErrorKey | null>(null);

  const handleSubmit = createHandlePasswordConfirm({ actionId, password, confirmation, status, setStatus, setError });

  return (
    <ActionSheet title={t("password.title")} description={t("password.description")}>
      {status === "done" ? (
        <ActionDone
          message={t("password.done")}
          href={signedIn ? "/profile" : "/"}
          linkLabel={signedIn ? t("goToAccount") : t("goToSignIn")}
        />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid gap-2">
            <label htmlFor="new-password" className={fieldLabel}>
              {t("password.label")}
            </label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              aria-invalid={error ? true : undefined}
              className="bg-background"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="confirm-password" className={fieldLabel}>
              {t("password.confirmLabel")}
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              aria-invalid={error ? true : undefined}
              className="bg-background"
            />
          </div>
          <FormFooter
            error={error}
            pending={status === "pending"}
            label={t("password.submit")}
            pendingLabel={t("password.submitting")}
          />
        </form>
      )}
    </ActionSheet>
  );
}
