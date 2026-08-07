import { NextResponse } from "next/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { Resend } from "resend";

const DIAS_CADUCIDAD = 30;
const DIA_MS = 24 * 60 * 60 * 1000;
const URL_SITIO = "https://particularesdirecto.com";
const REMITENTE = "Particulares Directo <noreply@particularesdirecto.com>";

type AnuncioFila = {
  id: string;
  titulo: string;
  email_contacto: string;
  nombre_contacto: string;
  fecha_activacion: string;
  aviso_5_enviado: boolean;
  aviso_3_enviado: boolean;
};

function textoAviso(nombre: string, titulo: string, dias: number) {
  return {
    subject: `Tu anuncio caduca en ${dias} días`,
    text:
      `Hola ${nombre},\n\n` +
      `Tu anuncio "${titulo}" en Particulares Directo caducará en ${dias} días y se desactivará automáticamente si no haces nada.\n\n` +
      `Si quieres que siga visible, entra en tu cuenta y pulsa "Actualizar" en ese anuncio para renovarlo por 30 días más:\n${URL_SITIO}/mis-anuncios\n\n` +
      `Si no lo actualizas, el anuncio se desactivará (no se borrará, podrás reactivarlo cuando quieras desde "Mis anuncios").\n\n` +
      `— Particulares Directo`,
  };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Faltan variables de entorno." }, { status: 503 });
  }

  const admin = createAdminSupabase(url, serviceKey);
  const resend = resendKey ? new Resend(resendKey) : null;

  const { data: anuncios, error } = await admin
    .from("anuncios")
    .select("id, titulo, email_contacto, nombre_contacto, fecha_activacion, aviso_5_enviado, aviso_3_enviado")
    .eq("activo", true)
    .returns<AnuncioFila[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ahora = Date.now();
  let desactivados = 0;
  let avisos5 = 0;
  let avisos3 = 0;

  for (const anuncio of anuncios || []) {
    const diasTranscurridos = (ahora - new Date(anuncio.fecha_activacion).getTime()) / DIA_MS;
    const diasRestantes = DIAS_CADUCIDAD - diasTranscurridos;

    if (diasRestantes <= 0) {
      await admin.from("anuncios").update({ activo: false }).eq("id", anuncio.id);
      desactivados++;
      continue;
    }

    if (diasRestantes <= 3 && !anuncio.aviso_3_enviado) {
      const { subject, text } = textoAviso(anuncio.nombre_contacto, anuncio.titulo, 3);
      if (resend) {
        await resend.emails.send({ from: REMITENTE, to: anuncio.email_contacto, subject, text });
      }
      await admin.from("anuncios").update({ aviso_3_enviado: true }).eq("id", anuncio.id);
      avisos3++;
    } else if (diasRestantes <= 5 && !anuncio.aviso_5_enviado) {
      const { subject, text } = textoAviso(anuncio.nombre_contacto, anuncio.titulo, 5);
      if (resend) {
        await resend.emails.send({ from: REMITENTE, to: anuncio.email_contacto, subject, text });
      }
      await admin.from("anuncios").update({ aviso_5_enviado: true }).eq("id", anuncio.id);
      avisos5++;
    }
  }

  return NextResponse.json({
    revisados: anuncios?.length || 0,
    desactivados,
    avisos5,
    avisos3,
  });
}
