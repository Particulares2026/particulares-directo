import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnuncioForm from "@/components/AnuncioForm";
import { CATEGORIAS_DESTACADAS, esCategoriaValida, nombreCategoria } from "@/lib/categorias";

export default async function PublicarPage({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const categoria = searchParams.categoria;

  if (!categoria || !esCategoriaValida(categoria)) {
    return (
      <main className="max-w-2xl mx-auto px-4 md:px-8 py-10">
        <h1 className="font-serif text-xl mb-1">Publicar un anuncio</h1>
        <p className="text-sm text-stone-500 mb-6">
          Elige primero en qué categoría quieres publicar.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIAS_DESTACADAS.map((c) => (
            <Link
              key={c.slug}
              href={`/publicar?categoria=${c.slug}`}
              className="border border-stone-200 rounded-xl px-4 py-6 text-center font-medium text-stone-800 hover:border-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      <h1 className="font-serif text-xl mb-1">Publicar en {nombreCategoria(categoria)}</h1>
      <p className="text-sm text-stone-500 mb-6">
        Se publicará con tu nombre y el medio de contacto que elijas.
      </p>
      <AnuncioForm
        userId={user.id}
        categoria={categoria}
        defaultNombre={(user.user_metadata as any)?.nombre || ""}
        defaultTelefono={(user.user_metadata as any)?.telefono || ""}
        defaultEmail={user.email || ""}
      />
    </main>
  );
}

