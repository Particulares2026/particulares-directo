import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contieneContactoPublico, contieneContenidoProhibido } from "@/lib/moderacion";
import { FOTOS_BUCKET, MAX_FOTOS, extraerPathStorage } from "@/lib/inmobiliaria";
import { esEmpresaPorCantidad } from "@/lib/tipo-anunciante";
import { esCategoriaValida } from "@/lib/categorias";
import { obtenerUsuarioActualizado } from "@/lib/perfil";

const REMITENTE = "Particulares Directo <noreply@particularesdirecto.com>";
const LIMITE_ANUNCIOS_POR_HORA = 5;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TELEFONO_PERFIL = /^\+\d{1,4}\s\d{6,12}$/;

const CAMPOS_HUELLA_DUPLICADO = [
  "categoria",
  "tipo",
  "titulo",
  "descripcion",
  "ubicacion",
  "provincia",
  "municipio",
  "operacion",
  "tipo_inmueble",
  "precio",
] as const;

type DatosHuellaDuplicado = Partial<
  Record<(typeof CAMPOS_HUELLA_DUPLICADO)[number], unknown>
>;

const LIMITES_TEXTO: Record<string, number> = {
  categoria: 40,
  tipo: 20,
  titulo: 120,
  ubicacion: 160,
  descripcion: 5000,
  nombre_contacto: 100,
  telefono_contacto: 30,
  operacion: 30,
  provincia: 100,
  municipio: 120,
  tipo_inmueble: 40,
  estado: 40,
  sector_trabajo: 80,
  modalidad_trabajo: 40,
  salario_periodo: 30,
  experiencia_trabajo: 60,
  incorporacion: 100,
};

// Únicos campos que el formulario puede enviar. Todo lo demás se descarta antes de
// escribir en la base de datos, para que nadie pueda colar por su cuenta campos como
// destacado_hasta, precio_anterior o user_id en el cuerpo de la petición.
const CAMPOS_PERMITIDOS = [
  "categoria",
  "tipo",
  "titulo",
  "ubicacion",
  "descripcion",
  "palabras_clave",
  "nombre_contacto",
  "telefono_contacto",
  "email_contacto",
  "mostrar_telefono",
  "mostrar_email",
  "operacion",
  "provincia",
  "municipio",
  "tipo_inmueble",
  "precio",
  "habitaciones",
  "banos",
  "amueblado",
  "tamano",
  "caracteristicas",
  "duracion_alquiler",
  "fotos",
  "estado",
  "lat",
  "lng",
  "sector_trabajo",
  "modalidad_trabajo",
  "salario_min",
  "salario_max",
  "salario_periodo",
  "experiencia_trabajo",
  "idiomas_trabajo",
  "incorporacion",
] as const;

function filtrarCamposPermitidos(payload: Record<string, unknown>) {
  const limpio: Record<string, unknown> = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (campo in payload) limpio[campo] = payload[campo];
  }
  return limpio;
}

function normalizarParaHuella(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function huellaDuplicado(payload: DatosHuellaDuplicado) {
  return CAMPOS_HUELLA_DUPLICADO.map((campo) => normalizarParaHuella(payload[campo])).join("|");
}

function validarPayload(
  payload: Record<string, unknown>,
  userId: string,
  supabaseUrl: string
): string | null {
  for (const [campo, limite] of Object.entries(LIMITES_TEXTO)) {
    const valor = payload[campo];
    if (valor != null && (typeof valor !== "string" || valor.length > limite)) {
      return `El campo ${campo.replaceAll("_", " ")} no es válido o es demasiado largo.`;
    }
  }

  if (typeof payload.titulo !== "string" || payload.titulo.trim().length < 5) {
    return "El título debe tener entre 5 y 120 caracteres.";
  }
  if (typeof payload.categoria !== "string" || !esCategoriaValida(payload.categoria)) {
    return "La categoría del anuncio no es válida.";
  }
  if (payload.tipo !== "busco" && payload.tipo !== "ofrezco") {
    return "El tipo de anuncio no es válido.";
  }
  if (typeof payload.nombre_contacto !== "string" || !payload.nombre_contacto.trim()) {
    return "Indica un nombre de contacto.";
  }
  if (typeof payload.mostrar_telefono !== "boolean" || typeof payload.mostrar_email !== "boolean") {
    return "Elige correctamente cómo quieres que te contacten.";
  }
  if (!payload.mostrar_telefono && !payload.mostrar_email) {
    return "Elige al menos un medio de contacto: teléfono, email, o ambos.";
  }
  if (
    payload.mostrar_telefono &&
    (typeof payload.telefono_contacto !== "string" || !/^\+\d{1,4}\s\d{6,12}$/.test(payload.telefono_contacto))
  ) {
    return "El teléfono de contacto no tiene un formato válido.";
  }

  for (const campo of ["palabras_clave", "caracteristicas", "idiomas_trabajo"] as const) {
    const valor = payload[campo];
    if (
      valor != null &&
      (!Array.isArray(valor) || valor.length > 30 || valor.some((item) => typeof item !== "string" || item.length > 80))
    ) {
      return `El campo ${campo.replaceAll("_", " ")} no es válido.`;
    }
  }

  const fotos = payload.fotos;
  if (!Array.isArray(fotos) || fotos.length > MAX_FOTOS || fotos.some((foto) => typeof foto !== "string")) {
    return `Puedes incluir un máximo de ${MAX_FOTOS} fotos válidas.`;
  }

  let origenSupabase: string;
  try {
    origenSupabase = new URL(supabaseUrl).origin;
  } catch {
    return "La configuración del almacenamiento no es válida.";
  }

  for (const foto of fotos as string[]) {
    const path = extraerPathStorage(foto);
    try {
      if (!path || !path.startsWith(`${userId}/`) || new URL(foto).origin !== origenSupabase) {
        return "Una de las fotos no pertenece a tu cuenta.";
      }
    } catch {
      return "Una de las fotos no es válida.";
    }
  }

  const contactoPublico = contieneContactoPublico(
    payload.titulo as string,
    typeof payload.descripcion === "string" ? payload.descripcion : null,
    typeof payload.ubicacion === "string" ? payload.ubicacion : null,
    Array.isArray(payload.palabras_clave) ? payload.palabras_clave.join(" ") : null
  );
  if (contactoPublico.encontrado) {
    return "No escribas teléfonos, correos ni enlaces en el título o la descripción. Usa la sección Contacto para proteger tus datos.";
  }

  return null;
}

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
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  const usuarioActualizado = await obtenerUsuarioActualizado(user);
  const telefonoPerfil = (usuarioActualizado.user_metadata as Record<string, unknown>)?.telefono;
  if (typeof telefonoPerfil !== "string" || !TELEFONO_PERFIL.test(telefonoPerfil)) {
    return NextResponse.json(
      { error: "Completa el teléfono de tu perfil antes de publicar o editar un anuncio." },
      { status: 422 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Los datos del anuncio no son válidos." }, { status: 400 });
  }
  const { id, ...payload } = body as Record<string, unknown>;
  if (id != null && (typeof id !== "string" || !UUID.test(id))) {
    return NextResponse.json({ error: "El anuncio no es válido." }, { status: 400 });
  }
  const anuncioId = typeof id === "string" ? id : null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Faltan variables de entorno." }, { status: 503 });
  }
  const admin = createAdminClient();

  const errorValidacion = validarPayload(payload, user.id, url);
  if (errorValidacion) {
    return NextResponse.json({ error: errorValidacion }, { status: 422 });
  }

  let anunciosActivosCategoriaAntes = 0;
  if (!anuncioId) {
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

    const { data: activosCategoria, error: activosError } = await admin
      .from("anuncios")
      .select("categoria,tipo,titulo,descripcion,ubicacion,provincia,municipio,operacion,tipo_inmueble,precio")
      .eq("user_id", user.id)
      .eq("categoria", payload.categoria as string)
      .eq("activo", true);

    if (activosError) {
      return NextResponse.json(
        { error: "No se pudo comprobar tu cuenta. Inténtalo de nuevo en un momento." },
        { status: 503 }
      );
    }

    anunciosActivosCategoriaAntes = activosCategoria?.length || 0;
    const huellaNueva = huellaDuplicado(payload);
    const esDuplicado = (activosCategoria || []).some(
      (anuncio) => huellaDuplicado(anuncio) === huellaNueva
    );
    if (esDuplicado) {
      return NextResponse.json(
        { error: "Ya tienes publicado un anuncio igual en esta categoría. Puedes editar el existente." },
        { status: 409 }
      );
    }
  }

  const { prohibido } = contieneContenidoProhibido(
    payload.titulo as string,
    typeof payload.descripcion === "string" ? payload.descripcion : null,
    typeof payload.ubicacion === "string" ? payload.ubicacion : null,
    Array.isArray(payload.palabras_clave) ? payload.palabras_clave.join(" ") : null,
    payload.nombre_contacto as string
  );

  if (prohibido) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && user.email) {
      const resend = new Resend(resendKey);
      const { subject, text } = textoRechazo(payload.titulo as string);
      await resend.emails.send({ from: REMITENTE, to: user.email, subject, text }).catch(() => null);
    }
    return NextResponse.json(
      {
        error:
          "Este anuncio no se puede publicar: el contenido no cumple nuestras normas de uso. Te hemos enviado un email con más información.",
      },
      { status: 422 }
    );
  }

  const camposLimpios: Record<string, unknown> = {
    ...filtrarCamposPermitidos(payload),
    // El correo procede siempre de la sesión confirmada, nunca del cuerpo manipulable.
    email_contacto: user.email || "",
  };

  if (anuncioId) {
    const { data: existente } = await supabase
      .from("anuncios")
      .select("user_id, precio")
      .eq("id", anuncioId)
      .single();
    if (!existente || existente.user_id !== user.id) {
      return NextResponse.json({ error: "No puedes editar este anuncio." }, { status: 403 });
    }

    const nuevoPrecio = camposLimpios.precio as number | null | undefined;
    const precioCambiado =
      nuevoPrecio != null && existente.precio != null && nuevoPrecio !== existente.precio;
    const updatePayload = {
      ...camposLimpios,
      ...(precioCambiado ? { precio_anterior: existente.precio } : {}),
      // Cualquier cambio de contenido debe revisarse de nuevo en moderación.
      moderado_at: null,
      moderado_por: null,
    };

    const { error } = await admin.from("anuncios").update(updatePayload).eq("id", anuncioId);
    if (error) return NextResponse.json({ error: "No se pudo actualizar el anuncio." }, { status: 500 });

    if (precioCambiado) {
      await admin.from("historial_precios").insert({ anuncio_id: anuncioId, precio: nuevoPrecio });
    }
    return NextResponse.json({ ok: true, id: anuncioId });
  }

  const { data, error } = await admin
    .from("anuncios")
    .insert({ ...camposLimpios, user_id: user.id })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "No se pudo publicar el anuncio." }, { status: 500 });

  if (camposLimpios.precio != null) {
    await admin.from("historial_precios").insert({ anuncio_id: data.id, precio: camposLimpios.precio });
  }
  const anunciosActivosCategoria = anunciosActivosCategoriaAntes + 1;
  return NextResponse.json({
    ok: true,
    id: data.id,
    anuncios_activos_categoria: anunciosActivosCategoria,
    es_empresa: esEmpresaPorCantidad(anunciosActivosCategoria),
  });
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>).id : null;
  if (typeof id !== "string" || !UUID.test(id)) {
    return NextResponse.json({ error: "El anuncio no es válido." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "El servicio no está disponible." }, { status: 503 });
  }

  const { data: anuncio } = await admin
    .from("anuncios")
    .select("fotos")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!anuncio) {
    return NextResponse.json({ error: "No puedes eliminar este anuncio." }, { status: 403 });
  }

  const { error } = await admin.from("anuncios").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar el anuncio." }, { status: 500 });
  }

  const paths = (anuncio.fotos || [])
    .map(extraerPathStorage)
    .filter((path: string | null): path is string => Boolean(path && path.startsWith(`${user.id}/`)));
  if (paths.length > 0) {
    await admin.storage.from(FOTOS_BUCKET).remove(paths);
  }

  return NextResponse.json({ ok: true });
}
