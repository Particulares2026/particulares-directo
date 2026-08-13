import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

const LIMITE_ENVIOS = 5;
const VENTANA_MS = 60 * 60 * 1000; // 1 hora

export async function POST(request: Request) {
  const { tipo, mensaje } = await request.json();

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
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";

  if (url && serviceKey) {
    const admin = createAdminSupabase(url, serviceKey);
    const desde = new Date(Date.now() - VENTANA_MS).toISOString();
    const { count } = await admin
      .from("envios_contacto")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", desde);

    if ((count || 0) >= LIMITE_ENVIOS) {
      return NextResponse.json(
        { error: "Has enviado demasiados mensajes seguidos. Inténtalo de nuevo más tarde." },
        { status: 429 }
      );
    }
    await admin.from("envios_contacto").insert({ ip });
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
