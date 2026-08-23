import type { MetadataRoute } from "next";

const SITE_URL = "https://www.particularesdirecto.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api",
        "/editar",
        "/favoritos",
        "/login",
        "/mis-anuncios",
        "/moderacion",
        "/olvide-password",
        "/publicar",
        "/registro",
        "/restablecer-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
