"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

type AuthProviderProps = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
