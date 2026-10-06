export const locales = ["pl", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pl";

// The chosen language lives in a cookie, so URLs stay the same in every language.
export const LOCALE_COOKIE = "NEXT_LOCALE";

// Fixed so server and client format dates identically (avoids hydration mismatches).
export const timeZone = "Europe/Warsaw";

export const isLocale = (value: unknown): value is Locale =>
    typeof value === "string" && (locales as readonly string[]).includes(value);
