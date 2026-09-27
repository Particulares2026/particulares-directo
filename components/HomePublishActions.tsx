"use client";

import Link from "next/link";
import { trackGoogleAnalyticsEvent } from "@/lib/analytics";

const BUTTON_CLASS =
  "inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-center text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#ec1178] focus:ring-offset-2";

function registrarClic(categoria: "inmobiliaria" | "trabajo") {
  trackGoogleAnalyticsEvent("registration_cta_click", {
    cta_location: "home_hero",
    ad_category: categoria,
  });
}

export default function HomePublishActions() {
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Link
        href="/registro"
        onClick={() => registrarClic("trabajo")}
        className={`${BUTTON_CLASS} bg-[#ec1178] text-white hover:bg-[#c90e66]`}
      >
        Publicar anuncio de trabajo
      </Link>
      <Link
        href="/registro"
        onClick={() => registrarClic("inmobiliaria")}
        className={`${BUTTON_CLASS} border-2 border-[#ec1178] bg-white text-[#b80d5e] hover:bg-fuchsia-50`}
      >
        Publicar anuncio de vivienda
      </Link>
      <p className="w-full text-sm text-stone-500">
        Es gratis, sin agencias y el anuncio no caduca.
      </p>
    </div>
  );
}
