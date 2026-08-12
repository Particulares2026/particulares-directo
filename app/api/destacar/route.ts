import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
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

  const { anuncioId } = await request.json();
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

  const origin = new URL(request.url).origin;
  const precio = precioDestacarCentimos(anuncio.categoria);

  // Mientras el destacado sea gratis, se aplica directamente: Stripe no permite
  // crear una sesión de pago de 0 €.
  if (precio === 0) {
    const destacadoHasta = new Date(Date.now() + DIAS_DESTACADO * 24 * 60 * 60 * 1000);
    const { error } = await supabase
      .from("anuncios")
      .update({ destacado_hasta: destacadoHasta.toISOString() })
      .eq("id", anuncio.id);

    if (error) {
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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
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
    metadata: { anuncio_id: anuncio.id },
    success_url: `${origin}/mis-anuncios?destacado=ok`,
    cancel_url: `${origin}/mis-anuncios?destacado=cancelado`,
  });

  return NextResponse.json({ url: session.url });
}
