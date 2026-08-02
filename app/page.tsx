import { createClient } from "@/lib/supabase/server";
import Buscador from "@/components/Buscador";

export default async function HomePage() {
  const supabase = createClient();

  const { data: anuncios } = await supabase
    .from("anuncios")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <h1 className="font-serif text-2xl mb-1">Anuncios de empleo entre particulares</h1>
      <p className="text-stone-500 text-sm mb-6">
        Sin agencias ni intermediarios. Publica tu anuncio o encuentra el que buscas.
      </p>
      <Buscador anuncios={anuncios || []} currentUserId={user?.id ?? null} />
    </main>
  );
}
