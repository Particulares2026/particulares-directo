import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { esAdmin } from "@/lib/admin";
import PanelModeracion from "@/components/PanelModeracion";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  claveCuentaCategoria,
  contarActivosPorCuentaYCategoria,
  esEmpresaPorCantidad,
} from "@/lib/tipo-anunciante";

export default async function ModeracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !esAdmin(user.email)) redirect("/");

  const admin = createAdminClient();
  const [{ data: anuncios }, { data: anunciosActivos }, { data: denuncias }] = await Promise.all([
    admin
      .from("anuncios")
      .select("id, user_id, titulo, descripcion, categoria, tipo, nombre_contacto, telefono_contacto, email_contacto, activo, created_at, fotos")
      .is("moderado_at", null)
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("anuncios")
      .select("id, user_id, categoria, activo")
      .eq("activo", true),
    admin
      .from("denuncias_anuncios")
      .select(
        "id, anuncio_id, anuncio_titulo, anuncio_categoria, motivo, detalles, email_reportante, created_at"
      )
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const cuentasPorCategoria = contarActivosPorCuentaYCategoria(anunciosActivos || []);
  const anunciosConTipo = (anuncios || []).map((anuncio) => {
    const cantidad = cuentasPorCategoria.get(
      claveCuentaCategoria(anuncio.user_id, anuncio.categoria)
    ) || 0;
    return {
      ...anuncio,
      anuncios_activos_categoria: cantidad,
      es_empresa: esEmpresaPorCantidad(cantidad),
    };
  });

  const resumenMap = new Map<string, { cuentas: number; anuncios: number }>();
  for (const [clave, cantidad] of Array.from(cuentasPorCategoria.entries())) {
    if (!esEmpresaPorCantidad(cantidad)) continue;
    const categoria = clave.slice(clave.indexOf(":") + 1);
    const resumen = resumenMap.get(categoria) || { cuentas: 0, anuncios: 0 };
    resumenMap.set(categoria, {
      cuentas: resumen.cuentas + 1,
      anuncios: resumen.anuncios + cantidad,
    });
  }

  const resumenEmpresas = Array.from(resumenMap.entries())
    .map(([categoria, resumen]) => ({ categoria, ...resumen }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria, "es"));

  return (
    <main className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 py-8">
      <h1 className="font-serif text-2xl mb-1">🛡️ Moderación</h1>
      <p className="text-sm text-stone-500 mb-6">
        Anuncios pendientes de revisión. Al aceptar uno desaparecerá de esta lista.
      </p>
      <PanelModeracion
        anunciosIniciales={anunciosConTipo}
        resumenEmpresas={resumenEmpresas}
        denunciasIniciales={denuncias || []}
      />
    </main>
  );
}
