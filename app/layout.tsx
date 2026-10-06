import type { Metadata } from "next";
import { JetBrains_Mono, Newsreader, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import AuthProvider from "@/components/authProvider";
import Header from "@/components/header";
import SiteFooter from "@/components/siteFooter";
import "./globals.css";

const geistSans = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: "Compendia",
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={await getLocale()} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}
      >
        <NextIntlClientProvider>
        <AuthProvider>
          <div className="compendia-surface flex min-h-screen flex-col overflow-x-clip text-foreground">
            <div className="compendia-noise pointer-events-none fixed inset-0 -z-20" aria-hidden />
            <div className="compendia-grid pointer-events-none fixed inset-0 -z-10 opacity-25" aria-hidden />
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
            <SiteFooter />
          </div>
        </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
