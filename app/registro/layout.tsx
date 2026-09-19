import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear una cuenta gratis | Particulares Directo",
  description:
    "Crea gratis tu cuenta en Particulares Directo para publicar anuncios de vivienda y empleo y contactar sin intermediarios.",
  alternates: {
    canonical: "https://www.particularesdirecto.com/registro",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RegistroLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
