import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FOTOS_BUCKET, extraerPathStorage } from "@/lib/inmobiliaria";

const TAMANO_MAXIMO = 5 * 1024 * 1024;
const LIMITE_POR_HORA = 30;
const LIMITE_TOTAL = 100;

type TipoImagen = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function tipoImagenReal(bytes: Uint8Array): TipoImagen | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  const cabecera = new TextDecoder("ascii").decode(bytes.slice(0, 12));
  if (cabecera.startsWith("GIF87a") || cabecera.startsWith("GIF89a")) return "image/gif";
  if (cabecera.startsWith("RIFF") && cabecera.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

function extensionPara(tipo: TipoImagen) {
  return tipo === "image/jpeg" ? "jpg" : tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "gif";
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

  const formData = await request.formData().catch(() => null);
  const archivo = formData?.get("foto");
  if (!(archivo instanceof File) || archivo.size === 0 || archivo.size > TAMANO_MAXIMO) {
    return NextResponse.json({ error: "La foto no es válida o supera los 5 MB." }, { status: 400 });
  }

  const buffer = new Uint8Array(await archivo.arrayBuffer());
  const tipo = tipoImagenReal(buffer);
  if (!tipo) {
    return NextResponse.json({ error: "El archivo no es una imagen JPG, PNG, WEBP o GIF válida." }, { status: 415 });
  }

  const admin = createAdminClient();
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [{ count, error: errorLimite }, { data: objetos, error: errorListado }] = await Promise.all([
    admin
      .from("subidas_fotos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", desde),
    admin.storage.from(FOTOS_BUCKET).list(user.id, { limit: LIMITE_TOTAL + 1 }),
  ]);

  if (errorLimite || errorListado) {
    return NextResponse.json({ error: "No se pudo comprobar el límite de seguridad." }, { status: 503 });
  }
  if ((count || 0) >= LIMITE_POR_HORA) {
    return NextResponse.json(
      { error: "Has subido demasiadas fotos seguidas. Espera una hora antes de continuar." },
      { status: 429 }
    );
  }
  if ((objetos?.length || 0) >= LIMITE_TOTAL) {
    return NextResponse.json(
      { error: "Has alcanzado el límite de fotos guardadas. Elimina fotos antiguas antes de subir más." },
      { status: 409 }
    );
  }

  const path = `${user.id}/${crypto.randomUUID()}.${extensionPara(tipo)}`;
  const { error } = await admin.storage.from(FOTOS_BUCKET).upload(path, buffer, {
    contentType: tipo,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: "No se pudo guardar la foto." }, { status: 502 });
  }

  const { error: errorRegistro } = await admin.from("subidas_fotos").insert({ user_id: user.id });
  if (errorRegistro) {
    await admin.storage.from(FOTOS_BUCKET).remove([path]);
    return NextResponse.json({ error: "No se pudo registrar la subida de forma segura." }, { status: 503 });
  }
  const { data } = admin.storage.from(FOTOS_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
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
  const fotoUrl = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>).url : null;
  if (typeof fotoUrl !== "string") {
    return NextResponse.json({ error: "La foto no es válida." }, { status: 400 });
  }

  const path = extraerPathStorage(fotoUrl);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    if (!path || !path.startsWith(`${user.id}/`) || !supabaseUrl || new URL(fotoUrl).origin !== new URL(supabaseUrl).origin) {
      return NextResponse.json({ error: "No puedes eliminar esta foto." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "La foto no es válida." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.storage.from(FOTOS_BUCKET).remove([path]);
  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar la foto." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
