import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import AuthProvider from "@/components/authProvider";
import "./globals.css";
import Header from "@/components/header";

const geistSans = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compendia",
  description: "Compendia porządkuje notatki, pomysły i projekty w jednym żyjącym centrum wiedzy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <main className="compendia-surface min-h-screen overflow-x-clip text-foreground">
            <div className="compendia-noise pointer-events-none fixed inset-0 -z-20" aria-hidden />
            <div className="compendia-grid pointer-events-none fixed inset-0 -z-10 opacity-25" aria-hidden />
            <Header hasAccess={true} />
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
