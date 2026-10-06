import { NextResponse, type NextRequest } from "next/server";

import { isSessionCookie } from "@/lib/sessionCookies";

/**
 * Reached when the backend rejects the user's token (see withSessionGuard in lib/server/session.ts)
 * or the token refresh failed. Server components can't modify cookies, so they redirect here: this
 * route deletes the session cookie and sends the user to the landing page with a message.
 */
export function GET(request: NextRequest) {
    const response = NextResponse.redirect(new URL("/?sessionExpired=1", request.url));

    for (const { name } of request.cookies.getAll()) {
        if (isSessionCookie(name)) {
            response.cookies.set(name, "", { path: "/", maxAge: 0, httpOnly: true, secure: name.startsWith("__Secure-") });
        }
    }

    // Never cache: the response depends on the request's cookies.
    response.headers.set("Cache-Control", "no-store");
    return response;
}
