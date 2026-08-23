import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnuncioForm from "@/components/AnuncioForm";
import { nombreCategoria } from "@/lib/categorias";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const admin = createAdminClient();
  const { data: anuncio } = await admin
    .from("anuncios")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!anuncio) notFound();

  const { count: anunciosActivosCategoria } = await admin
    .from("anuncios")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("categoria", anuncio.categoria)
    .eq("activo", true);

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
        anunciosActivosCategoria={anunciosActivosCategoria || 0}
        anuncioExistente={anuncio}
      />
    </main>
  );
}

