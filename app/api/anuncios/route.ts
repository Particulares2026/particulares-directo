import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contieneContactoPublico, contieneContenidoProhibido } from "@/lib/moderacion";
import {
  CARACTERISTICAS,
  DURACIONES_ALQUILER,
  ESTADOS_INMUEBLE,
  FOTOS_BUCKET,
  MAX_FOTOS,
  OPERACIONES,
  PROVINCIAS,
  TIPOS_INMUEBLE,
  extraerPathStorage,
} from "@/lib/inmobiliaria";
import { esEmpresaPorCantidad } from "@/lib/tipo-anunciante";
import { esCategoriaValida } from "@/lib/categorias";
import { esOrigenPermitido } from "@/lib/seguridad-request";
import { obtenerUsuarioActualizado } from "@/lib/perfil";
import {
  CARACTERISTICAS_TRABAJO,
  EXPERIENCIA_TRABAJO,
  IDIOMAS_TRABAJO,
  MODALIDADES_TRABAJO,
  SALARIO_PERIODOS,
  SECTORES_TRABAJO,
} from "@/lib/trabajo";

const REMITENTE = "Particulares Directo <noreply@particularesdirecto.com>";
const LIMITE_ANUNCIOS_POR_HORA = 5;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TELEFONO_PERFIL = /^\+\d{1,4}\s\d{6,12}$/;
const PRECIO_MAXIMO = 1_000_000_000;
const CANTIDAD_MAXIMA = 100;
const TAMANO_MAXIMO = 10_000_000;
const SALARIO_MAXIMO = 10_000_000;

const valores = (opciones: { valor: string }[]) =>
  new Set(opciones.map((opcion) => opcion.valor));
const PROVINCIAS_VALIDAS = new Set(PROVINCIAS);
const OPERACIONES_VALIDAS = valores(OPERACIONES);
const TIPOS_INMUEBLE_VALIDOS = valores(TIPOS_INMUEBLE);
const CARACTERISTICAS_INMUEBLE_VALIDAS = valores(CARACTERISTICAS);
const DURACIONES_ALQUILER_VALIDAS = valores(DURACIONES_ALQUILER);
const ESTADOS_INMUEBLE_VALIDOS = valores(ESTADOS_INMUEBLE);
const SECTORES_TRABAJO_VALIDOS = new Set([
  ...SECTORES_TRABAJO.map((sector) => sector.valor),
  // Valor antiguo conservado solo para que un anuncio ya existente pueda editarse.
  "oficios",
]);
const MODALIDADES_TRABAJO_VALIDAS = valores(MODALIDADES_TRABAJO);
const EXPERIENCIAS_TRABAJO_VALIDAS = valores(EXPERIENCIA_TRABAJO);
const PERIODOS_SALARIO_VALIDOS = valores(SALARIO_PERIODOS);
const IDIOMAS_TRABAJO_VALIDOS = new Set(IDIOMAS_TRABAJO);
const CARACTERISTICAS_TRABAJO_VALIDAS = new Set([
  ...CARACTERISTICAS_TRABAJO.map((caracteristica) => caracteristica.valor),
  // Etiqueta antigua que se elimina al volver a guardar el anuncio.
  "incorporacion_inmediata",
]);
const INCORPORACIONES_VALIDAS = new Set(["inmediata", "convenir"]);

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

function listaSinDuplicados(valor: unknown) {
  if (!Array.isArray(valor)) return [];
  return Array.from(new Set(valor.map((item) => String(item).trim()).filter(Boolean)));
}

function normalizarCamposPermitidos(payload: Record<string, unknown>) {
  const limpio = filtrarCamposPermitidos(payload);

  for (const campo of Object.keys(LIMITES_TEXTO)) {
    if (typeof limpio[campo] === "string") limpio[campo] = limpio[campo].trim();
  }
  for (const campo of [
    "descripcion",
    "ubicacion",
    "telefono_contacto",
    "operacion",
    "provincia",
    "municipio",
    "tipo_inmueble",
    "estado",
    "sector_trabajo",
    "modalidad_trabajo",
    "salario_periodo",
    "experiencia_trabajo",
    "incorporacion",
  ] as const) {
    if (limpio[campo] === "") limpio[campo] = null;
  }
  for (const campo of ["palabras_clave", "caracteristicas", "idiomas_trabajo", "fotos"] as const) {
    limpio[campo] = listaSinDuplicados(limpio[campo]);
  }

  limpio.telefono_contacto = limpio.mostrar_telefono ? limpio.telefono_contacto || null : null;

  const esInmobiliaria = limpio.categoria === "inmobiliaria";
  const esTrabajo = limpio.categoria === "trabajo";

  if (!esInmobiliaria) {
    for (const campo of [
      "operacion",
      "tipo_inmueble",
      "precio",
      "habitaciones",
      "banos",
      "amueblado",
      "tamano",
      "duracion_alquiler",
      "estado",
      "lat",
      "lng",
    ] as const) {
      limpio[campo] = null;
    }
  }

  if (!esTrabajo) {
    for (const campo of [
      "sector_trabajo",
      "modalidad_trabajo",
      "salario_min",
      "salario_max",
      "salario_periodo",
      "experiencia_trabajo",
      "incorporacion",
    ] as const) {
      limpio[campo] = null;
    }
    limpio.idiomas_trabajo = [];
  }

  if (!esInmobiliaria && !esTrabajo) {
    limpio.provincia = null;
    limpio.municipio = null;
    limpio.caracteristicas = [];
  }

  if (esTrabajo) {
    if (limpio.sector_trabajo === "oficios") limpio.sector_trabajo = "otros";
    limpio.caracteristicas = (limpio.caracteristicas as string[]).filter(
      (valor) => valor !== "incorporacion_inmediata"
    );
  }

  return limpio;
}

function numeroEnRango(
  valor: unknown,
  minimo: number,
  maximo: number,
  entero = false
) {
  return (
    valor == null ||
    (typeof valor === "number" &&
      Number.isFinite(valor) &&
      valor >= minimo &&
      valor <= maximo &&
      (!entero || Number.isInteger(valor)))
  );
}

function valorOpcionalIncluido(valor: unknown, permitidos: Set<string>) {
  return valor == null || valor === "" || (typeof valor === "string" && permitidos.has(valor));
}

function listaIncluida(valor: unknown, permitidos: Set<string>) {
  return Array.isArray(valor) && valor.every((item) => typeof item === "string" && permitidos.has(item));
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

  const esInmobiliaria = payload.categoria === "inmobiliaria";
  const esTrabajo = payload.categoria === "trabajo";

  if (esInmobiliaria) {
    if (typeof payload.operacion !== "string" || !OPERACIONES_VALIDAS.has(payload.operacion)) {
      return "La operación inmobiliaria no es válida.";
    }
    if (typeof payload.tipo_inmueble !== "string" || !TIPOS_INMUEBLE_VALIDOS.has(payload.tipo_inmueble)) {
      return "El tipo de inmueble no es válido.";
    }
    if (typeof payload.provincia !== "string" || !PROVINCIAS_VALIDAS.has(payload.provincia)) {
      return "La provincia no es válida.";
    }
    if (!numeroEnRango(payload.precio, 0, PRECIO_MAXIMO) || payload.precio == null) {
      return "El precio debe ser un número válido.";
    }
    if (!numeroEnRango(payload.habitaciones, 0, CANTIDAD_MAXIMA, true)) {
      return "El número de habitaciones no es válido.";
    }
    if (!numeroEnRango(payload.banos, 0, CANTIDAD_MAXIMA, true)) {
      return "El número de baños no es válido.";
    }
    if (!numeroEnRango(payload.tamano, 1, TAMANO_MAXIMO)) {
      return "El tamaño del inmueble no es válido.";
    }
    if (payload.amueblado != null && typeof payload.amueblado !== "boolean") {
      return "El campo amueblado no es válido.";
    }
    if (!valorOpcionalIncluido(payload.estado, ESTADOS_INMUEBLE_VALIDOS)) {
      return "El estado del inmueble no es válido.";
    }
    if (!listaIncluida(payload.caracteristicas, CARACTERISTICAS_INMUEBLE_VALIDAS)) {
      return "Las características del inmueble no son válidas.";
    }
    if (
      payload.operacion === "alquiler" &&
      (typeof payload.duracion_alquiler !== "string" ||
        !DURACIONES_ALQUILER_VALIDAS.has(payload.duracion_alquiler))
    ) {
      return "Indica si el alquiler es de temporada o de larga estancia.";
    }
    if (payload.operacion === "venta" && payload.duracion_alquiler != null && payload.duracion_alquiler !== "") {
      return "La duración solo se puede indicar en anuncios de alquiler.";
    }

    const tieneLatitud = payload.lat != null;
    const tieneLongitud = payload.lng != null;
    if (
      tieneLatitud !== tieneLongitud ||
      !numeroEnRango(payload.lat, -90, 90) ||
      !numeroEnRango(payload.lng, -180, 180)
    ) {
      return "La ubicación del mapa no es válida.";
    }
  }

  if (esTrabajo) {
    if (!valorOpcionalIncluido(payload.provincia, PROVINCIAS_VALIDAS)) {
      return "La provincia no es válida.";
    }
    if (!valorOpcionalIncluido(payload.sector_trabajo, SECTORES_TRABAJO_VALIDOS)) {
      return "El sector de trabajo no es válido.";
    }
    if (!valorOpcionalIncluido(payload.modalidad_trabajo, MODALIDADES_TRABAJO_VALIDAS)) {
      return "La modalidad de trabajo no es válida.";
    }
    if (!valorOpcionalIncluido(payload.experiencia_trabajo, EXPERIENCIAS_TRABAJO_VALIDAS)) {
      return "La experiencia indicada no es válida.";
    }
    if (!valorOpcionalIncluido(payload.salario_periodo, PERIODOS_SALARIO_VALIDOS)) {
      return "El periodo del salario no es válido.";
    }
    if (!valorOpcionalIncluido(payload.incorporacion, INCORPORACIONES_VALIDAS)) {
      return "La incorporación indicada no es válida.";
    }
    if (!numeroEnRango(payload.salario_min, 0, SALARIO_MAXIMO)) {
      return "El salario mínimo no es válido.";
    }
    if (!numeroEnRango(payload.salario_max, 0, SALARIO_MAXIMO)) {
      return "El salario máximo no es válido.";
    }
    const tieneSalario = payload.salario_min != null || payload.salario_max != null;
    if (tieneSalario && !payload.salario_periodo) {
      return "Indica el periodo del salario.";
    }
    if (payload.salario_periodo === "convenir" && tieneSalario) {
      return "Si el salario es a convenir, no indiques una cantidad.";
    }
    if (
      typeof payload.salario_min === "number" &&
      typeof payload.salario_max === "number" &&
      payload.salario_min > payload.salario_max
    ) {
      return "El salario mínimo no puede superar al máximo.";
    }
    if (!listaIncluida(payload.idiomas_trabajo, IDIOMAS_TRABAJO_VALIDOS)) {
      return "Los idiomas indicados no son válidos.";
    }
    if (!listaIncluida(payload.caracteristicas, CARACTERISTICAS_TRABAJO_VALIDAS)) {
      return "Las características de trabajo no son válidas.";
    }
  }

  if (!esInmobiliaria && !esTrabajo) {
    if (typeof payload.ubicacion !== "string" || !payload.ubicacion.trim()) {
      return "Indica la ubicación del anuncio.";
    }
    if (typeof payload.descripcion !== "string" || !payload.descripcion.trim()) {
      return "Añade una descripción del anuncio.";
    }
    if (
      !Array.isArray(payload.palabras_clave) ||
      !payload.palabras_clave.some((palabra) => typeof palabra === "string" && palabra.trim())
    ) {
      return "Añade al menos una palabra clave.";
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
  if (!esOrigenPermitido(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
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

  const camposLimpios: Record<string, unknown> = {
    ...normalizarCamposPermitidos(payload),
    // El correo procede siempre de la sesión confirmada, nunca del cuerpo manipulable.
    email_contacto: user.email || "",
  };

  let anunciosActivosCategoriaAntes = 0;
  if (!anuncioId) {
    const { data: activosCategoria, error: activosError } = await admin
      .from("anuncios")
      .select("categoria,tipo,titulo,descripcion,ubicacion,provincia,municipio,operacion,tipo_inmueble,precio")
      .eq("user_id", user.id)
      .eq("categoria", camposLimpios.categoria as string)
      .eq("activo", true);

    if (activosError) {
      return NextResponse.json(
        { error: "No se pudo comprobar tu cuenta. Inténtalo de nuevo en un momento." },
        { status: 503 }
      );
    }

    anunciosActivosCategoriaAntes = activosCategoria?.length || 0;
    const huellaNueva = huellaDuplicado(camposLimpios);
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
    camposLimpios.titulo as string,
    typeof camposLimpios.descripcion === "string" ? camposLimpios.descripcion : null,
    typeof camposLimpios.ubicacion === "string" ? camposLimpios.ubicacion : null,
    Array.isArray(camposLimpios.palabras_clave) ? camposLimpios.palabras_clave.join(" ") : null,
    camposLimpios.nombre_contacto as string
  );

  if (prohibido) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && user.email) {
      const resend = new Resend(resendKey);
      const { subject, text } = textoRechazo(camposLimpios.titulo as string);
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

    const { error } = await admin
      .from("anuncios")
      .update(updatePayload)
      .eq("id", anuncioId)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: "No se pudo actualizar el anuncio." }, { status: 500 });

    if (precioCambiado) {
      await admin.from("historial_precios").insert({ anuncio_id: anuncioId, precio: nuevoPrecio });
    }
    return NextResponse.json({ ok: true, id: anuncioId });
  }

  const { data: plazaReservada, error: limiteError } = await admin.rpc(
    "reservar_publicacion_anuncio",
    { p_user_id: user.id, p_limite: LIMITE_ANUNCIOS_POR_HORA }
  );
  if (limiteError) {
    return NextResponse.json(
      { error: "No se pudo comprobar el límite de publicaciones. Inténtalo de nuevo en un momento." },
      { status: 503 }
    );
  }
  if (!plazaReservada) {
    return NextResponse.json(
      { error: "Has publicado demasiados anuncios seguidos. Espera un rato antes de publicar otro." },
      { status: 429 }
    );
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
  if (!esOrigenPermitido(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
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

