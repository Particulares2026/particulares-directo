import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { traducirErrorAuth } from "@/lib/errores-auth";
import { esOrigenPermitido } from "@/lib/seguridad-request";
import {
  COOKIE_RECUPERACION_PASSWORD,
  validarMarcaRecuperacion,
} from "@/lib/recuperacion-password";

export async function POST(request: Request) {
  if (!esOrigenPermitido(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "El enlace no es válido o ha caducado." }, { status: 401 });
  }

  const marca = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_RECUPERACION_PASSWORD}=`))
    ?.slice(COOKIE_RECUPERACION_PASSWORD.length + 1);
  if (!validarMarcaRecuperacion(marca, user.id)) {
    return NextResponse.json({ error: "El enlace no es válido o ha caducado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const password = body && typeof body.password === "string" ? body.password : "";
  if (password.length < 10 || password.length > 128) {
    return NextResponse.json(
      { error: "La contraseña debe tener entre 10 y 128 caracteres." },
      { status: 422 }
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json({ error: traducirErrorAuth(error.message) }, { status: 422 });
  }

  await supabase.auth.signOut({ scope: "others" });

  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set({
    name: COOKIE_RECUPERACION_PASSWORD,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
