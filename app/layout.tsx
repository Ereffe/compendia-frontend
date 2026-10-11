import type { Metadata } from "next";
import { Source_Code_Pro, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import AuthProvider from "@/components/authProvider";
import Header from "@/components/header";
import NoticeToast from "@/components/noticeToast";
import SiteFooter from "@/components/siteFooter";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "latin-ext"],
});

const sourceCode = Source_Code_Pro({
  variable: "--font-source-code",
  subsets: ["latin", "latin-ext"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
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
        className={`${sourceSans.variable} ${sourceSerif.variable} ${sourceCode.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider>
        <AuthProvider>
          <div className="flex min-h-screen flex-col overflow-x-clip text-foreground">
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
            <SiteFooter />
            <Toaster position="bottom-right" />
            <Suspense fallback={null}>
              <NoticeToast />
            </Suspense>
          </div>
        </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
