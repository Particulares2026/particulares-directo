import type { Metadata } from "next";
import Link from "next/link";
import { GUIAS } from "@/lib/guias";
export const metadata: Metadata = {title: "Guías para publicar y consultar anuncios", description: "Recursos prácticos de Particulares Directo: una plantilla para anunciar una vivienda y comprobaciones para reconocer anuncios sospechosos.", alternates: {canonical: "/guias"}};
export default function GuiasPage() {
 return <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 text-stone-700">
  <Link href="/" className="text-sm underline text-teal-700">← Particulares Directo</Link>
  <h1 className="font-serif text-3xl text-stone-900 mt-4 mb-4">Guías para publicar y consultar anuncios</h1>
  <p className="mb-8">Recursos prácticos de Particulares Directo: una plantilla para anunciar una vivienda y comprobaciones para reconocer anuncios sospechosos.</p>
  <div className="grid gap-5">{GUIAS.map(g=><article key={g.slug} className="rounded-xl border border-stone-200 p-5">
   <h2 className="text-xl font-semibold mb-3"><Link href={"/guias/"+g.slug} className="text-teal-800 underline">{g.titulo}</Link></h2>
   <p>{g.descripcion}</p>
  </article>)}</div>
  <p className="mt-8 text-sm">Estas guías explican cómo usar Particulares Directo y preparar tus anuncios. Revisa siempre los datos y condiciones de cada publicación.</p>
 </main>;
}

