import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIAS } from "@/lib/guias";

export function generateStaticParams() { return GUIAS.map(guia => ({slug: guia.slug})); }

export async function generateMetadata({ params }: { params: Promise<{slug: string}> }): Promise<Metadata> {
  const {slug} = await params;
  const guia = GUIAS.find(item => item.slug === slug);
  if (!guia) return { title: "Guía no encontrada", robots: {index: false, follow: true} };
  return { title: guia.titulo, description: guia.descripcion, alternates: {canonical: "/guias/"+guia.slug},
    openGraph: {title: guia.titulo, description: guia.descripcion, url: "/guias/"+guia.slug, type: "article"} };
}

export default async function GuiaPage({ params }: { params: Promise<{slug: string}> }) {
  const {slug} = await params;
  const guia = GUIAS.find(item => item.slug === slug);
  if (!guia) notFound();
  return <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 text-stone-700">
    <Link href="/guias" className="text-sm underline text-teal-700">← Todas las guías</Link>
    <article>
      <h1 className="font-serif text-3xl text-stone-900 mt-4 mb-4">{guia.titulo}</h1>
      <p className="text-lg mb-3">{guia.intro}</p>
      <p className="text-xs text-stone-500 mb-7">Guía de uso de Particulares Directo · Revisada el <time dateTime="2026-10-10">10 de octubre de 2026</time>.</p>
      <nav aria-label="Contenido de esta guía" className="rounded-xl bg-stone-50 border border-stone-200 p-4 mb-8">
        <p className="font-semibold mb-2">En esta guía</p>
        <ul className="space-y-2">{guia.secciones.map((s,i)=><li key={s.titulo}><a className="underline text-teal-700" href={"#paso-"+i}>{s.titulo}</a></li>)}</ul>
      </nav>
      {guia.secciones.map((s,i)=><section key={s.titulo} aria-labelledby={"paso-"+i} className="mb-8 space-y-3">
        <h2 id={"paso-"+i} className="scroll-mt-24 text-xl font-semibold text-stone-900">{s.titulo}</h2>
        {s.parrafos.map(p=><p key={p}>{p}</p>)}
        {s.plantilla && <div className="rounded-xl border border-teal-100 bg-teal-50 p-5">
          <p className="text-sm mb-3">Puedes seleccionar y copiar este modelo:</p>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7">{s.plantilla}</pre>
        </div>}
      </section>)}
      {guia.fuente && <p className="text-sm mb-8">Para ampliar: <a href={guia.fuente.href} className="underline text-teal-700">{guia.fuente.texto}</a>.</p>}
    </article>
    <nav aria-label="Siguientes pasos" className="flex flex-wrap gap-3 border-t border-stone-200 pt-6">
      {guia.enlaces.map(e=><Link key={e.href} href={e.href} className="rounded-lg border border-teal-200 px-4 py-3 text-teal-800 hover:bg-teal-50">{e.texto}</Link>)}
    </nav>
    <aside className="mt-8"><h2 className="font-semibold mb-2">Otra guía que puede ayudarte</h2>
      {GUIAS.filter(g=>g.slug!==guia.slug).map(g=><Link key={g.slug} href={"/guias/"+g.slug} className="underline text-teal-700">{g.titulo}</Link>)}
    </aside>
    <p className="mt-8 text-xs text-stone-500"><Link href="/aviso-legal" className="underline">Información sobre Particulares Directo y responsable del sitio</Link></p>
  </main>;
}

