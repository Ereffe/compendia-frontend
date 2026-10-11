// @vitest-environment node
import type { JWT } from "next-auth/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authOptions } from "./auth";

vi.mock("@/lib/config", () => ({ serverBackendUrl: "https://backend" }));

const fetchMock = vi.fn();

beforeEach(() => vi.stubGlobal("fetch", fetchMock));

afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

const authorize = (credentials: Record<string, string>) =>
    (authOptions.providers[0].options as { authorize: (c: Record<string, string>) => Promise<unknown> }).authorize(credentials);

describe("authOptions", () => {
    it("revokes the refresh token on sign-out", async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

        await authOptions.events?.signOut?.({ token: { refreshToken: "r1" } as JWT, session: null as never });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://backend/auth/logout",
            expect.objectContaining({ method: "POST", body: JSON.stringify({ refreshToken: "r1" }) }),
        );
    });

    it("reports a taken e-mail when registration answers 409", async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 409 }));

        await expect(authorize({ mode: "register", name: "Ala", email: "a@b.pl", password: "secret123" })).rejects.toThrow(
            "EmailTaken",
        );
    });

    it("rejects wrong credentials without an error code", async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

        await expect(authorize({ mode: "login", email: "a@b.pl", password: "secret123" })).resolves.toBeNull();
    });
});
