import { NextResponse, type NextRequest } from "next/server";

import { isSessionCookie } from "@/lib/sessionCookies";

export function GET(request: NextRequest) {
    const response = NextResponse.redirect(new URL("/?sessionExpired=1", request.url));

    for (const { name } of request.cookies.getAll()) {
        if (isSessionCookie(name)) {
            response.cookies.set(name, "", { path: "/", maxAge: 0, httpOnly: true, secure: name.startsWith("__Secure-") });
        }
    }

    response.headers.set("Cache-Control", "no-store");
    return response;
}
