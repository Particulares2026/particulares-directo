import { NextResponse } from "next/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { esAdmin } from "@/lib/admin";
import { FOTOS_BUCKET, extraerPathStorage } from "@/lib/inmobiliaria";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !esAdmin(user.email)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await request.json();
  if (typeof id !== "string") {
    return NextResponse.json({ error: "Anuncio no válido." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Faltan variables de entorno." }, { status: 503 });
  }
  const admin = createAdminSupabase(url, serviceKey);

  const { data: anuncio } = await admin.from("anuncios").select("fotos").eq("id", id).single();

  const { error } = await admin.from("anuncios").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (anuncio?.fotos && anuncio.fotos.length > 0) {
    const paths = anuncio.fotos.map(extraerPathStorage).filter((p: string | null): p is string => Boolean(p));
    if (paths.length > 0) await admin.storage.from(FOTOS_BUCKET).remove(paths);
  }

  return NextResponse.json({ ok: true });
}
