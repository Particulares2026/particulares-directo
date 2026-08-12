import type { MetadataRoute } from "next";
import { CATEGORIAS } from "@/lib/categorias";

const SITE_URL = "https://www.particularesdirecto.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const paginasFijas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/publicar`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/aviso-legal`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const paginasCategorias: MetadataRoute.Sitemap = CATEGORIAS.map((c) => ({
    url: `${SITE_URL}/categoria/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...paginasFijas, ...paginasCategorias];
}
