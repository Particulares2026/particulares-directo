import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { nombreCategoria } from "@/lib/categorias";
import { precioDestacarCentimos, DIAS_DESTACADO } from "@/lib/destacar";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }
  const anuncioId =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).anuncioId
      : null;
  if (typeof anuncioId !== "string") {
    return NextResponse.json({ error: "Anuncio no válido." }, { status: 400 });
  }

  const { data: anuncio } = await supabase
    .from("anuncios")
    .select("id, titulo, categoria, user_id")
    .eq("id", anuncioId)
    .single();

  if (!anuncio || anuncio.user_id !== user.id) {
    return NextResponse.json({ error: "No puedes destacar este anuncio." }, { status: 403 });
  }

  const origin =
    process.env.VERCEL_ENV === "production"
      ? "https://www.particularesdirecto.com"
      : new URL(request.url).origin;
  const precio = precioDestacarCentimos(anuncio.categoria);

  // Mientras el destacado sea gratis, se aplica directamente: Stripe no permite
  // crear una sesión de pago de 0 €.
  if (precio === 0) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Faltan variables de entorno." }, { status: 503 });
    }
    const admin = createAdminSupabase(url, serviceKey);
    const destacadoHasta = new Date(Date.now() + DIAS_DESTACADO * 24 * 60 * 60 * 1000);
    const { data: actualizado, error } = await admin
      .from("anuncios")
      .update({ destacado_hasta: destacadoHasta.toISOString() })
      .eq("id", anuncio.id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error || !actualizado) {
      return NextResponse.json({ error: "No se pudo destacar el anuncio." }, { status: 500 });
    }
    return NextResponse.json({ url: `${origin}/mis-anuncios?destacado=ok` });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) {
    return NextResponse.json(
      { error: "El pago de destacados no está configurado todavía." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Destacar anuncio (${nombreCategoria(anuncio.categoria)}): ${anuncio.titulo}`,
            },
            unit_amount: precio,
          },
          quantity: 1,
        },
      ],
      metadata: {
        anuncio_id: anuncio.id,
        user_id: user.id,
        importe_centimos: String(precio),
        moneda: "eur",
        dias: String(DIAS_DESTACADO),
      },
      success_url: `${origin}/mis-anuncios?destacado=ok`,
      cancel_url: `${origin}/mis-anuncios?destacado=cancelado`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Error al crear el pago de Stripe:", err);
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 502 });
  }
}

