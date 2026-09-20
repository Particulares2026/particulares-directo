import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonPrivado(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function esOrigenPermitido(request: Request) {
  const origen = request.headers.get("origin");
  if (!origen) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origen).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!esOrigenPermitido(request)) {
    return jsonPrivado({ error: "Origen no permitido." }, 403);
  }

  const { id } = await params;
  if (!UUID.test(id)) {
    return jsonPrivado({ error: "Anuncio no válido." }, 400);
  }

  const body = await request.json().catch(() => null);
  const accion = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).accion
    : null;
  if (accion !== "activar" && accion !== "desactivar") {
    return jsonPrivado({ error: "Acción no válida." }, 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonPrivado({ error: "No has iniciado sesión." }, 401);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonPrivado({ error: "El servicio no está disponible." }, 503);
  }

  const { data: anuncio, error: errorLectura } = await admin
    .from("anuncios")
    .select("id, activo")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (errorLectura) {
    return jsonPrivado({ error: "No se pudo comprobar el anuncio." }, 503);
  }
  if (!anuncio) {
    return jsonPrivado({ error: "No puedes gestionar este anuncio." }, 403);
  }

  if (accion === "desactivar") {
    const { error } = await admin
      .from("anuncios")
      .update({ activo: false })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return jsonPrivado({ error: "No se pudo desactivar el anuncio." }, 500);
    return jsonPrivado({ ok: true, activo: false });
  }

  const { error } = await admin
    .from("anuncios")
    .update({ activo: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    return jsonPrivado(
      { error: "No se pudo activar el anuncio." },
      500
    );
  }

  return jsonPrivado({ ok: true, activo: true });
}

