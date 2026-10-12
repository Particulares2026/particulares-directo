"use client";

import Link from "next/link";

export default function ErrorAnuncio({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-xl px-4 py-12">
    <h1 className="font-serif text-2xl mb-4">No se ha podido cargar el anuncio</h1>
    <p role="alert" className="mb-6 text-stone-600">Puede ser un problema temporal. Vuelve a intentarlo o consulta otros anuncios.</p>
    <div className="flex flex-wrap gap-4">
      <button type="button" onClick={reset} className="rounded-lg bg-[#b00859] px-4 py-3 text-white">Volver a intentar</button>
      <Link href="/" className="rounded-lg border border-stone-300 px-4 py-3">Ver otros anuncios</Link>
    </div>
  </main>;
}
