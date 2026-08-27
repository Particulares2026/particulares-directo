import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/admin";
import { esOrigenPermitido } from "@/lib/seguridad-request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!esOrigenPermitido(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !esAdmin(user.email)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).id
      : null;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Denuncia no válida." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "El servicio no está disponible." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("denuncias_anuncios")
    .update({
      estado: "resuelta",
      accion: "revisada_sin_retirada",
      resuelta_at: new Date().toISOString(),
      resuelta_por: user.id,
      email_reportante: null,
      ip_hash: null,
    })
    .eq("id", id)
    .eq("estado", "pendiente")
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "No se pudo cerrar la denuncia." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "La denuncia ya se había revisado o no existe." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
