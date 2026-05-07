import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SessionSync from "./sessionSync";

const setUser = vi.fn();
const setAccessToken = vi.fn();
const setLoading = vi.fn();
const setError = vi.fn();

const useSessionMock = vi.fn();

vi.mock("next-auth/react", () => ({
    useSession: () => useSessionMock(),
}));

vi.mock("@/hooks/stores/useAuthStore", () => ({
    useAuthStore: () => ({
        setUser,
        setAccessToken,
        setLoading,
        setError,
    }),
}));

describe("SessionSync", () => {
    it("marks the store as loading while the session is pending", () => {
        useSessionMock.mockReturnValue({ status: "loading", data: null });

        render(<SessionSync />);

        expect(setLoading).toHaveBeenCalledWith(true);
        expect(setUser).not.toHaveBeenCalled();
        expect(setAccessToken).not.toHaveBeenCalled();
    });

    it("syncs an authenticated session into the auth store", () => {
        const session = {
            user: { name: "Ala" },
            accessToken: "token-123",
        };

        useSessionMock.mockReturnValue({ status: "authenticated", data: session });

        render(<SessionSync />);

        expect(setUser).toHaveBeenCalledWith(session.user);
        expect(setAccessToken).toHaveBeenCalledWith("token-123");
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(setError).toHaveBeenCalledWith(null);
    });

    it("clears the store when the user is unauthenticated", () => {
        useSessionMock.mockReturnValue({ status: "unauthenticated", data: null });

        render(<SessionSync />);

        expect(setUser).toHaveBeenCalledWith(null);
        expect(setAccessToken).toHaveBeenCalledWith(null);
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(setError).toHaveBeenCalledWith(null);
    });

    it("surfaces refresh token errors", () => {
        useSessionMock.mockReturnValue({
            status: "authenticated",
            data: {
                user: { name: "Ala" },
                accessToken: "token-123",
                error: "RefreshAccessTokenError",
            },
        });

        render(<SessionSync />);

        expect(setError).toHaveBeenCalledWith("Sesja wygasła. Zaloguj się ponownie.");
    });
});