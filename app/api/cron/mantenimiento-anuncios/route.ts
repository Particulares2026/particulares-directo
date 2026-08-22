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

type AnuncioParaAlerta = {
  id: string;
  titulo: string;
  ubicacion: string | null;
  provincia: string | null;
  operacion: string | null;
  tipo: string | null;
  tipo_inmueble: string | null;
  precio: number | null;
  tamano: number | null;
  habitaciones: number | null;
  banos: number | null;
  amueblado: boolean | null;
  duracion_alquiler: string | null;
  estado: string | null;
  caracteristicas: string[] | null;
  created_at: string;
};

type AlertaFila = {
  id: string;
  email: string;
  query: string | null;
  operacion: string | null;
  tipo: string | null;
  provincia: string | null;
  tipo_inmueble: string | null;
  precio_min: number | null;
  precio_max: number | null;
  tamano_min: number | null;
  tamano_max: number | null;
  habitaciones: number | null;
  banos: number | null;
  amueblado: boolean | null;
  duracion_alquiler: string | null;
  estado: string | null;
  caracteristicas: string[] | null;
  ultima_revision: string;
};

function anuncioCoincideConAlerta(a: AnuncioParaAlerta, alerta: AlertaFila): boolean {
  if (alerta.operacion && a.operacion !== alerta.operacion) return false;
  if (alerta.tipo && a.tipo !== alerta.tipo) return false;
  if (alerta.provincia && a.provincia !== alerta.provincia) return false;
  if (alerta.tipo_inmueble && a.tipo_inmueble !== alerta.tipo_inmueble) return false;
  if (alerta.precio_min != null && (a.precio == null || a.precio < alerta.precio_min)) return false;
  if (alerta.precio_max != null && (a.precio == null || a.precio > alerta.precio_max)) return false;
  if (alerta.tamano_min != null && (a.tamano == null || a.tamano < alerta.tamano_min)) return false;
  if (alerta.tamano_max != null && (a.tamano == null || a.tamano > alerta.tamano_max)) return false;
  if (alerta.habitaciones != null && (a.habitaciones == null || a.habitaciones < alerta.habitaciones)) return false;
  if (alerta.banos != null && (a.banos == null || a.banos < alerta.banos)) return false;
  if (alerta.amueblado != null && a.amueblado !== alerta.amueblado) return false;
  if (alerta.duracion_alquiler && a.duracion_alquiler !== alerta.duracion_alquiler) return false;
  if (alerta.estado && a.estado !== alerta.estado) return false;
  if (alerta.caracteristicas && alerta.caracteristicas.length > 0) {
    const tiene = a.caracteristicas || [];
    if (!alerta.caracteristicas.every((c) => tiene.includes(c))) return false;
  }
  if (alerta.query) {
    const tokens = alerta.query.toLowerCase().split(/[,\s]+/).filter(Boolean);
    const haystack = [a.titulo, a.ubicacion, a.provincia].join(" ").toLowerCase();
    if (!tokens.some((t) => haystack.includes(t))) return false;
  }
  return true;
}

function textoAlerta(anuncios: AnuncioParaAlerta[]) {
  const lineas = anuncios.map((a) => {
    const detalles = [
      a.precio != null ? `${a.precio.toLocaleString("es-ES")} €` : null,
      a.tamano != null ? `${a.tamano} m²` : null,
      a.habitaciones != null ? `${a.habitaciones} hab.` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `- ${a.titulo}${a.ubicacion ? ` (${a.ubicacion})` : ""}${detalles ? ` — ${detalles}` : ""}`;
  });

  return {
    subject:
      anuncios.length === 1
        ? "1 anuncio nuevo que coincide con tu búsqueda"
        : `${anuncios.length} anuncios nuevos que coinciden con tu búsqueda`,
    text:
      `Hola,\n\n` +
      `Hay ${anuncios.length === 1 ? "un anuncio nuevo" : `${anuncios.length} anuncios nuevos`} en Particulares Directo que coincide${anuncios.length === 1 ? "" : "n"} con una búsqueda que guardaste:\n\n` +
      lineas.join("\n") +
      `\n\nVerlos todos: ${URL_SITIO}/categoria/inmobiliaria\n\n` +
      `Si ya no quieres recibir esta alerta, entra en esa página, abre "🔔 Alertas por email" y elimínala.\n\n` +
      `— Particulares Directo`,
  };
}

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
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json({ error: "Tarea automática no configurada." }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
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
  let errores = 0;

  for (const anuncio of anuncios || []) {
    const diasTranscurridos = (ahora - new Date(anuncio.fecha_activacion).getTime()) / DIA_MS;
    const diasRestantes = DIAS_CADUCIDAD - diasTranscurridos;

    if (diasRestantes <= 0) {
      const { error: desactivarError } = await admin
        .from("anuncios")
        .update({ activo: false })
        .eq("id", anuncio.id);
      if (desactivarError) {
        console.error("Error al desactivar anuncio caducado:", anuncio.id, desactivarError);
        errores++;
      } else {
        desactivados++;
      }
      continue;
    }

    if (diasRestantes <= 3 && !anuncio.aviso_3_enviado) {
      const { subject, text } = textoAviso(anuncio.nombre_contacto, anuncio.titulo, 3);
      if (!resend) {
        errores++;
        continue;
      }
      const { error: envioError } = await resend.emails.send({
        from: REMITENTE,
        to: anuncio.email_contacto,
        subject,
        text,
      });
      if (envioError) {
        console.error("Error al enviar aviso de 3 días:", anuncio.id, envioError);
        errores++;
        continue;
      }
      const { error: marcarError } = await admin
        .from("anuncios")
        .update({ aviso_3_enviado: true })
        .eq("id", anuncio.id);
      if (marcarError) {
        console.error("Error al registrar aviso de 3 días:", anuncio.id, marcarError);
        errores++;
      } else {
        avisos3++;
      }
    } else if (diasRestantes <= 5 && !anuncio.aviso_5_enviado) {
      const { subject, text } = textoAviso(anuncio.nombre_contacto, anuncio.titulo, 5);
      if (!resend) {
        errores++;
        continue;
      }
      const { error: envioError } = await resend.emails.send({
        from: REMITENTE,
        to: anuncio.email_contacto,
        subject,
        text,
      });
      if (envioError) {
        console.error("Error al enviar aviso de 5 días:", anuncio.id, envioError);
        errores++;
        continue;
      }
      const { error: marcarError } = await admin
        .from("anuncios")
        .update({ aviso_5_enviado: true })
        .eq("id", anuncio.id);
      if (marcarError) {
        console.error("Error al registrar aviso de 5 días:", anuncio.id, marcarError);
        errores++;
      } else {
        avisos5++;
      }
    }
  }

  const ahoraIso = new Date().toISOString();
  let alertasRevisadas = 0;
  let alertasAvisadas = 0;

  const { data: alertas, error: alertasError } = await admin
    .from("alertas_busqueda")
    .select(
      "id, email, query, operacion, tipo, provincia, tipo_inmueble, precio_min, precio_max, tamano_min, tamano_max, habitaciones, banos, amueblado, duracion_alquiler, estado, caracteristicas, ultima_revision"
    )
    .eq("categoria", "inmobiliaria")
    .returns<AlertaFila[]>();

  if (alertasError) {
    return NextResponse.json({ error: alertasError.message }, { status: 500 });
  }

  for (const alerta of alertas || []) {
    const { data: nuevos, error: nuevosError } = await admin
      .from("anuncios")
      .select(
        "id, titulo, ubicacion, provincia, operacion, tipo, tipo_inmueble, precio, tamano, habitaciones, banos, amueblado, duracion_alquiler, estado, caracteristicas, created_at"
      )
      .eq("categoria", "inmobiliaria")
      .eq("activo", true)
      .gt("created_at", alerta.ultima_revision)
      .returns<AnuncioParaAlerta[]>();

    if (nuevosError) {
      console.error("Error al revisar anuncios para la alerta:", alerta.id, nuevosError);
      errores++;
      continue;
    }

    const coincidencias = (nuevos || []).filter((a) => anuncioCoincideConAlerta(a, alerta));

    if (coincidencias.length > 0) {
      if (!resend) {
        errores++;
        continue;
      }
      const { subject, text } = textoAlerta(coincidencias);
      const { error: envioError } = await resend.emails.send({
        from: REMITENTE,
        to: alerta.email,
        subject,
        text,
      });
      if (envioError) {
        console.error("Error al enviar alerta de búsqueda:", alerta.id, envioError);
        errores++;
        continue;
      }
      alertasAvisadas++;
    }

    const { error: revisionError } = await admin
      .from("alertas_busqueda")
      .update({ ultima_revision: ahoraIso })
      .eq("id", alerta.id);
    if (revisionError) {
      console.error("Error al registrar la revisión de alerta:", alerta.id, revisionError);
      errores++;
      continue;
    }
    alertasRevisadas++;
  }

  return NextResponse.json({
    revisados: anuncios?.length || 0,
    desactivados,
    avisos5,
    avisos3,
    alertasRevisadas,
    alertasAvisadas,
    errores,
  });
}

