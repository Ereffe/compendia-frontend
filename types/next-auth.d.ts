import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  // Tokens are intentionally absent: they never leave the server.
  interface Session {
    user?: DefaultSession["user"] & { id?: string };
    error?: string;
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
