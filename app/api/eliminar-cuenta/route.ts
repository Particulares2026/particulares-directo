import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { FOTOS_BUCKET, extraerPathStorage } from "@/lib/inmobiliaria";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json(
      { error: "No se puede eliminar la cuenta todavía, inténtalo más tarde." },
      { status: 503 }
    );
  }

  const admin = createAdminSupabase(url, serviceKey);

  const { data: anuncios } = await admin
    .from("anuncios")
    .select("fotos")
    .eq("user_id", user.id);

  const rutas = (anuncios || [])
    .flatMap((a: { fotos: string[] | null }) => a.fotos || [])
    .map((foto: string) => extraerPathStorage(foto))
    .filter((p): p is string => Boolean(p));

  if (rutas.length > 0) {
    await admin.storage.from(FOTOS_BUCKET).remove(rutas);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar la cuenta." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
