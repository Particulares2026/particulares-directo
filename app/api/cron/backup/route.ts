import { NextResponse } from "next/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

const BUCKET = "backups";
const DIAS_RETENCION = 14;
const TABLAS = ["anuncios", "favoritos", "listas_favoritos", "alertas_busqueda", "historial_precios"] as const;

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
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Faltan variables de entorno." }, { status: 503 });
  }

  const admin = createAdminSupabase(url, serviceKey);

  const datos: Record<string, unknown[]> = {};
  for (const tabla of TABLAS) {
    const { data, error } = await admin.from(tabla).select("*");
    if (error) {
      return NextResponse.json({ error: `Error exportando ${tabla}: ${error.message}` }, { status: 500 });
    }
    datos[tabla] = data || [];
  }

  const usuarios: { id: string; email: string | undefined; created_at: string; user_metadata: unknown }[] = [];
  let pagina = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) {
      return NextResponse.json({ error: `Error exportando usuarios: ${error.message}` }, { status: 500 });
    }
    usuarios.push(
      ...data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        user_metadata: u.user_metadata,
      }))
    );
    if (data.users.length < 1000) break;
    pagina++;
  }

  const generadoEn = new Date().toISOString();
  const contenido = JSON.stringify({ generado_en: generadoEn, usuarios, ...datos }, null, 2);
  const nombreArchivo = `backup-${generadoEn.slice(0, 10)}.json`;

  const { error: subidaError } = await admin.storage
    .from(BUCKET)
    .upload(nombreArchivo, contenido, { contentType: "application/json", upsert: true });

  if (subidaError) {
    return NextResponse.json({ error: `Error subiendo la copia: ${subidaError.message}` }, { status: 500 });
  }

  let copiasEliminadas = 0;
  const { data: archivos } = await admin.storage.from(BUCKET).list();
  if (archivos) {
    const limite = Date.now() - DIAS_RETENCION * 24 * 60 * 60 * 1000;
    const aBorrar = archivos
      .filter((f) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(f.name))
      .filter((f) => {
        const fecha = f.name.slice(7, 17);
        const t = new Date(fecha).getTime();
        return !Number.isNaN(t) && t < limite;
      })
      .map((f) => f.name);
    if (aBorrar.length > 0) {
      await admin.storage.from(BUCKET).remove(aBorrar);
      copiasEliminadas = aBorrar.length;
    }
  }

  return NextResponse.json({
    ok: true,
    archivo: nombreArchivo,
    tablas: Object.fromEntries(TABLAS.map((t) => [t, datos[t].length])),
    usuarios: usuarios.length,
    copiasEliminadas,
  });
}
