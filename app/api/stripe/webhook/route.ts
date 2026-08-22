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
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Firma desconocida";
    return NextResponse.json({ error: `Firma no válida: ${mensaje}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const anuncioId = session.metadata?.anuncio_id;
    const userId = session.metadata?.user_id;
    const importeEsperado = Number(session.metadata?.importe_centimos);
    const monedaEsperada = session.metadata?.moneda;
    const dias = Number(session.metadata?.dias);

    if (session.payment_status !== "paid" || session.mode !== "payment") {
      return NextResponse.json({ received: true, processed: false });
    }
    if (
      !anuncioId ||
      !userId ||
      !Number.isInteger(importeEsperado) ||
      importeEsperado <= 0 ||
      monedaEsperada !== "eur" ||
      dias !== DIAS_DESTACADO ||
      session.amount_total !== importeEsperado ||
      session.currency !== monedaEsperada
    ) {
      console.error("Pago de destacado con datos incoherentes:", event.id, session.id);
      return NextResponse.json({ error: "Datos de pago incoherentes." }, { status: 400 });
    }

    const admin = createAdminSupabase(supabaseUrl, serviceKey);
    const { data: anuncio, error: anuncioError } = await admin
      .from("anuncios")
      .select("id, user_id")
      .eq("id", anuncioId)
      .maybeSingle();

    if (anuncioError) {
      console.error("Error comprobando el anuncio del pago:", anuncioError.message);
      return NextResponse.json({ error: "No se pudo comprobar el pago." }, { status: 500 });
    }
    if (!anuncio || anuncio.user_id !== userId) {
      console.error("El pago no coincide con el propietario del anuncio:", event.id, anuncioId);
      return NextResponse.json({ error: "Pago no asociado al anuncio." }, { status: 400 });
    }

    const { data: procesado, error: procesoError } = await admin.rpc(
      "procesar_pago_destacado",
      {
        p_stripe_event_id: event.id,
        p_stripe_session_id: session.id,
        p_anuncio_id: anuncioId,
        p_user_id: userId,
        p_importe_centimos: importeEsperado,
        p_moneda: monedaEsperada,
        p_dias: dias,
      }
    );

    if (procesoError) {
      console.error("Error al aplicar el pago del destacado:", procesoError.message);
      return NextResponse.json({ error: "No se pudo aplicar el pago." }, { status: 500 });
    }

    return NextResponse.json({ received: true, processed: Boolean(procesado) });
  }

  return NextResponse.json({ received: true });
}

