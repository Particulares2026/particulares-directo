import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnuncioCard from "@/components/AnuncioCard";
import EliminarCuentaButton from "@/components/EliminarCuentaButton";
import { createAdminClient } from "@/lib/supabase/admin";
import { marcarTipoAnunciante } from "@/lib/tipo-anunciante";

export default async function MisAnunciosPage({
  searchParams,
}: {
  searchParams: { destacado?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: anuncios } = await admin
    .from("anuncios")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const anunciosConTipo = marcarTipoAnunciante(anuncios || []);
  const telefonoPerfil = (user.user_metadata as Record<string, unknown>)?.telefono;
  const perfilSinTelefono =
    typeof telefonoPerfil !== "string" || !/^\+\d{1,4}\s\d{6,12}$/.test(telefonoPerfil);

  return (
    <main className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-xl">📋 Tus anuncios</h1>
        <Link
          href="/publicar"
          className="text-sm bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white px-3 py-1.5 rounded-full hover:from-fuchsia-700 hover:to-pink-700 shadow-sm"
        >
          Publicar otro
        </Link>
      </div>

      {searchParams.destacado === "ok" && (
        <p className="text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 mb-4">
          Tu anuncio ya está destacado durante 24 horas.
        </p>
      )}
      {searchParams.destacado === "cancelado" && (
        <p className="text-sm text-stone-500 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 mb-4">
          La operación se ha cancelado y tu anuncio sigue como estaba.
        </p>
      )}

      {perfilSinTelefono && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Completa el teléfono de tu cuenta</p>
          <p className="mt-0.5 text-amber-800/80">
            Tu cuenta es anterior a este requisito. Añádelo para que tus próximos anuncios tengan los datos correctos.
          </p>
          <Link href="/mi-perfil" className="mt-2 inline-flex font-medium text-amber-900 underline">
            Completar mi perfil
          </Link>
        </div>
      )}

      {anunciosConTipo.length === 0 && (
        <p className="text-sm text-stone-400 py-10 text-center">
          Todavía no has publicado ningún anuncio.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {anunciosConTipo.map((a) => (
          <AnuncioCard key={a.id} anuncio={a} isOwner={true} />
        ))}
      </div>

      <EliminarCuentaButton />
    </main>
  );
}

