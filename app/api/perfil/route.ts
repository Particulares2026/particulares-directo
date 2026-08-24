import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREFIJOS_TELEFONO } from "@/lib/telefono";
import { esOrigenPermitido } from "@/lib/seguridad-request";

export async function PATCH(request: Request) {
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
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Los datos no son válidos." }, { status: 400 });
  }

  const { nombre, prefijoTelefono, numeroTelefono } = body as Record<string, unknown>;
  const nombreLimpio = typeof nombre === "string" ? nombre.trim() : "";
  const prefijoValido =
    typeof prefijoTelefono === "string" &&
    PREFIJOS_TELEFONO.some((prefijo) => prefijo.codigo === prefijoTelefono);
  const numeroLimpio = typeof numeroTelefono === "string" ? numeroTelefono.trim() : "";

  if (nombreLimpio.length < 2 || nombreLimpio.length > 100) {
    return NextResponse.json({ error: "El nombre debe tener entre 2 y 100 caracteres." }, { status: 422 });
  }
  if (!prefijoValido || !/^\d{6,12}$/.test(numeroLimpio)) {
    return NextResponse.json({ error: "Introduce un teléfono completo y válido." }, { status: 422 });
  }

  const telefono = `${prefijoTelefono} ${numeroLimpio}`;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      nombre: nombreLimpio,
      telefono,
    },
  });

  if (error) {
    return NextResponse.json({ error: "No se pudo actualizar el perfil." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
