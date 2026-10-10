import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIAS_DESTACADAS } from "@/lib/categorias";

const SITE_URL = "https://www.particularesdirecto.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginasFijas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/registro`, changeFrequency: "monthly", priority: 0.7 },
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const paginasAnuncios: MetadataRoute.Sitemap = [];
  for (let inicio = 0; ; inicio += 500) {
    // Use anonymous access so RLS limits this list to publicly visible rows.
    const {data, error} = await supabase.from("anuncios").select("id")
      .eq("activo", true).order("id").range(inicio, inicio + 499);
    if (error) throw new Error("No se pudo generar el sitemap de anuncios.");
    for (const anuncio of data || []) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(anuncio.id))
        paginasAnuncios.push({url:`${SITE_URL}/anuncio/${anuncio.id}`});
    }
    if (paginasFijas.length + paginasCategorias.length + paginasAnuncios.length > 50000)
      throw new Error("El sitemap necesita dividirse antes de superar 50000 URLs.");
    if (!data || data.length < 500) break;
  }
  return [...paginasFijas, ...paginasCategorias, ...paginasAnuncios];
}