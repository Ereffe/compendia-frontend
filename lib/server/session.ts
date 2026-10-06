import "server-only";

import type { OperationVariables } from "@apollo/client";
import type { DocumentNode } from "graphql";
import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { isAuthRejected, SESSION_EXPIRED_PATH } from "@/lib/graphqlErrors";
import { getServerClient } from "@/lib/server/apollo";

type SessionState = { accessToken: string | null; expired: boolean };

async function readSession(): Promise<SessionState> {
    const token = await getToken({
        // getToken only needs `cookies.getAll()` and `headers`, which Next's helpers provide.
        req: { cookies: await cookies(), headers: await headers() } as unknown as Parameters<typeof getToken>[0]["req"],
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) return { accessToken: null, expired: false };
    if (!token.accessToken || token.error === "RefreshAccessTokenError") return { accessToken: null, expired: true };
    return { accessToken: token.accessToken, expired: false };
}

/**
 * Reads the backend access token from the encrypted next-auth JWT cookie.
 * The token is deliberately NOT exposed through `useSession()`, so browser JavaScript never sees it.
 */
export async function getAccessToken(): Promise<string | null> {
    return (await readSession()).accessToken;
}

/**
 * For server components: returns the access token, or redirects. Signed-out visitors go to the
 * landing page; a session whose refresh failed goes to SESSION_EXPIRED_PATH, which clears the cookie
 * and shows a "session expired" message.
 */
export async function requireAccessToken(): Promise<string> {
    const { accessToken, expired } = await readSession();
    if (!accessToken) {
        redirect(expired ? SESSION_EXPIRED_PATH : "/");
    }
    return accessToken;
}

/**
 * Runs a backend call and, if the backend rejects the token, redirects to SESSION_EXPIRED_PATH.
 * Callers that wrap this in try/catch must call `unstable_rethrow(error)` first in their catch block,
 * or the redirect gets swallowed.
 */
async function withSessionGuard<T>(call: () => Promise<T>): Promise<T> {
    try {
        return await call();
    } catch (error) {
        if (isAuthRejected(error)) {
            redirect(SESSION_EXPIRED_PATH);
        }
        throw error;
    }
}

export const authContext = (accessToken: string) => ({
    headers: { Authorization: `Bearer ${accessToken}` },
});

/** Runs an authenticated query. GraphQL and network errors are thrown (Apollo's default errorPolicy). */
export async function authedQuery<TData>(
    accessToken: string,
    query: DocumentNode,
    variables: OperationVariables = {},
): Promise<TData> {
    const result = await withSessionGuard(() =>
        getServerClient().query<TData>({
            query,
            variables,
            context: authContext(accessToken),
            fetchPolicy: "no-cache",
        }),
    );

    if (!result.data) {
        throw new Error("Empty GraphQL response");
    }

    return result.data as TData;
}

/** Runs an authenticated mutation on behalf of the current user (for Server Actions). */
export async function authedMutate<TData>(
    accessToken: string,
    mutation: DocumentNode,
    variables: OperationVariables = {},
): Promise<TData> {
    const result = await withSessionGuard(() =>
        getServerClient().mutate<TData>({
            mutation,
            variables,
            context: authContext(accessToken),
            fetchPolicy: "no-cache",
        }),
    );

    if (!result.data) {
        throw new Error("Empty GraphQL response");
    }

    return result.data as TData;
}
