import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac } from "crypto";

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

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return jsonPrivado({ error: "El servicio no está disponible." }, 503);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonPrivado({ error: "El servicio no está disponible." }, 503);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "desconocida";
  const ipAnonimizada = createHmac("sha256", serviceKey).update(ip).digest("hex");
  const desde = new Date(Date.now() - VENTANA_MS).toISOString();

  const [total, mismoAnuncio] = await Promise.all([
    admin
      .from("revelaciones_contacto")
      .select("id", { count: "exact", head: true })
      .eq("ip", ipAnonimizada)
      .gte("created_at", desde),
    admin
      .from("revelaciones_contacto")
      .select("id", { count: "exact", head: true })
      .eq("ip", ipAnonimizada)
      .eq("anuncio_id", id)
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
    .eq("id", id)
    .eq("activo", true)
    .single();

  if (!anuncio) {
    return jsonPrivado({ error: "Anuncio no encontrado." }, 404);
  }

  const { error: errorRegistro } = await admin
    .from("revelaciones_contacto")
    .insert({ ip: ipAnonimizada, anuncio_id: id });
  if (errorRegistro) {
    return jsonPrivado({ error: "No se pudo registrar la petición de forma segura." }, 503);
  }

  return jsonPrivado({
    telefono_contacto: anuncio.mostrar_telefono !== false ? anuncio.telefono_contacto : null,
    email_contacto: anuncio.mostrar_email ? anuncio.email_contacto : null,
  });
}
