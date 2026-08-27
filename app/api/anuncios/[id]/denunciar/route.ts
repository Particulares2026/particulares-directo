import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { esOrigenPermitido } from "@/lib/seguridad-request";

const LIMITE_DENUNCIAS = 5;
const VENTANA_MS = 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOTIVOS = new Set([
  "estafa",
  "ilegal",
  "ofensivo",
  "datos_personales",
  "duplicado",
  "categoria_incorrecta",
  "otro",
]);

function responder(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!esOrigenPermitido(request)) {
    return responder({ error: "Origen no permitido." }, 403);
  }

  const { id } = await params;
  if (!UUID.test(id)) {
    return responder({ error: "Anuncio no válido." }, 400);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return responder({ error: "Solicitud no válida." }, 400);
  }

  const { motivo, detalles, email, sitioWeb } = body as Record<string, unknown>;
  if (typeof sitioWeb === "string" && sitioWeb.trim()) {
    return responder({ ok: true }, 201);
  }
  if (typeof motivo !== "string" || !MOTIVOS.has(motivo)) {
    return responder({ error: "Selecciona un motivo válido." }, 400);
  }
  if (
    typeof detalles !== "string" ||
    detalles.trim().length < 10 ||
    detalles.trim().length > 1500
  ) {
    return responder(
      { error: "Explica el problema utilizando entre 10 y 1500 caracteres." },
      400
    );
  }

  const emailLimpio = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (emailLimpio && (emailLimpio.length > 254 || !EMAIL.test(emailLimpio))) {
    return responder({ error: "El correo no es válido." }, 400);
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return responder({ error: "El servicio no está disponible." }, 503);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return responder({ error: "El servicio no está disponible." }, 503);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "desconocida";
  const ipHash = createHmac("sha256", serviceKey).update(ip).digest("hex");
  const desde = new Date(Date.now() - VENTANA_MS).toISOString();

  const { data, error: registroError } = await admin.rpc(
    "registrar_denuncia_anuncio",
    {
      p_anuncio_id: id,
      p_motivo: motivo,
      p_detalles: detalles.trim(),
      p_email_reportante: emailLimpio || null,
      p_ip_hash: ipHash,
      p_desde: desde,
      p_limite: LIMITE_DENUNCIAS,
    }
  );

  if (registroError || !data || typeof data !== "object" || Array.isArray(data)) {
    console.error("No se pudo registrar la denuncia:", registroError?.message);
    return responder({ error: "No se pudo registrar la denuncia." }, 503);
  }

  const resultado = data as Record<string, unknown>;
  if (resultado.estado === "limite") {
    return responder(
      { error: "Has enviado demasiadas denuncias seguidas. Inténtalo más tarde." },
      429
    );
  }
  if (resultado.estado === "duplicada") {
    return responder({ ok: true, duplicada: true }, 200);
  }
  if (resultado.estado === "no_encontrado") {
    return responder({ error: "El anuncio ya no está disponible." }, 404);
  }
  if (resultado.estado !== "registrada") {
    return responder({ error: "No se pudo registrar la denuncia." }, 503);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.CONTACTO_EMAIL_DESTINO;
  if (apiKey && destinatario) {
    const resend = new Resend(apiKey);
    const titulo =
      typeof resultado.anuncio_titulo === "string"
        ? resultado.anuncio_titulo
        : "Anuncio";
    const categoria =
      typeof resultado.anuncio_categoria === "string"
        ? resultado.anuncio_categoria
        : "sin categoría";

    const { error: correoError } = await resend.emails.send({
      from: "Particulares Directo <contacto@particularesdirecto.com>",
      to: destinatario,
      subject: `[Particulares Directo] Nueva denuncia: ${titulo}`,
      text:
        `Anuncio: ${titulo}\n` +
        `Categoría: ${categoria}\n` +
        `Motivo: ${motivo}\n` +
        `Detalles: ${detalles.trim()}\n` +
        `Enlace: https://www.particularesdirecto.com/anuncio/${id}\n` +
        (emailLimpio ? `Contacto de quien denuncia: ${emailLimpio}\n` : ""),
    });
    if (correoError) {
      console.error("La denuncia se guardó, pero no se pudo enviar el aviso:", correoError);
    }
  }

  return responder({ ok: true }, 201);
}
