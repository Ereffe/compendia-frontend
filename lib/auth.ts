import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { serverBackendUrl } from "@/lib/config";

const refreshTokenGraceMs = 5_000;
const fallbackAccessTokenLifetimeMs = 14 * 60 * 1000;

type TokenResponse = {
  accessToken?: string;
  refreshToken?: string;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthMode = "login" | "register";

export const parseTokenExpiryMs = (token: string): number | null => {
  try {
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) return null;

    const normalized = payloadSegment.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf-8")) as { exp?: number };

    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const getAccessTokenExpiry = (accessToken: string) =>
  parseTokenExpiryMs(accessToken) ?? Date.now() + fallbackAccessTokenLifetimeMs;

const refreshAccessToken = async (refreshToken: string) => {
  // The backend only exposes refresh as GET with the token in the query string.
  const response = await fetch(`${serverBackendUrl}/auth/refresh?t=${encodeURIComponent(refreshToken)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Refresh token request failed");
  }

  const data = (await response.json()) as TokenResponse;

  if (!data.accessToken || !data.refreshToken) {
    throw new Error("Refresh token response missing tokens");
  }

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTokenExpires: getAccessTokenExpiry(data.accessToken),
  };
};

// Login/register only return tokens, so fetch the profile to get the real id and display name.
const fetchCurrentUser = async (accessToken: string): Promise<CurrentUser | null> => {
  try {
    const response = await fetch(`${serverBackendUrl}/graphql`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: "query CurrentUser { getCurrentUser { id name email } }" }),
    });

    if (!response.ok) return null;

    const body = (await response.json()) as { data?: { getCurrentUser?: CurrentUser | null } };
    return body.data?.getCurrentUser ?? null;
  } catch {
    return null;
  }
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        mode: { label: "Mode", type: "text" },
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const mode: AuthMode = credentials?.mode === "register" ? "register" : "login";
        const name = credentials?.name?.trim();
        const email = credentials?.email?.trim();
        const password = credentials?.password;

        if (!email || !password || (mode === "register" && !name)) {
          return null;
        }

        let response: Response;
        try {
          response = await fetch(`${serverBackendUrl}/auth/${mode}`, {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(mode === "register" ? { name, email, password } : { email, password }),
          });
        } catch {
          // Thrown messages are returned to the client as `signIn(...).error`.
          throw new Error("BackendUnavailable");
        }

        if (!response.ok) {
          // The backend answers 400 both for "wrong credentials" and "e-mail already taken".
          if (mode === "register" && response.status === 400) {
            throw new Error("EmailTaken");
          }
          return null;
        }

        const data = (await response.json()) as TokenResponse;
        if (!data.accessToken || !data.refreshToken) {
          return null;
        }

        const currentUser = await fetchCurrentUser(data.accessToken);

        return {
          id: currentUser?.id ?? email,
          email: currentUser?.email ?? email,
          name: currentUser?.name ?? name ?? email,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpires: getAccessTokenExpiry(data.accessToken),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.error = undefined;
      }

      const expiresAt = token.accessTokenExpires;

      if (token.accessToken && expiresAt && Date.now() < expiresAt - refreshTokenGraceMs) {
        return token;
      }

      if (!token.refreshToken) {
        token.error = "RefreshAccessTokenError";
        return token;
      }

      try {
        const refreshedToken = await refreshAccessToken(token.refreshToken);
        token.accessToken = refreshedToken.accessToken;
        token.refreshToken = refreshedToken.refreshToken;
        token.accessTokenExpires = refreshedToken.accessTokenExpires;
        token.error = undefined;
      } catch {
        token.error = "RefreshAccessTokenError";
      }

      return token;
    },

    // Tokens stay inside the encrypted JWT cookie. Server code reads them with
    // `getAccessToken()` (lib/server/session.ts), so the browser never receives them.
    async session({ session, token }) {
      session.error = token.error;
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
