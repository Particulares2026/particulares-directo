import { NextResponse } from "next/server";
import { Resend } from "resend";

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
