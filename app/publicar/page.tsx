import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnuncioForm from "@/components/AnuncioForm";

export default async function PublicarPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="max-w-sm mx-auto px-4 py-10">
      <h1 className="font-serif text-xl mb-1">Publicar un anuncio</h1>
      <p className="text-sm text-stone-500 mb-6">
        Se publicará con tu nombre y correo para que puedan contactarte.
      </p>
      <AnuncioForm
        userId={user.id}
        defaultNombre={(user.user_metadata as any)?.nombre || ""}
        defaultEmail={user.email || ""}
      />
    </main>
  );
}
