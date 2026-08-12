import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { nombreCategoria } from "@/lib/categorias";
import { precioDestacarCentimos } from "@/lib/destacar";

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) {
    return NextResponse.json(
      { error: "El pago de destacados no está configurado todavía." },
      { status: 503 }
    );
  }

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

  const stripe = new Stripe(stripeKey);
  const origin = new URL(request.url).origin;

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
          unit_amount: precioDestacarCentimos(anuncio.categoria),
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
