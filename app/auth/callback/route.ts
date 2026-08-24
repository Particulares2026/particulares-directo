import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  COOKIE_RECUPERACION_PASSWORD,
  crearMarcaRecuperacion,
  SEGUNDOS_RECUPERACION_PASSWORD,
} from "@/lib/recuperacion-password";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextSolicitado = searchParams.get("next") || "/";
  const rutasPermitidas = new Set(["/", "/restablecer-password"]);
  const next = rutasPermitidas.has(nextSolicitado) ? nextSolicitado : "/";
  const rutaError =
    next === "/restablecer-password"
      ? "/olvide-password?enlace=invalido"
      : "/login?enlace=invalido";

  if (!code) {
    return NextResponse.redirect(`${origin}${rutaError}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}${rutaError}`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  response.headers.set("Cache-Control", "private, no-store");

  if (next === "/restablecer-password") {
    const marca = crearMarcaRecuperacion(data.user.id);
    if (!marca) {
      return NextResponse.redirect(`${origin}${rutaError}`);
    }
    response.cookies.set({
      name: COOKIE_RECUPERACION_PASSWORD,
      value: marca,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SEGUNDOS_RECUPERACION_PASSWORD,
    });
  }

  return response;
}
