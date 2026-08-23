import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Particulares Directo",
    short_name: "Particulares",
    description:
      "Anuncios de vivienda y empleo entre particulares, con contacto directo y sin intermediarios.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ec1178",
    lang: "es",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
