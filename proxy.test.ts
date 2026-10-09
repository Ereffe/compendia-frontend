// @vitest-environment node
import { NextRequest } from "next/server";
import { decode, encode } from "next-auth/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({ serverBackendUrl: "http://backend" }));

const SECRET = "test-secret";
const COOKIE = "next-auth.session-token";
const fetchMock = vi.fn();

const fakeJwt = (expiresInMs: number, label: string) => {
    const payload = Buffer.from(JSON.stringify({ exp: Math.floor((Date.now() + expiresInMs) / 1000), label })).toString("base64url");
    return `header.${payload}.signature`;
};

const sessionCookie = (overrides: Record<string, unknown> = {}) =>
    encode({
        secret: SECRET,
        token: {
            sub: "u1",
            name: "Ala",
            accessToken: "old-access",
            refreshToken: "old-refresh",
            accessTokenExpires: Date.now() + 10 * 60_000,
            ...overrides,
        },
    });

const request = (cookie?: string, path = "/articles") =>
    new NextRequest(`http://localhost:3000${path}`, {
        headers: cookie ? { cookie: `NEXT_LOCALE=pl; ${COOKIE}=${cookie}` } : {},
    });

const refreshResponse = (label: string) =>
    new Response(JSON.stringify({ accessToken: fakeJwt(15 * 60_000, label), refreshToken: `refresh-${label}` }), { status: 200 });

const loadProxy = async () => (await import("./proxy")).default;

beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXTAUTH_SECRET", SECRET);
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe("proxy", () => {
    it("sends visitors without a session to the landing page", async () => {
        const proxy = await loadProxy();

        const response = await proxy(request());

        expect(response.headers.get("location")).toBe("http://localhost:3000/");
    });

    it("lets a fresh session through without touching the backend", async () => {
        const proxy = await loadProxy();

        const response = await proxy(request(await sessionCookie()));

        expect(response.headers.get("x-middleware-next")).toBe("1");
        expect(response.cookies.get(COOKIE)).toBeUndefined();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("refreshes an expiring token and passes the new cookie to the browser and to this request", async () => {
        fetchMock.mockResolvedValue(refreshResponse("new"));
        const proxy = await loadProxy();

        const response = await proxy(request(await sessionCookie({ accessTokenExpires: Date.now() + 30_000 })));

        expect(fetchMock).toHaveBeenCalledWith("http://backend/auth/refresh?t=old-refresh", expect.anything());
        const cookie = response.cookies.get(COOKIE);
        expect(cookie?.httpOnly).toBe(true);
        const refreshed = await decode({ secret: SECRET, token: cookie?.value });
        expect(refreshed).toMatchObject({ sub: "u1", refreshToken: "refresh-new" });
        expect(refreshed?.accessTokenExpires).toBeGreaterThan(Date.now() + 14 * 60_000);
        expect(response.headers.get("x-middleware-request-cookie")).toContain(`${COOKIE}=${cookie?.value}`);
        expect(response.headers.get("x-middleware-request-cookie")).toContain("NEXT_LOCALE=pl");
    });

    it("shares one backend refresh between requests sent at the same time", async () => {
        fetchMock.mockResolvedValue(refreshResponse("shared"));
        const proxy = await loadProxy();
        const cookie = await sessionCookie({ accessTokenExpires: Date.now() - 1000 });

        await Promise.all([proxy(request(cookie)), proxy(request(cookie, "/profile")), proxy(request(cookie, "/api/assets/x"))]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("ends an expired session whose refresh token was rejected", async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
        const proxy = await loadProxy();

        const response = await proxy(request(await sessionCookie({ accessTokenExpires: Date.now() - 1000 })));

        expect(response.headers.get("location")).toBe("http://localhost:3000/session-expired");
    });

    it("keeps a still-valid token when an early refresh fails", async () => {
        fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
        const proxy = await loadProxy();

        const response = await proxy(request(await sessionCookie({ accessTokenExpires: Date.now() + 30_000 })));

        expect(response.headers.get("x-middleware-next")).toBe("1");
        expect(response.cookies.get(COOKIE)).toBeUndefined();
    });

    it("sends a session already marked as failed to /session-expired", async () => {
        const proxy = await loadProxy();

        const response = await proxy(request(await sessionCookie({ error: "RefreshAccessTokenError" })));

        expect(response.headers.get("location")).toBe("http://localhost:3000/session-expired");
    });
});
