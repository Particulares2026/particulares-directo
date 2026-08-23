import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIAS_DESTACADAS } from "@/lib/categorias";

const SITE_URL = "https://www.particularesdirecto.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginasFijas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/calculadora-hipoteca`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/precios-m2`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/aviso-legal`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const paginasCategorias: MetadataRoute.Sitemap = CATEGORIAS_DESTACADAS.map((c) => ({
    url: `${SITE_URL}/categoria/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data: anuncios } = await supabase
      .from("anuncios")
      .select("id,created_at,fecha_activacion")
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(5000);

    const paginasAnuncios: MetadataRoute.Sitemap = (anuncios || []).map((anuncio) => ({
      url: `${SITE_URL}/anuncio/${anuncio.id}`,
      lastModified: new Date(anuncio.fecha_activacion || anuncio.created_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...paginasFijas, ...paginasCategorias, ...paginasAnuncios];
  } catch {
    return [...paginasFijas, ...paginasCategorias];
  }
}
