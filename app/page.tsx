import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIAS_DESTACADAS, colorCategoria } from "@/lib/categorias";

export const metadata: Metadata = {
  alternates: { canonical: "https://www.particularesdirecto.com" },
};

export default function HomePage() {
  return (
    <main className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 py-10">
      <h1 className="font-serif text-3xl sm:text-4xl mb-2">
        Publica tu anuncio entre{" "}
        <span className="bg-gradient-to-r from-fuchsia-600 to-pink-500 bg-clip-text text-transparent">
          particulares
        </span>
      </h1>
      <p className="text-stone-500 mb-8">Sin agencias ni intermediarios en un click</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {CATEGORIAS_DESTACADAS.map((c) => {
          const color = colorCategoria(c.slug);
          return (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className={
                "group relative overflow-hidden rounded-2xl px-8 py-10 text-white shadow-md hover:shadow-xl " +
                "transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br " +
                color.gradiente
              }
            >
              <div className="absolute -right-6 -top-6 text-8xl opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-transform duration-300">
                {color.icono}
              </div>
              <div className="relative">
                <span className="text-4xl">{color.icono}</span>
                <p className="font-serif text-2xl mt-3">{c.label}</p>
                <p className="text-sm text-white/80 mt-1">
                  Ver anuncios y publicar gratis
                </p>
                <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium">
                  Entrar
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
