import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const LIMITE_ENVIOS = 5;
const VENTANA_MS = 60 * 60 * 1000; // 1 hora

function esOrigenPermitido(request: Request) {
  const origen = request.headers.get("origin");
  if (!origen) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origen).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!esOrigenPermitido(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  const { tipo, mensaje, sitioWeb } = body as Record<string, unknown>;

  // Campo trampa invisible para personas. Los robots suelen rellenarlo; se les
  // responde como si todo hubiese ido bien, pero no se envía ningún correo.
  if (typeof sitioWeb === "string" && sitioWeb.trim()) {
    return NextResponse.json({ ok: true });
  }

  if (tipo !== "error" && tipo !== "sugerencia") {
    return NextResponse.json({ error: "Tipo no válido." }, { status: 400 });
  }
  if (typeof mensaje !== "string" || !mensaje.trim() || mensaje.length > 2000) {
    return NextResponse.json({ error: "Mensaje no válido." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.CONTACTO_EMAIL_DESTINO;
  if (!apiKey || !destinatario) {
    return NextResponse.json(
      { error: "El buzón de sugerencias no está configurado todavía." },
      { status: 503 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "El buzón de sugerencias no está disponible temporalmente." },
      { status: 503 }
    );
  }

  const ip = (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "desconocida"
  ).slice(0, 200);
  const ipAnonimizada = createHmac("sha256", serviceKey).update(ip).digest("hex");
  const admin = createAdminSupabase(url, serviceKey);
  const desde = new Date(Date.now() - VENTANA_MS).toISOString();
  const { data: permitido, error: limiteError } = await admin.rpc(
    "registrar_envio_contacto",
    { p_ip: ipAnonimizada, p_desde: desde, p_limite: LIMITE_ENVIOS }
  );

  if (limiteError) {
    console.error("Error al aplicar el límite del buzón:", limiteError.message);
    return NextResponse.json(
      { error: "El buzón de sugerencias no está disponible temporalmente." },
      { status: 503 }
    );
  }
  if (!permitido) {
    return NextResponse.json(
      { error: "Has enviado demasiados mensajes seguidos. Inténtalo de nuevo más tarde." },
      { status: 429 }
    );
  }

  const resend = new Resend(apiKey);
  const asunto = tipo === "error" ? "Nuevo reporte de error" : "Nueva sugerencia";

  const { error } = await resend.emails.send({
    from: "Particulares Directo <contacto@particularesdirecto.com>",
    to: destinatario,
    subject: `[Particulares Directo] ${asunto}`,
    text: mensaje.trim(),
  });

  if (error) {
    console.error("Error al enviar con Resend:", JSON.stringify(error));
    return NextResponse.json({ error: "No se pudo enviar el mensaje." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

