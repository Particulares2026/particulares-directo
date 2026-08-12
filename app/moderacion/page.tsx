import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { esAdmin } from "@/lib/admin";
import PanelModeracion from "@/components/PanelModeracion";

export default async function ModeracionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !esAdmin(user.email)) redirect("/");

  const { data: anuncios } = await supabase
    .from("anuncios")
    .select("id, titulo, descripcion, categoria, tipo, nombre_contacto, telefono_contacto, email_contacto, activo, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <h1 className="font-serif text-2xl mb-1">Moderación</h1>
      <p className="text-sm text-stone-500 mb-6">
        Los 100 anuncios más recientes de todas las categorías, para revisarlos rápido.
      </p>
      <PanelModeracion anunciosIniciales={anuncios || []} />
    </main>
  );
}
