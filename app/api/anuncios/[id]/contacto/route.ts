import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac } from "crypto";
import { esOrigenPermitido } from "@/lib/seguridad-request";

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

  const { data, error } = await admin.rpc("registrar_revelacion_contacto", {
    p_ip: ipAnonimizada,
    p_anuncio_id: id,
    p_desde: desde,
    p_limite_total: LIMITE_REVELACIONES,
    p_limite_anuncio: LIMITE_POR_ANUNCIO,
  });

  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return jsonPrivado({ error: "No se pudo comprobar el límite de seguridad." }, 503);
  }
  const resultado = data as Record<string, unknown>;
  if (resultado.estado === "limite") {
    return jsonPrivado(
      { error: "Demasiadas peticiones seguidas. Inténtalo de nuevo más tarde." },
      429
    );
  }
  if (resultado.estado === "no_encontrado") {
    return jsonPrivado({ error: "Anuncio no encontrado." }, 404);
  }
  if (resultado.estado !== "permitido") {
    return jsonPrivado({ error: "No se pudo comprobar el límite de seguridad." }, 503);
  }

  return jsonPrivado({
    telefono_contacto:
      typeof resultado.telefono_contacto === "string" ? resultado.telefono_contacto : null,
    email_contacto:
      typeof resultado.email_contacto === "string" ? resultado.email_contacto : null,
  });
}

