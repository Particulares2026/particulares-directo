"use client";

import { useMemo, useState } from "react";

const INPUT_CLASS =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600";

function formatoEuros(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 }) + " €";
}

export default function CalculadoraHipoteca({ precioInicial }: { precioInicial?: number | null }) {
  const [precio, setPrecio] = useState(precioInicial ? String(precioInicial) : "200000");
  const [entradaPct, setEntradaPct] = useState("20");
  const [plazoAnios, setPlazoAnios] = useState("30");
  const [interes, setInteres] = useState("3");

  const resultado = useMemo(() => {
    const precioN = Number(precio) || 0;
    const entradaPctN = Number(entradaPct) || 0;
    const plazoN = Number(plazoAnios) || 0;
    const interesN = Number(interes) || 0;

    const entrada = precioN * (entradaPctN / 100);
    const principal = Math.max(precioN - entrada, 0);
    const meses = plazoN * 12;
    const rMensual = interesN / 100 / 12;

    if (meses <= 0 || principal <= 0) return null;

    const cuota =
      rMensual === 0
        ? principal / meses
        : (principal * rMensual * Math.pow(1 + rMensual, meses)) / (Math.pow(1 + rMensual, meses) - 1);

    const totalPagado = cuota * meses;
    const totalIntereses = totalPagado - principal;
    const gastosCompra = precioN * 0.11;

    return { entrada, principal, cuota, totalPagado, totalIntereses, gastosCompra };
  }, [precio, entradaPct, plazoAnios, interes]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="text-sm">
          <span className="block text-stone-500 mb-1">Precio de la vivienda</span>
          <input
            className={INPUT_CLASS}
            type="number"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block text-stone-500 mb-1">Entrada (%)</span>
          <input
            className={INPUT_CLASS}
            type="number"
            min="0"
            max="100"
            value={entradaPct}
            onChange={(e) => setEntradaPct(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block text-stone-500 mb-1">Plazo (años)</span>
          <input
            className={INPUT_CLASS}
            type="number"
            min="1"
            max="40"
            value={plazoAnios}
            onChange={(e) => setPlazoAnios(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block text-stone-500 mb-1">Interés (TIN %)</span>
          <input
            className={INPUT_CLASS}
            type="number"
            min="0"
            step="0.1"
            value={interes}
            onChange={(e) => setInteres(e.target.value)}
          />
        </label>
      </div>

      {resultado && (
        <div className="border border-sky-200 bg-gradient-to-br from-sky-50 to-fuchsia-50/50 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs text-stone-500">Cuota mensual estimada</p>
            <p className="font-serif text-3xl text-fuchsia-700">{formatoEuros(resultado.cuota)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-stone-100">
            <div>
              <p className="text-stone-500">Entrada necesaria</p>
              <p className="font-medium">{formatoEuros(resultado.entrada)}</p>
            </div>
            <div>
              <p className="text-stone-500">Importe a financiar</p>
              <p className="font-medium">{formatoEuros(resultado.principal)}</p>
            </div>
            <div>
              <p className="text-stone-500">Total intereses</p>
              <p className="font-medium">{formatoEuros(resultado.totalIntereses)}</p>
            </div>
            <div>
              <p className="text-stone-500">Total a pagar</p>
              <p className="font-medium">{formatoEuros(resultado.totalPagado)}</p>
            </div>
          </div>
          <p className="text-xs text-stone-400 pt-2 border-t border-stone-100">
            Además de la entrada, cuenta con unos {formatoEuros(resultado.gastosCompra)} aproximados en gastos
            de compra (impuestos, notaría, registro y gestoría — suelen rondar el 10-12% del precio).
          </p>
        </div>
      )}

      <p className="text-xs text-stone-400 mt-3">
        Esto es solo una estimación orientativa, no una oferta vinculante. Las condiciones reales dependen del
        banco y de tu situación financiera.
      </p>
    </div>
  );
}
