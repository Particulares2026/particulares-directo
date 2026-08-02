import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

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
  title: "Particulares Directo",
  description: "Anuncios de empleo entre particulares, sin intermediarios.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans bg-white text-stone-900 min-h-screen">
        <Header />
        {children}
      </body>
    </html>
  );
}
