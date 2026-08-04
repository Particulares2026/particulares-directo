import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Buscador from "@/components/Buscador";
import FiltrosInmobiliaria from "@/components/FiltrosInmobiliaria";
import { esCategoriaValida, nombreCategoria } from "@/lib/categorias";

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
    .order("created_at", { ascending: false })
    .limit(500);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let favoritosIniciales: string[] = [];
  if (user && params.slug === "inmobiliaria") {
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

      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="font-serif text-2xl">{nombreCategoria(params.slug)}</h1>
        <Link
          href={`/publicar?categoria=${params.slug}`}
          className="text-sm bg-fuchsia-600 text-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-700 shrink-0"
        >
          Publicar anuncio
        </Link>
      </div>

      {params.slug === "inmobiliaria" ? (
        <FiltrosInmobiliaria
          anuncios={anuncios || []}
          currentUserId={user?.id ?? null}
          favoritosIniciales={favoritosIniciales}
        />
      ) : (
        <Buscador anuncios={anuncios || []} currentUserId={user?.id ?? null} />
      )}
    </main>
  );
}
