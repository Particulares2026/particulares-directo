import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}${rutaError}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
