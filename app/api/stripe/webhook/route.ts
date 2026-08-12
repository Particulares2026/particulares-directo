import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { DIAS_DESTACADO } from "@/lib/destacar";

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Faltan variables de entorno." }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const firma = request.headers.get("stripe-signature");
  const cuerpo = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(cuerpo, firma || "", webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Firma no válida: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const anuncioId = session.metadata?.anuncio_id;

    if (anuncioId) {
      const admin = createAdminSupabase(supabaseUrl, serviceKey);
      const destacadoHasta = new Date(Date.now() + DIAS_DESTACADO * 24 * 60 * 60 * 1000);
      await admin
        .from("anuncios")
        .update({ destacado_hasta: destacadoHasta.toISOString() })
        .eq("id", anuncioId);
    }
  }

  return NextResponse.json({ received: true });
}
