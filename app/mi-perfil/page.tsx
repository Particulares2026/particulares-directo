import { redirect } from "next/navigation";
import PerfilForm from "@/components/PerfilForm";
import { nombreCategoria } from "@/lib/categorias";
import { createClient } from "@/lib/supabase/server";

export default async function MiPerfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: anuncios } = await supabase
    .from("anuncios")
    .select("categoria")
    .eq("user_id", user.id)
    .eq("activo", true);

  const anunciosPorCategoria = new Map<string, number>();
  for (const anuncio of anuncios || []) {
    anunciosPorCategoria.set(
      anuncio.categoria,
      (anunciosPorCategoria.get(anuncio.categoria) || 0) + 1
    );
  }

  const metadata = user.user_metadata as Record<string, unknown>;
  const nombre = typeof metadata.nombre === "string" ? metadata.nombre : "";
  const telefono = typeof metadata.telefono === "string" ? metadata.telefono : "";

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-10">
      <h1 className="font-serif text-2xl">Mi perfil</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Mantén tus datos al día y consulta cómo aparece tu cuenta en cada categoría.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-fuchsia-100 bg-white p-5 shadow-sm" aria-labelledby="datos-cuenta">
          <h2 id="datos-cuenta" className="font-medium text-stone-900">Datos de la cuenta</h2>
          <div className="mt-4">
            <PerfilForm
              email={user.email || ""}
              nombreInicial={nombre}
              telefonoInicial={telefono}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5" aria-labelledby="tipo-cuenta">
          <h2 id="tipo-cuenta" className="font-medium text-violet-950">Particular o empresa</h2>
          <p className="mt-2 text-sm text-violet-900/80">
            La clasificación se calcula por categoría. Con un anuncio activo apareces como particular;
            con dos o más, como empresa.
          </p>

          {anunciosPorCategoria.size === 0 ? (
            <p className="mt-4 rounded-lg bg-white/70 px-3 py-2 text-sm text-violet-800">
              Todavía no tienes anuncios activos.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {[...anunciosPorCategoria.entries()]
                .sort(([a], [b]) => a.localeCompare(b, "es"))
                .map(([categoria, cantidad]) => {
                  const esEmpresa = cantidad > 1;
                  return (
                    <li key={categoria} className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 text-sm">
                      <span>{nombreCategoria(categoria)} · {cantidad} {cantidad === 1 ? "anuncio" : "anuncios"}</span>
                      <span className={esEmpresa ? "font-medium text-violet-800" : "font-medium text-stone-600"}>
                        {esEmpresa ? "🏢 Empresa" : "👤 Particular"}
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}

          <p className="mt-4 text-xs text-violet-800/70">
            No se realizará ningún cobro sin informar antes del precio y pedir una aceptación expresa.
          </p>
        </section>
      </div>
    </main>
  );
}
