import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Buscador from "@/components/Buscador";
import FiltrosInmobiliaria from "@/components/FiltrosInmobiliaria";
import FiltrosTrabajo from "@/components/FiltrosTrabajo";
import { esCategoriaValida, nombreCategoria } from "@/lib/categorias";
import { estaDestacado } from "@/lib/destacar";

export default async function CategoriaPage({
  params,
}: {
  params: { slug: string };
}) {
  if (!esCategoriaValida(params.slug)) notFound();

  const supabase = createClient();

  const { data: anuncios } = await supabase
    .from("anuncios")
    .select("*")
    .eq("categoria", params.slug)
    .eq("activo", true)
    .order("created_at", { ascending: false })
    .limit(500);

  const anunciosOrdenados = [...(anuncios || [])].sort((a, b) => {
    const destacadoA = estaDestacado(a.destacado_hasta);
    const destacadoB = estaDestacado(b.destacado_hasta);
    if (destacadoA !== destacadoB) return destacadoA ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let favoritosIniciales: string[] = [];
  if (user) {
    const { data: favoritos } = await supabase
      .from("favoritos")
      .select("anuncio_id")
      .eq("user_id", user.id);
    favoritosIniciales = (favoritos || []).map((f) => f.anuncio_id);
  }

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
        ← Todas las categorías
      </Link>

      <div className="flex flex-wrap items-center justify-between mt-2 mb-6 gap-2">
        <h1 className="font-serif text-2xl">{nombreCategoria(params.slug)}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {params.slug === "inmobiliaria" && (
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
            href={`/publicar?categoria=${params.slug}`}
            className="text-sm bg-fuchsia-600 text-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-700"
          >
            Publicar anuncio
          </Link>
        </div>
      </div>

      {params.slug === "inmobiliaria" ? (
        <FiltrosInmobiliaria
          anuncios={anunciosOrdenados}
          currentUserId={user?.id ?? null}
          userEmail={user?.email ?? null}
          favoritosIniciales={favoritosIniciales}
        />
      ) : params.slug === "trabajo" ? (
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
