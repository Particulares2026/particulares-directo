import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { contieneContenidoProhibido } from "@/lib/moderacion";

const REMITENTE = "Particulares Directo <noreply@particularesdirecto.com>";
const LIMITE_ANUNCIOS_POR_HORA = 5;

function textoRechazo(titulo: string) {
  return {
    subject: "Tu anuncio no se ha podido publicar",
    text:
      `Hola,\n\n` +
      `Tu anuncio "${titulo}" no se ha podido publicar en Particulares Directo porque el ` +
      `contenido no cumple nuestras normas de uso (lenguaje inapropiado, contenido discriminatorio ` +
      `o de índole sexual no permitido en la plataforma).\n\n` +
      `Puedes revisar el texto y volver a publicarlo desde:\nhttps://particularesdirecto.com/publicar\n\n` +
      `Si crees que esto es un error, escríbenos a través del buzón de sugerencias de la web.\n\n` +
      `— Particulares Directo`,
  };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...payload } = body;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Faltan variables de entorno." }, { status: 503 });
  }
  const admin = createAdminSupabase(url, serviceKey);

  if (!id) {
    const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("anuncios")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", haceUnaHora);
    if ((count || 0) >= LIMITE_ANUNCIOS_POR_HORA) {
      return NextResponse.json(
        { error: "Has publicado demasiados anuncios seguidos. Espera un rato antes de publicar otro." },
        { status: 429 }
      );
    }
  }

  const { prohibido } = contieneContenidoProhibido(
    payload.titulo,
    payload.descripcion,
    payload.ubicacion,
    Array.isArray(payload.palabras_clave) ? payload.palabras_clave.join(" ") : null,
    payload.nombre_contacto
  );

  if (prohibido) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && payload.email_contacto) {
      const resend = new Resend(resendKey);
      const { subject, text } = textoRechazo(payload.titulo || "tu anuncio");
      await resend.emails.send({ from: REMITENTE, to: payload.email_contacto, subject, text }).catch(() => null);
    }
    return NextResponse.json(
      {
        error:
          "Este anuncio no se puede publicar: el contenido no cumple nuestras normas de uso. Te hemos enviado un email con más información.",
      },
      { status: 422 }
    );
  }

  if (id) {
    const { data: existente } = await supabase
      .from("anuncios")
      .select("user_id, precio")
      .eq("id", id)
      .single();
    if (!existente || existente.user_id !== user.id) {
      return NextResponse.json({ error: "No puedes editar este anuncio." }, { status: 403 });
    }

    const precioCambiado =
      payload.precio != null && existente.precio != null && payload.precio !== existente.precio;
    const updatePayload = precioCambiado ? { ...payload, precio_anterior: existente.precio } : payload;

    const { error } = await admin.from("anuncios").update(updatePayload).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (precioCambiado) {
      await admin.from("historial_precios").insert({ anuncio_id: id, precio: payload.precio });
    }
    return NextResponse.json({ ok: true, id });
  }

  const { data, error } = await admin
    .from("anuncios")
    .insert({ user_id: user.id, ...payload })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (payload.precio != null) {
    await admin.from("historial_precios").insert({ anuncio_id: data.id, precio: payload.precio });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
