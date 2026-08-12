import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Precio del m² por zona - Particulares Directo",
  description: "Precio medio del metro cuadrado por provincia, calculado a partir de los anuncios publicados.",
};

const MINIMO_ANUNCIOS = 3;

type Fila = {
  provincia: string;
  ventaSuma: number;
  ventaCuenta: number;
  alquilerSuma: number;
  alquilerCuenta: number;
};

export default async function PreciosM2Page() {
  const supabase = createClient();

  const { data: anuncios } = await supabase
    .from("anuncios")
    .select("provincia, operacion, precio, tamano")
    .eq("categoria", "inmobiliaria")
    .eq("activo", true)
    .not("provincia", "is", null)
    .not("precio", "is", null)
    .not("tamano", "is", null);

  const porProvincia = new Map<string, Fila>();

  for (const a of anuncios || []) {
    if (!a.provincia || !a.precio || !a.tamano || a.tamano <= 0) continue;
    const eurosM2 = a.precio / a.tamano;
    if (!Number.isFinite(eurosM2) || eurosM2 <= 0) continue;

    let fila = porProvincia.get(a.provincia);
    if (!fila) {
      fila = { provincia: a.provincia, ventaSuma: 0, ventaCuenta: 0, alquilerSuma: 0, alquilerCuenta: 0 };
      porProvincia.set(a.provincia, fila);
    }
    if (a.operacion === "venta") {
      fila.ventaSuma += eurosM2;
      fila.ventaCuenta += 1;
    } else if (a.operacion === "alquiler") {
      fila.alquilerSuma += eurosM2;
      fila.alquilerCuenta += 1;
    }
  }

  const filas = Array.from(porProvincia.values()).sort((a, b) => a.provincia.localeCompare(b.provincia, "es"));

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <Link href="/categoria/inmobiliaria" className="text-sm text-stone-500 hover:text-stone-700">
        ← Inmobiliaria
      </Link>
      <h1 className="font-serif text-2xl mt-2 mb-1">Precio del m² por zona</h1>
      <p className="text-sm text-stone-500 mb-6">
        Precio medio del metro cuadrado, calculado a partir de los anuncios publicados en Particulares
        Directo (no son datos oficiales del mercado).
      </p>

      {filas.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-10">
          Todavía no hay suficientes anuncios con precio y tamaño para calcular el índice.
        </p>
      )}

      {filas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-500">
                <th className="py-2 pr-3 font-medium">Provincia</th>
                <th className="py-2 pr-3 font-medium">€/m² venta</th>
                <th className="py-2 pr-3 font-medium">€/m² alquiler</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.provincia} className="border-b border-stone-100">
                  <td className="py-2 pr-3 text-stone-800">{f.provincia}</td>
                  <td className="py-2 pr-3 text-stone-600">
                    {f.ventaCuenta === 0 ? (
                      <span className="text-stone-300">Sin datos</span>
                    ) : f.ventaCuenta < MINIMO_ANUNCIOS ? (
                      <span title="Pocos anuncios, dato poco fiable todavía">
                        {Math.round(f.ventaSuma / f.ventaCuenta).toLocaleString("es-ES")} € *
                      </span>
                    ) : (
                      `${Math.round(f.ventaSuma / f.ventaCuenta).toLocaleString("es-ES")} €`
                    )}
                  </td>
                  <td className="py-2 pr-3 text-stone-600">
                    {f.alquilerCuenta === 0 ? (
                      <span className="text-stone-300">Sin datos</span>
                    ) : f.alquilerCuenta < MINIMO_ANUNCIOS ? (
                      <span title="Pocos anuncios, dato poco fiable todavía">
                        {Math.round(f.alquilerSuma / f.alquilerCuenta).toLocaleString("es-ES")} € *
                      </span>
                    ) : (
                      `${Math.round(f.alquilerSuma / f.alquilerCuenta).toLocaleString("es-ES")} €`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-stone-400 mt-3">
            * Basado en menos de {MINIMO_ANUNCIOS} anuncios en esa zona — el dato todavía no es muy fiable.
          </p>
        </div>
      )}
    </main>
  );
}
