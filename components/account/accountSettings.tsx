"use client";

import { Check, LogOut, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import UserAvatar from "@/components/userAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { MAX_EMAIL_LENGTH, MAX_NAME_LENGTH } from "@/lib/account";
import type { ErrorKey } from "@/types/errors";
import type { AccountUser } from "@/types/users";
import {
  createHandleEmailRequest,
  createHandleNameSubmit,
  createHandlePasswordRequest,
  type FormStatus,
} from "./accountController";

const fieldLabel = "text-sm font-medium text-foreground";
const section = "grid gap-4 px-5 py-6 sm:px-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8";

export default function AccountSettings({ user }: Readonly<{ user: AccountUser }>) {
  const t = useTranslations("account");
  const [name, setName] = useState(user.name);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <aside className="sheet lg:sticky lg:top-6">
        <div className="flex items-center gap-4 px-5 py-6 lg:flex-col lg:items-start lg:gap-5">
          <UserAvatar userId={user.id} size={112} animated className="size-20 lg:size-28" />
          <div className="min-w-0">
            <p className="font-serif text-2xl font-medium leading-tight tracking-[-0.01em] wrap-anywhere">{name}</p>
            <p className="mt-1 text-sm text-muted-foreground wrap-anywhere">{user.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t(`roles.${user.role}`)}</p>
          </div>
        </div>
        <p className="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground">{t("avatarHint")}</p>
        <SignOutSection />
      </aside>

      <div className="sheet divide-y divide-border">
        <NameSection currentName={name} onSaved={setName} />
        <EmailSection currentEmail={user.email} />
        <PasswordSection email={user.email} />
      </div>
    </div>
  );
}

function SettingsSection({ title, description, children }: Readonly<{ title: string; description: string; children: ReactNode }>) {
  return (
    <section className={section}>
      <div>
        <h2 className="font-serif text-xl font-medium leading-snug">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground wrap-break-word">{description}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-3 md:pt-1">{children}</div>
    </section>
  );
}

function FormError({ error }: Readonly<{ error: ErrorKey | null }>) {
  const t = useTranslations("errors");
  if (!error) return null;
  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
      {t(error)}
    </p>
  );
}

function SuccessNote({ icon, children }: Readonly<{ icon: ReactNode; children: ReactNode }>) {
  return (
    <p className="flex items-start gap-2 text-sm leading-6 text-foreground" role="status">
      <span className="mt-1 text-primary">{icon}</span>
      <span className="min-w-0 wrap-anywhere">{children}</span>
    </p>
  );
}

function SubmitButton({ pending, label, pendingLabel }: Readonly<{ pending: boolean; label: string; pendingLabel: string }>) {
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Spinner className="size-4" /> : null}
      {pending ? pendingLabel : label}
    </Button>
  );
}

function NameSection({ currentName, onSaved }: Readonly<{ currentName: string; onSaved: (name: string) => void }>) {
  const t = useTranslations("account.name");
  const { update } = useSession();
  const [name, setName] = useState(currentName);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<ErrorKey | null>(null);

  const handleSubmit = createHandleNameSubmit({
    name,
    currentName,
    status,
    setStatus,
    setError,
    onSaved: (savedName) => {
      setName(savedName);
      onSaved(savedName);
      void update();
    },
  });

  return (
    <SettingsSection title={t("title")} description={t("description")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <label htmlFor="account-name" className={fieldLabel}>
          {t("label")}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="account-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setStatus("idle");
            }}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            aria-invalid={error ? true : undefined}
            className="bg-background"
          />
          <SubmitButton pending={status === "pending"} label={t("submit")} pendingLabel={t("submitting")} />
        </div>
        <FormError error={error} />
        {status === "done" ? <SuccessNote icon={<Check className="size-4" aria-hidden />}>{t("saved")}</SuccessNote> : null}
      </form>
    </SettingsSection>
  );
}

function EmailSection({ currentEmail }: Readonly<{ currentEmail: string }>) {
  const t = useTranslations("account.email");
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<ErrorKey | null>(null);

  const handleSubmit = createHandleEmailRequest({ email, currentEmail, status, setStatus, setError, setSentTo });

  return (
    <SettingsSection title={t("title")} description={t("description")}>
      <dl className="text-sm">
        <dt className="text-muted-foreground">{t("current")}</dt>
        <dd className="mt-0.5 font-medium wrap-anywhere">{currentEmail}</dd>
      </dl>
      {sentTo ? (
        <div className="flex flex-col items-start gap-2">
          <SuccessNote icon={<MailCheck className="size-4" aria-hidden />}>{t("sent", { email: sentTo })}</SuccessNote>
          <Button
            type="button"
            variant="link"
            className="h-auto px-0"
            onClick={() => {
              setSentTo(null);
              setStatus("idle");
            }}
          >
            {t("useAnother")}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <label htmlFor="account-email" className={fieldLabel}>
            {t("label")}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="account-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={MAX_EMAIL_LENGTH}
              autoComplete="email"
              aria-invalid={error ? true : undefined}
              className="bg-background"
            />
            <SubmitButton pending={status === "pending"} label={t("submit")} pendingLabel={t("submitting")} />
          </div>
          <FormError error={error} />
        </form>
      )}
    </SettingsSection>
  );
}

function PasswordSection({ email }: Readonly<{ email: string }>) {
  const t = useTranslations("account.password");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<ErrorKey | null>(null);

  const handleRequest = createHandlePasswordRequest({ status, setStatus, setError });

  return (
    <SettingsSection title={t("title")} description={t("description")}>
      {status === "done" ? (
        <SuccessNote icon={<MailCheck className="size-4" aria-hidden />}>{t("sent", { email })}</SuccessNote>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <Button type="button" variant="outline" disabled={status === "pending"} onClick={() => void handleRequest()} className="w-full sm:w-auto">
            {status === "pending" ? <Spinner className="size-4" /> : null}
            {status === "pending" ? t("submitting") : t("submit")}
          </Button>
          <FormError error={error} />
        </div>
      )}
    </SettingsSection>
  );
}

function SignOutSection() {
  const t = useTranslations("account.signOut");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setPending(true);
    await signOut({ redirect: false });
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-5">
      <div>
        <h2 className="text-sm font-medium">{t("title")}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("description")}</p>
      </div>
      <Button type="button" variant="outline" disabled={pending} onClick={() => void handleSignOut()} className="w-full">
        {pending ? <Spinner className="size-4" /> : <LogOut className="size-4" aria-hidden />}
        {pending ? t("submitting") : t("submit")}
      </Button>
    </div>
  );
}
