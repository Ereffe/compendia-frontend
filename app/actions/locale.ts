"use server";

import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE } from "@/i18n/config";

export async function setLocaleAction(locale: string): Promise<void> {
    if (!isLocale(locale)) return;

    // Setting a cookie in a Server Action makes Next re-render the current route,
    // so the page comes back in the new language without a client-side refresh.
    (await cookies()).set(LOCALE_COOKIE, locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
    });
}
