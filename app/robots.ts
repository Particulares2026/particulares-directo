import type { MetadataRoute } from "next";

const SITE_URL = "https://www.particularesdirecto.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/mis-anuncios", "/editar", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
