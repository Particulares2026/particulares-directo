import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FOTOS_BUCKET } from "@/lib/inmobiliaria";
import { esOrigenPermitido } from "@/lib/seguridad-request";

const TAMANO_PAGINA = 100;

export async function POST(request: Request) {
  if (!esOrigenPermitido(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "No se puede eliminar la cuenta todavía, inténtalo más tarde." },
      { status: 503 }
    );
  }

  const bucket = admin.storage.from(FOTOS_BUCKET);
  const rutas: string[] = [];
  let offset = 0;
  while (true) {
    const { data: objetos, error: errorListado } = await bucket.list(user.id, {
      limit: TAMANO_PAGINA,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (errorListado) {
      return NextResponse.json(
        { error: "No se pudieron localizar todas tus fotos. La cuenta no se ha eliminado." },
        { status: 503 }
      );
    }

    const archivos = (objetos || []).filter((objeto) => objeto.id !== null);
    rutas.push(...archivos.map((archivo) => `${user.id}/${archivo.name}`));
    if ((objetos || []).length < TAMANO_PAGINA) break;
    offset += (objetos || []).length;
  }

  for (let inicio = 0; inicio < rutas.length; inicio += TAMANO_PAGINA) {
    const { error: errorBorrado } = await bucket.remove(rutas.slice(inicio, inicio + TAMANO_PAGINA));
    if (errorBorrado) {
      return NextResponse.json(
        { error: "No se pudieron borrar todas tus fotos. La cuenta no se ha eliminado." },
        { status: 503 }
      );
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar la cuenta." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

