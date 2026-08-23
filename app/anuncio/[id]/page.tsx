import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnuncioCard from "@/components/AnuncioCard";
import { CAMPOS_PUBLICOS_ANUNCIO } from "@/lib/anuncios";
import { nombreCategoria } from "@/lib/categorias";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = "https://www.particularesdirecto.com";

const obtenerAnuncio = cache(async (id: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("anuncios")
    .select(CAMPOS_PUBLICOS_ANUNCIO)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return { ...data, telefono_contacto: null, email_contacto: null };
});

function descripcionSeo(anuncio: NonNullable<Awaited<ReturnType<typeof obtenerAnuncio>>>) {
  const ubicacion = [anuncio.municipio, anuncio.provincia, anuncio.ubicacion].filter(Boolean).join(", ");
  const base = anuncio.descripcion?.trim() || `${nombreCategoria(anuncio.categoria)}${ubicacion ? ` en ${ubicacion}` : ""}. Contacta directamente con el anunciante.`;
  return base.replace(/\s+/g, " ").slice(0, 160);
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const anuncio = await obtenerAnuncio(params.id);
  if (!anuncio) return { title: "Anuncio no encontrado", robots: { index: false, follow: false } };

  const canonical = `${SITE_URL}/anuncio/${anuncio.id}`;
  const descripcion = descripcionSeo(anuncio);
  const foto = anuncio.fotos?.[0];

  return {
    title: anuncio.titulo,
    description: descripcion,
    alternates: { canonical },
    robots: { index: anuncio.activo !== false, follow: true },
    openGraph: {
      title: `${anuncio.titulo} | Particulares Directo`,
      description: descripcion,
      url: canonical,
      siteName: "Particulares Directo",
      locale: "es_ES",
      type: "article",
      images: foto ? [{ url: foto, alt: anuncio.titulo }] : undefined,
    },
    twitter: {
      card: foto ? "summary_large_image" : "summary",
      title: `${anuncio.titulo} | Particulares Directo`,
      description: descripcion,
      images: foto ? [foto] : undefined,
    },
  };
}

export default async function AnuncioPage({ params }: { params: { id: string } }) {
  const anuncio = await obtenerAnuncio(params.id);
  if (!anuncio) notFound();

  const supabase = createClient();
  const { count: anunciosActivosMismaCategoria } = await supabase
    .from("anuncios")
    .select("id", { count: "exact", head: true })
    .eq("user_id", anuncio.user_id)
    .eq("categoria", anuncio.categoria)
    .eq("activo", true);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const canonical = `${SITE_URL}/anuncio/${anuncio.id}`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: anuncio.titulo,
    description: descripcionSeo(anuncio),
    url: canonical,
    datePublished: anuncio.created_at,
    primaryImageOfPage: anuncio.fotos?.[0],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: nombreCategoria(anuncio.categoria),
          item: `${SITE_URL}/categoria/${anuncio.categoria}`,
        },
        { "@type": "ListItem", position: 3, name: anuncio.titulo, item: canonical },
      ],
    },
  }).replace(/</g, "\\u003c");

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <nav aria-label="Migas de pan" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-700">Inicio</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/categoria/${anuncio.categoria}`} className="hover:text-stone-700">
          {nombreCategoria(anuncio.categoria)}
        </Link>
      </nav>

      <AnuncioCard
        anuncio={{ ...anuncio, es_empresa: (anunciosActivosMismaCategoria || 0) > 1 }}
        isOwner={user?.id === anuncio.user_id}
        modoDetalle
      />

      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-labelledby="consejos-seguridad">
        <h2 id="consejos-seguridad" className="font-medium text-amber-900">Consejos para contactar con seguridad</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-amber-900/80 space-y-1">
          <li>No envíes dinero ni documentación sensible antes de verificar a la otra persona.</li>
          <li>Desconfía de ofertas demasiado buenas y utiliza lugares públicos cuando sea posible.</li>
          <li>Si detectas algo sospechoso, utiliza el buzón de contacto indicando el enlace de este anuncio.</li>
        </ul>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </main>
  );
}
