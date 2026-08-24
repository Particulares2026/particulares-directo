import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esAdmin } from "@/lib/admin";
import { FOTOS_BUCKET, extraerPathStorage } from "@/lib/inmobiliaria";
import { createAdminClient } from "@/lib/supabase/admin";
import { esOrigenPermitido } from "@/lib/seguridad-request";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!esOrigenPermitido(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !esAdmin(user.email)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).id
    : null;
  if (typeof id !== "string" || !UUID.test(id)) {
    return NextResponse.json({ error: "Anuncio no válido." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "El servicio no está disponible." }, { status: 503 });
  }

  const { data: anuncio } = await admin.from("anuncios").select("fotos").eq("id", id).single();

  const { error } = await admin.from("anuncios").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar el anuncio." }, { status: 500 });
  }

  if (anuncio?.fotos && anuncio.fotos.length > 0) {
    const paths = anuncio.fotos.map(extraerPathStorage).filter((p: string | null): p is string => Boolean(p));
    if (paths.length > 0) await admin.storage.from(FOTOS_BUCKET).remove(paths);
  }

  return NextResponse.json({ ok: true });
}

