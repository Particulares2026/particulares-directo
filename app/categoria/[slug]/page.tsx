import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Buscador from "@/components/Buscador";
import FiltrosInmobiliaria from "@/components/FiltrosInmobiliaria";
import FiltrosTrabajo from "@/components/FiltrosTrabajo";
import { CATEGORIAS, esCategoriaValida, nombreCategoria } from "@/lib/categorias";
import { estaDestacado } from "@/lib/destacar";
import { CAMPOS_PUBLICOS_ANUNCIO } from "@/lib/anuncios";
import { marcarTipoAnunciante } from "@/lib/tipo-anunciante";

const SITE_URL = "https://www.particularesdirecto.com";

const DESCRIPCIONES: Record<string, string> = {
  inmobiliaria: "Viviendas en venta y alquiler anunciadas directamente por particulares, sin intermediarios.",
  trabajo: "Ofertas y búsquedas de empleo publicadas directamente por particulares y pequeños negocios.",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!esCategoriaValida(slug)) return {};
  const titulo = nombreCategoria(slug);
  const descripcion = DESCRIPCIONES[slug] ?? `Anuncios de ${titulo.toLowerCase()} entre particulares.`;
  const indexable = CATEGORIAS.find((categoria) => categoria.slug === slug)?.destacada === true;
  const canonical = `${SITE_URL}/categoria/${slug}`;

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical },
    robots: { index: indexable, follow: true },
    openGraph: {
      title: `${titulo} | Particulares Directo`,
      description: descripcion,
      url: canonical,
      type: "website",
      locale: "es_ES",
    },
    twitter: { card: "summary", title: `${titulo} | Particulares Directo`, description: descripcion },
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!esCategoriaValida(slug)) notFound();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: anuncios } = await supabase
    .from("anuncios")
    .select(CAMPOS_PUBLICOS_ANUNCIO)
    .eq("categoria", slug)
    .eq("activo", true)
    .order("created_at", { ascending: false })
    .limit(500);

  const anunciosOrdenados = marcarTipoAnunciante([...(anuncios || [])])
    .sort((a, b) => {
      const destacadoA = estaDestacado(a.destacado_hasta);
      const destacadoB = estaDestacado(b.destacado_hasta);
      if (destacadoA !== destacadoB) return destacadoA ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .map((a) => ({ ...a, telefono_contacto: null, email_contacto: null }));

  let favoritosIniciales: string[] = [];
  if (user) {
    const { data: favoritos } = await supabase
      .from("favoritos")
      .select("anuncio_id")
      .eq("user_id", user.id);
    favoritosIniciales = (favoritos || []).map((f) => f.anuncio_id);
  }

  return (
    <main className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 py-8">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
        ← Todas las categorías
      </Link>

      <div className="flex flex-wrap items-center justify-between mt-2 mb-2 gap-2">
        <h1 className="font-serif text-2xl">{nombreCategoria(slug)}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {slug === "inmobiliaria" && (
            <>
              <Link
                href="/calculadora-hipoteca"
                className="text-sm border border-stone-300 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50"
              >
                Calculadora de hipoteca
              </Link>
              <Link
                href="/precios-m2"
                className="text-sm border border-stone-300 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50"
              >
                Precio del m²
              </Link>
            </>
          )}
          <Link
            href={`/publicar?categoria=${slug}`}
            className="rounded-full bg-[#b00859] px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#900648]"
          >
            Publicar anuncio
          </Link>
        </div>
      </div>
      <p className="mb-6 max-w-3xl text-sm text-stone-600">
        {DESCRIPCIONES[slug] ?? "Anuncios de " + nombreCategoria(slug).toLowerCase() + " entre particulares."}
      </p>

      {slug === "inmobiliaria" ? (
        <FiltrosInmobiliaria
          anuncios={anunciosOrdenados}
          currentUserId={user?.id ?? null}
          userEmail={user?.email ?? null}
          favoritosIniciales={favoritosIniciales}
        />
      ) : slug === "trabajo" ? (
        <FiltrosTrabajo
          anuncios={anunciosOrdenados}
          currentUserId={user?.id ?? null}
          favoritosIniciales={favoritosIniciales}
        />
      ) : (
        <Buscador
          anuncios={anunciosOrdenados}
          currentUserId={user?.id ?? null}
          favoritosIniciales={favoritosIniciales}
        />
      )}
    </main>
  );
}
