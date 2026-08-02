import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnuncioCard from "@/components/AnuncioCard";

export default async function MisAnunciosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: anuncios } = await supabase
    .from("anuncios")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-xl">Tus anuncios</h1>
        <Link
          href="/publicar"
          className="text-sm bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800"
        >
          Publicar otro
        </Link>
      </div>

      {(!anuncios || anuncios.length === 0) && (
        <p className="text-sm text-stone-400 py-10 text-center">
          Todavía no has publicado ningún anuncio.
        </p>
      )}

      <div className="space-y-3">
        {anuncios?.map((a) => (
          <AnuncioCard key={a.id} anuncio={a} isOwner={true} />
        ))}
      </div>
    </main>
  );
}
