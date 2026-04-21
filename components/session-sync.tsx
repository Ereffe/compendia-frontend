"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/hooks/stores/useAuthStore";

export default function SessionSync() {
    const { data: session, status } = useSession();
    const { setUser, setAccessToken, setLoading, setError } = useAuthStore();

    useEffect(() => {
        if (status === "loading") {
            setLoading(true);
        } else if (status === "authenticated" && session) {
            setUser(session.user);
            setAccessToken((session as any).accessToken || null);
            setLoading(false);
            setError(null);
        } else if (status === "unauthenticated") {
            setUser(null);
            setAccessToken(null);
            setLoading(false);
            setError(null);
        }

        if ((session as any)?.error === "RefreshAccessTokenError") {
            setError("Session expired. Please sign in again.");
        }
    }, [session, status, setUser, setAccessToken, setLoading, setError]);

    return null;
}
