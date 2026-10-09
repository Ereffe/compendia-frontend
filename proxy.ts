import { type NextRequest, NextResponse } from "next/server";
import { encode, getToken } from "next-auth/jwt";

import { isAccessTokenFresh, SESSION_MAX_AGE_SECONDS, withFreshAccessToken } from "@/lib/auth";
import { SESSION_EXPIRED_PATH } from "@/lib/graphqlErrors";
import { isSessionCookie } from "@/lib/sessionCookies";

// Refresh early so a slow page render doesn't outlive the token it started with.
const REFRESH_MARGIN_MS = 60_000;
// Browsers drop cookies over 4096 bytes; next-auth would split them into chunks, which this proxy doesn't do.
const MAX_COOKIE_VALUE_LENGTH = 3800;

const sessionCookieName = (request: NextRequest): string => {
    const existing = request.cookies.getAll().find((cookie) => isSessionCookie(cookie.name));
    if (existing) return existing.name.replace(/\.\d+$/, "");
    return request.nextUrl.protocol === "https:" ? "__Secure-next-auth.session-token" : "next-auth.session-token";
};

const withSessionCookie = (request: NextRequest, value: string): NextResponse => {
    const name = sessionCookieName(request);
    const otherCookies = (request.headers.get("cookie") ?? "")
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part && !isSessionCookie(part.split("=")[0]));

    // Server components and Server Actions in this same request must already see the refreshed token.
    const headers = new Headers(request.headers);
    headers.set("cookie", [...otherCookies, `${name}=${value}`].join("; "));
    const response = NextResponse.next({ request: { headers } });

    for (const cookie of request.cookies.getAll()) {
        if (isSessionCookie(cookie.name) && cookie.name !== name) response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
    }
    response.cookies.set(name, value, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: name.startsWith("__Secure-"),
        maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
};

export default async function proxy(request: NextRequest) {
    const secret = process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req: request, secret });

    if (!token?.accessToken) return NextResponse.redirect(new URL("/", request.url));
    if (token.error === "RefreshAccessTokenError") return NextResponse.redirect(new URL(SESSION_EXPIRED_PATH, request.url));
    if (isAccessTokenFresh(token, REFRESH_MARGIN_MS)) return NextResponse.next();

    const refreshed = await withFreshAccessToken({ ...token }, REFRESH_MARGIN_MS);
    if (refreshed.error) {
        return isAccessTokenFresh(token, 0)
            ? NextResponse.next()
            : NextResponse.redirect(new URL(SESSION_EXPIRED_PATH, request.url));
    }

    const value = await encode({ token: refreshed, secret: secret ?? "", maxAge: SESSION_MAX_AGE_SECONDS });
    if (value.length > MAX_COOKIE_VALUE_LENGTH) {
        console.error("proxy: refreshed session cookie is too large to set");
        return NextResponse.next();
    }
    return withSessionCookie(request, value);
}

export const config = {
    matcher: ["/((?!$|login(?:/|$)|session-expired(?:/|$)|email-reset/|password-reset/|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
