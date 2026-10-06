const SESSION_COOKIE_PREFIXES = ["next-auth.session-token", "__Secure-next-auth.session-token"];

export const isSessionCookie = (name: string): boolean =>
    SESSION_COOKIE_PREFIXES.some((prefix) => name === prefix || name.startsWith(`${prefix}.`));
