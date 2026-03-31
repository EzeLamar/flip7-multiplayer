import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { LanguageProvider } from "@/components/language-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flip7 Online",
  description: "Card Boardgame multiplayer",
  authors: [{ name: "Ezequiel Lamarque" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#a855f7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Flip7" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          {children}
          <PWAInstallPrompt />
        </LanguageProvider>
      </body>
    </html>
  );
}
