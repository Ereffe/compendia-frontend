import { create } from "zustand";
import type { Session } from "next-auth";

interface AuthStore {
    user: Session["user"] | null;
    accessToken: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: Session["user"] | null) => void;
    setAccessToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    accessToken: null,
    isLoading: false,
    error: null,

    setUser: (user) => set({ user }),
    setAccessToken: (token) => set({ accessToken: token }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    logout: () => set({ user: null, accessToken: null, error: null }),
}));
