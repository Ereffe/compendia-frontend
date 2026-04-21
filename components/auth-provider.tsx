"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import SessionSync from "@/components/session-sync";

type AuthProviderProps = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  return (
    <SessionProvider>
      <SessionSync />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
