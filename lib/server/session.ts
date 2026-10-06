import "server-only";

import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { isAuthRejected, SESSION_EXPIRED_PATH } from "@/lib/graphqlErrors";
import { getServerClient } from "@/lib/server/apollo";

type SessionState = { accessToken: string | null; expired: boolean };

async function readToken() {
    return getToken({
        req: { cookies: await cookies(), headers: await headers() } as unknown as Parameters<typeof getToken>[0]["req"],
        secret: process.env.NEXTAUTH_SECRET,
    });
}

async function readSession(): Promise<SessionState> {
    const token = await readToken();

    if (!token) return { accessToken: null, expired: false };
    if (!token.accessToken || token.error === "RefreshAccessTokenError") return { accessToken: null, expired: true };
    return { accessToken: token.accessToken, expired: false };
}

export async function getAccessToken(): Promise<string | null> {
    return (await readSession()).accessToken;
}

export async function getCurrentUserId(): Promise<string | null> {
    const token = await readToken();
    return token?.sub ?? null;
}

export async function requireAccessToken(): Promise<string> {
    const { accessToken, expired } = await readSession();
    if (!accessToken) {
        redirect(expired ? SESSION_EXPIRED_PATH : "/");
    }
    return accessToken;
}

// Callers that catch errors from this must call unstable_rethrow(error) first, or the redirect is swallowed.
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

export async function authedQuery<TData, TVariables extends OperationVariables>(
    accessToken: string,
    query: TypedDocumentNode<TData, TVariables>,
    variables: TVariables = {} as TVariables,
): Promise<TData> {
    const result = await withSessionGuard(() =>
        getServerClient().query<TData, TVariables>({
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

export async function authedMutate<TData, TVariables extends OperationVariables>(
    accessToken: string,
    mutation: TypedDocumentNode<TData, TVariables>,
    variables: TVariables = {} as TVariables,
): Promise<TData> {
    const result = await withSessionGuard(() =>
        getServerClient().mutate<TData, TVariables>({
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
