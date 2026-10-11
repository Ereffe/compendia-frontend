// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { isSessionCookie } from "@/lib/sessionCookies";
import { GET } from "./route";

describe("GET /session-expired", () => {
    it("clears the session cookie (including chunks) and redirects to the landing page", () => {
        const request = new NextRequest("http://localhost:3000/session-expired", {
            headers: {
                cookie: "next-auth.session-token.0=a; next-auth.session-token.1=b; next-auth.csrf-token=keep; NEXT_LOCALE=en",
            },
        });

        const response = GET(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe("http://localhost:3000/?sessionExpired=1");
        expect(response.headers.get("cache-control")).toBe("no-store");

        const cleared = response.cookies.getAll().map((cookie) => cookie.name).sort();
        expect(cleared).toEqual(["next-auth.session-token.0", "next-auth.session-token.1"]);
        for (const cookie of response.cookies.getAll()) {
            expect(cookie.value).toBe("");
            expect(cookie.maxAge).toBe(0);
        }
    });
});

describe("isSessionCookie", () => {
    it.each([
        ["next-auth.session-token", true],
        ["next-auth.session-token.2", true],
        ["__Secure-next-auth.session-token", true],
        ["next-auth.csrf-token", false],
        ["next-auth.session-token-other", false],
        ["NEXT_LOCALE", false],
    ])("%s → %s", (name, expected) => {
        expect(isSessionCookie(name)).toBe(expected);
    });
});
