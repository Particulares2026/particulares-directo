import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdmin } from "@/lib/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !esAdmin(user.email)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).id
    : null;
  if (typeof id !== "string" || !UUID.test(id)) {
    return NextResponse.json({ error: "Anuncio no válido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("anuncios")
    .update({ moderado_at: new Date().toISOString(), moderado_por: user.id })
    .eq("id", id)
    .is("moderado_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "No se pudo aceptar el anuncio." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "El anuncio ya se había revisado o no existe." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
