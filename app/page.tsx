import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIAS_DESTACADAS, colorCategoria } from "@/lib/categorias";
import GuiaPrimerAcceso from "@/components/GuiaPrimerAcceso";

export const metadata: Metadata = {
  title: "Particulares Directo | Anuncios de vivienda y empleo",
  description:
    "Encuentra o publica viviendas y oportunidades de empleo con contacto directo, sin agencias ni intermediarios.",
  alternates: { canonical: "https://www.particularesdirecto.com/" },
};

export default function HomePage() {
  return (
    <main className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 py-10">
      <h1 className="font-serif text-3xl sm:text-4xl mb-2">
        Publica tu anuncio entre{" "}
        <span className="text-[#ec1178]">
          particulares
        </span>
      </h1>
      <p className="text-stone-600 mb-8 max-w-2xl">
        Encuentra vivienda y oportunidades de empleo, o publica tu anuncio gratis para contactar directamente y sin intermediarios.
      </p>

      <GuiaPrimerAcceso />

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

      <section className="mt-12 rounded-3xl border border-fuchsia-100 bg-white/80 p-6 sm:p-8 shadow-sm" aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="font-serif text-2xl text-stone-900">
          Contacto directo en tres pasos
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-fuchsia-700">1. Elige una categoría</p>
            <p className="mt-1 text-sm text-stone-600">Busca vivienda o empleo utilizando filtros claros y sencillos.</p>
          </div>
          <div>
            <p className="font-semibold text-fuchsia-700">2. Revisa el anuncio</p>
            <p className="mt-1 text-sm text-stone-600">Consulta la información, las fotografías y el tipo de anunciante.</p>
          </div>
          <div>
            <p className="font-semibold text-fuchsia-700">3. Habla directamente</p>
            <p className="mt-1 text-sm text-stone-600">Contacta con la persona anunciante sin agencias ni comisiones ocultas.</p>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="recursos-utiles">
        <h2 id="recursos-utiles" className="font-serif text-2xl text-stone-900">Recursos útiles para encontrar vivienda</h2>
        <p className="mt-2 max-w-3xl text-stone-600">
          Antes de decidir, calcula una cuota aproximada y consulta referencias de precio por metro cuadrado.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/calculadora-hipoteca" className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:border-fuchsia-300 hover:text-fuchsia-700">
            Calculadora de hipoteca
          </Link>
          <Link href="/precios-m2" className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:border-fuchsia-300 hover:text-fuchsia-700">
            Consultar precio del m²
          </Link>
        </div>
      </section>
    </main>
  );
}
