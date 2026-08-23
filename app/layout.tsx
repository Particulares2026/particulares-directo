import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BannerPublicidad from "@/components/BannerPublicidad";

const SITE_URL = "https://www.particularesdirecto.com";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Particulares Directo",
    template: "%s | Particulares Directo",
  },
  description: "Anuncios de vivienda y empleo entre particulares, sin intermediarios.",
  openGraph: {
    title: "Particulares Directo",
    description: "Anuncios de vivienda y empleo entre particulares, sin intermediarios.",
    url: SITE_URL,
    siteName: "Particulares Directo",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Particulares Directo",
    description: "Anuncios de vivienda y empleo entre particulares, sin intermediarios.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans bg-gradient-to-b from-fuchsia-50/40 via-white to-white text-stone-900 min-h-screen flex flex-col">
        <Header />
        <BannerPublicidad />
        <div className="flex-1">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
