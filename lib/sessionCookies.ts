// next-auth stores the session JWT in this cookie, split into `.0`, `.1`, ... chunks when large.
// The `__Secure-` variant is used when NEXTAUTH_URL is https.
const SESSION_COOKIE_PREFIXES = ["next-auth.session-token", "__Secure-next-auth.session-token"];

export const isSessionCookie = (name: string): boolean =>
    SESSION_COOKIE_PREFIXES.some((prefix) => name === prefix || name.startsWith(`${prefix}.`));
