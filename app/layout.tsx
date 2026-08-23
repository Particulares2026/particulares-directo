import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BannerPublicidad from "@/components/BannerPublicidad";

const SITE_URL = "https://www.particularesdirecto.com";
const SITE_DESCRIPTION =
  "Publica y encuentra anuncios de vivienda y empleo entre particulares, con contacto directo y sin intermediarios.";

const WEBSITE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Particulares Directo",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "es-ES",
};

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
    default: "Particulares Directo | Vivienda y empleo sin intermediarios",
    template: "%s | Particulares Directo",
  },
  applicationName: "Particulares Directo",
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "Particulares Directo",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Particulares Directo",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Particulares Directo",
    description: SITE_DESCRIPTION,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_STRUCTURED_DATA).replace(/</g, "\\u003c") }}
        />
        <Header />
        <BannerPublicidad />
        <div className="flex-1">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
