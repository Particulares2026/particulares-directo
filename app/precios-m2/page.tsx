import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MINIMO_ANUNCIOS, resumirPrecios } from "@/lib/precios-m2";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Precio por metro cuadrado por zona: cálculo y anuncios",
  description: "Aprende a calcular el precio por m² y consulta las medias por provincia de los anuncios activos, con tamaño de muestra y límites de comparación.",
  alternates: { canonical: "/precios-m2" },
};
export default async function PreciosM2Page() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } });
  const anuncios = [];
  let errorCarga = false;
  for (let inicio = 0; ; inicio += 500) {
    const { data, error } = await supabase.from("anuncios").select("provincia,operacion,precio,tamano")
      .eq("categoria", "inmobiliaria").eq("activo", true).order("id").range(inicio, inicio + 499);
    if (error || !data) { errorCarga = true; break; }
    anuncios.push(...data);
    if (data.length < 500) break;
    if (anuncios.length >= 50000) { errorCarga = true; break; }
  }
  const filas = errorCarga ? [] : resumirPrecios(anuncios);
  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 text-stone-700">
      <Link href="/categoria/inmobiliaria" className="text-sm text-teal-700 underline">← Ver anuncios de inmuebles</Link>
      <h1 className="font-serif text-3xl mt-4 mb-4 text-stone-900">Precio por metro cuadrado por zona</h1>
      <p className="mb-6">Para calcular el precio por m², divide el precio anunciado entre la superficie indicada.
        Aquí puedes consultar las medias de los anuncios activos de Particulares Directo por provincia y entender cómo compararlas.</p>
      <section aria-labelledby="calculo" className="rounded-xl bg-teal-50 border border-teal-100 p-5 mb-8">
        <h2 id="calculo" className="font-semibold text-xl mb-3">Cómo calcular el precio por m²</h2>
        <p className="font-semibold">Precio por m² = precio anunciado ÷ superficie en m²</p>
        <p className="mt-3">Ejemplo ilustrativo de venta: un inmueble anunciado por 180.000 € con 90 m² tiene un precio de 2.000 €/m².</p>
        <p className="mt-3">En un alquiler de 900 € al mes con 90 m², el resultado es 10 €/m² al mes.
          Comprueba siempre el periodo del alquiler antes de comparar dos anuncios.</p>
      </section>
      <section aria-labelledby="datos" className="mb-8">
        <h2 id="datos" className="font-semibold text-xl mb-3">Medias de los anuncios por provincia</h2>
        <p className="mb-4 text-sm">Fuente: anuncios inmobiliarios activos de Particulares Directo con precio y superficie válidos.
          Son precios solicitados, no precios de operaciones cerradas ni una estadística oficial del mercado.
          Venta y alquiler se calculan por separado.</p>
        {errorCarga ? <p role="status" className="rounded-lg bg-amber-50 p-4">Ahora no podemos cargar las medias. Puedes consultar la explicación y volver a intentarlo más tarde.</p>
          : filas.length === 0 ? <p className="rounded-lg bg-stone-50 p-4">Todavía no hay anuncios con datos válidos para este cálculo. Puedes consultar los inmuebles disponibles desde el enlace inferior.</p>
          : <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <caption className="text-left text-stone-600 pb-3">Cada media requiere al menos {MINIMO_ANUNCIOS} anuncios; una muestra pequeña no representa toda la provincia.</caption>
              <thead><tr className="border-b-2 border-teal-100 text-left">
                <th scope="col" className="py-3 pr-3">Provincia</th><th scope="col" className="py-3 pr-3">Venta · €/m²</th><th scope="col" className="py-3">Alquiler · €/m²*</th>
              </tr></thead>
              <tbody>{filas.map(fila => <tr key={fila.provincia} className="border-b border-stone-200">
                <th scope="row" className="py-3 pr-3 text-left font-medium">{fila.provincia}</th>
                {([fila.venta, fila.alquiler]).map((muestra, index) => <td key={index} className="py-3 pr-3">
                  {muestra.media !== null ? `${Math.round(muestra.media).toLocaleString('es-ES')} €`
                    : muestra.cantidad ? 'Muestra insuficiente' : 'Sin datos'}
                  <span className="block text-xs text-stone-500 mt-1">{muestra.cantidad} {muestra.cantidad === 1 ? 'anuncio' : 'anuncios'}</span>
                </td>)}
              </tr>)}</tbody>
            </table>
            <p className="mt-3 text-sm">* El precio de alquiler corresponde al importe introducido en cada anuncio.
              No verificamos que todos usen el mismo periodo: esta media no debe interpretarse automáticamente como €/m² al mes.</p>
          </div>}
      </section>
      <section aria-labelledby="metodo" className="mb-8 space-y-3">
        <h2 id="metodo" className="font-semibold text-xl">Cómo se obtiene la media</h2>
        <p>Dividimos el precio entre la superficie de cada anuncio y calculamos la media aritmética de esos resultados por provincia y operación.
          Cada anuncio pesa lo mismo. Excluimos los que no tienen provincia, precio positivo o superficie positiva.</p>
        <p>El cálculo se actualiza al cargar esta página. Puede incluir distintos tipos de inmuebles y anuncios con superficies útiles o construidas.
          No eliminamos automáticamente duplicados ni valores extremos: ambos pueden influir en la media.</p>
        <p>Con uno o dos anuncios mostramos el tamaño de la muestra, pero no una media. Tener tres o más tampoco garantiza que la muestra sea representativa.</p>
      </section>
      <section aria-labelledby="comparar" className="mb-8 space-y-3">
        <h2 id="comparar" className="font-semibold text-xl">Qué revisar para comparar inmuebles de una zona</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Compara el mismo municipio o barrio: una provincia reúne zonas con características diferentes.</li>
          <li>Separa viviendas, habitaciones, locales, terrenos y otros tipos de inmueble.</li>
          <li>Comprueba si los metros son útiles o construidos y usa el mismo criterio en ambos anuncios.</li>
          <li>Revisa estado, planta, ascensor, espacios exteriores y qué incluye el precio.</li>
          <li>En alquiler, confirma el periodo y los gastos incluidos antes de comparar importes.</li>
        </ul>
      </section>
      <section aria-labelledby="dudas" className="mb-8 space-y-4">
        <h2 id="dudas" className="font-semibold text-xl">Preguntas frecuentes</h2>
        <div><h3 className="font-semibold">¿La media indica cuánto vale mi vivienda?</h3>
          <p>No. Resume los precios solicitados en los anuncios disponibles y no sustituye una valoración del inmueble.</p></div>
        <div><h3 className="font-semibold">¿Por qué no aparece mi provincia?</h3>
          <p>Solo aparecen provincias con algún anuncio activo que permita calcular el precio por m². No rellenamos zonas sin datos con estimaciones.</p></div>
        <div><h3 className="font-semibold">¿Puedo ver precios por barrio?</h3>
          <p>Esta tabla agrupa por provincia. Para comparar una zona concreta, abre el listado de inmuebles y revisa los anuncios de esa ubicación.</p></div>
      </section>
      <Link href="/categoria/inmobiliaria" className="inline-block rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">Comparar anuncios inmobiliarios</Link>
      <p className="mt-6 text-xs text-stone-500">Contenido y cálculo: Particulares Directo. <Link href="/aviso-legal" className="underline">Responsable del sitio</Link>.</p>
    </main>
  );
}
