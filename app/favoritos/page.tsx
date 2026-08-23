import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GestorFavoritos from "@/components/GestorFavoritos";
import { CAMPOS_PUBLICOS_ANUNCIO } from "@/lib/anuncios";

export default async function FavoritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: listas }, { data: favoritos }] = await Promise.all([
    supabase
      .from("listas_favoritos")
      .select("id, nombre")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("favoritos")
      .select(`anuncio_id, lista_id, anuncios(${CAMPOS_PUBLICOS_ANUNCIO})`)
      .eq("user_id", user.id),
  ]);

  return (
    <main className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 py-8">
      <h1 className="font-serif text-xl mb-1">❤️ Tus favoritos</h1>
      <p className="text-sm text-stone-500 mb-6">
        Agrúpalos en listas propias para organizarlos mejor.
      </p>
      <GestorFavoritos
        currentUserId={user.id}
        listasIniciales={listas || []}
        favoritosIniciales={(favoritos || []) as any}
      />
    </main>
  );
}
