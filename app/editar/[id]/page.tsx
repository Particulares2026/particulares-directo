import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnuncioForm from "@/components/AnuncioForm";
import { nombreCategoria } from "@/lib/categorias";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerUsuarioActualizado } from "@/lib/perfil";

export default async function EditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const usuarioActualizado = await obtenerUsuarioActualizado(user);

  const admin = createAdminClient();
  const { data: anuncio } = await admin
    .from("anuncios")
    .select("*")
    .eq("id", id)
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
        defaultNombre={(usuarioActualizado.user_metadata as any)?.nombre || ""}
        defaultTelefono={(usuarioActualizado.user_metadata as any)?.telefono || ""}
        defaultEmail={usuarioActualizado.email || user.email || ""}
        anunciosActivosCategoria={anunciosActivosCategoria || 0}
        anuncioExistente={anuncio}
      />
    </main>
  );
}
