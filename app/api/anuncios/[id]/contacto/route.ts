import { NextResponse } from "next/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

const LIMITE_REVELACIONES = 30;
const VENTANA_MS = 60 * 60 * 1000; // 1 hora

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Faltan variables de entorno." }, { status: 503 });
  }
  const admin = createAdminSupabase(url, serviceKey);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
  const desde = new Date(Date.now() - VENTANA_MS).toISOString();

  const { count } = await admin
    .from("revelaciones_contacto")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", desde);

  if ((count || 0) >= LIMITE_REVELACIONES) {
    return NextResponse.json(
      { error: "Demasiadas peticiones seguidas. Inténtalo de nuevo más tarde." },
      { status: 429 }
    );
  }

  const { data: anuncio } = await admin
    .from("anuncios")
    .select("telefono_contacto, email_contacto, mostrar_telefono, mostrar_email")
    .eq("id", params.id)
    .eq("activo", true)
    .single();

  if (!anuncio) {
    return NextResponse.json({ error: "Anuncio no encontrado." }, { status: 404 });
  }

  await admin.from("revelaciones_contacto").insert({ ip, anuncio_id: params.id });

  return NextResponse.json({
    telefono_contacto: anuncio.mostrar_telefono !== false ? anuncio.telefono_contacto : null,
    email_contacto: anuncio.mostrar_email ? anuncio.email_contacto : null,
  });
}
