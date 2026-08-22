import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LIMITE_REVELACIONES = 20;
const LIMITE_POR_ANUNCIO = 10;
const VENTANA_MS = 60 * 60 * 1000; // 1 hora
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonPrivado(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) {
    return jsonPrivado({ error: "Anuncio no válido." }, 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonPrivado({ error: "El servicio no está disponible." }, 503);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
  const desde = new Date(Date.now() - VENTANA_MS).toISOString();

  const [total, mismoAnuncio] = await Promise.all([
    admin
      .from("revelaciones_contacto")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", desde),
    admin
      .from("revelaciones_contacto")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("anuncio_id", params.id)
      .gte("created_at", desde),
  ]);

  if (total.error || mismoAnuncio.error) {
    return jsonPrivado({ error: "No se pudo comprobar el límite de seguridad." }, 503);
  }
  if ((total.count || 0) >= LIMITE_REVELACIONES || (mismoAnuncio.count || 0) >= LIMITE_POR_ANUNCIO) {
    return jsonPrivado(
      { error: "Demasiadas peticiones seguidas. Inténtalo de nuevo más tarde." },
      429
    );
  }

  const { data: anuncio } = await admin
    .from("anuncios")
    .select("telefono_contacto, email_contacto, mostrar_telefono, mostrar_email")
    .eq("id", params.id)
    .eq("activo", true)
    .single();

  if (!anuncio) {
    return jsonPrivado({ error: "Anuncio no encontrado." }, 404);
  }

  const { error: errorRegistro } = await admin
    .from("revelaciones_contacto")
    .insert({ ip, anuncio_id: params.id });
  if (errorRegistro) {
    return jsonPrivado({ error: "No se pudo registrar la petición de forma segura." }, 503);
  }

  return jsonPrivado({
    telefono_contacto: anuncio.mostrar_telefono !== false ? anuncio.telefono_contacto : null,
    email_contacto: anuncio.mostrar_email ? anuncio.email_contacto : null,
  });
}
