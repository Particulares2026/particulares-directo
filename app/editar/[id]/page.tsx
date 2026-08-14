import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnuncioForm from "@/components/AnuncioForm";
import { nombreCategoria } from "@/lib/categorias";

export default async function EditarPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: anuncio } = await supabase
    .from("anuncios")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!anuncio) notFound();
  if (anuncio.user_id !== user.id) redirect("/mis-anuncios");

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      <h1 className="font-serif text-xl mb-1">Editar anuncio</h1>
      <p className="text-sm text-stone-500 mb-6">
        Estás editando tu anuncio de {nombreCategoria(anuncio.categoria)}.
      </p>
      <AnuncioForm
        userId={user.id}
        categoria={anuncio.categoria}
        defaultNombre={(user.user_metadata as any)?.nombre || ""}
        defaultTelefono={(user.user_metadata as any)?.telefono || ""}
        defaultEmail={user.email || ""}
        anuncioExistente={anuncio}
      />
    </main>
  );
}
