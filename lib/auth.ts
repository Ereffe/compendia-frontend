import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const backendBaseUrl = process.env.BACKEND_URL;

const refreshTokenGraceMs = 5_000;

const parseTokenExpiryMs = (token: string): number | null => {
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

const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch(`${backendBaseUrl}/auth/refresh?t=${encodeURIComponent(refreshToken)}`);

  if (!response.ok) {
    throw new Error("Refresh token request failed");
  }

  const data = (await response.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };

  if (!data.accessToken || !data.refreshToken) {
    throw new Error("Refresh token response missing tokens");
  }

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTokenExpires: parseTokenExpiryMs(data.accessToken) ?? Date.now() + 14 * 60 * 1000,
  };
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
        const mode = credentials?.mode === "signin" ? "signin" : "login";
        const name = credentials?.name?.trim();
        const email = credentials?.email?.trim();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        try {
          const endpoint = mode === "signin" ? "/auth/register" : "/auth/login";
          const payload = mode === "signin"
            ? { name: name || email, email, password }
            : { email, password };

          const response = await fetch(`${backendBaseUrl}${endpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            return null;
          }

          const data = (await response.json()) as {
            accessToken?: string;
            refreshToken?: string;
          };

          if (!data.accessToken || !data.refreshToken) {
            return null;
          }

          return {
            id: email,
            email,
            name: email,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            accessTokenExpires: parseTokenExpiryMs(data.accessToken) ?? Date.now() + 14 * 60 * 1000,
          };
        } catch {
          return null;
        }
      },
    }),
  ], callbacks: {
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

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
