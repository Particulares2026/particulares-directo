"use client";

import { useState } from "react";

const OPCIONES_EXPERIENCIA = [
  { valor: "sin experiencia previa", label: "Sin experiencia" },
  { valor: "menos de 1 año de experiencia", label: "Menos de 1 año" },
  { valor: "entre 1 y 3 años de experiencia", label: "Entre 1 y 3 años" },
  { valor: "más de 3 años de experiencia", label: "Más de 3 años" },
];

const INPUT_CLASS =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600";

export default function AsistenteCurriculum({
  onGenerar,
  onCerrar,
}: {
  onGenerar: (texto: string) => void;
  onCerrar: () => void;
}) {
  const [queSabeHacer, setQueSabeHacer] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [disponibilidad, setDisponibilidad] = useState("");
  const [referencias, setReferencias] = useState("");
  const [algoMas, setAlgoMas] = useState("");

  const generar = () => {
    const frases: string[] = [];
    if (queSabeHacer.trim()) frases.push(`Ofrezco mis servicios como ${queSabeHacer.trim()}.`);
    if (experiencia) frases.push(`Tengo ${experiencia}.`);
    if (disponibilidad.trim()) frases.push(`Disponibilidad: ${disponibilidad.trim()}.`);
    if (referencias === "si") frases.push("Puedo aportar referencias de trabajos anteriores.");
    if (algoMas.trim()) frases.push(algoMas.trim());
    onGenerar(frases.join(" "));
  };

  return (
    <div className="border border-teal-200 bg-teal-50/40 rounded-xl p-3 space-y-2.5">
      <p className="text-sm font-medium text-stone-800">
        Responde a estas preguntas sencillas y te preparamos el texto de tu anuncio
      </p>

      <input
        className={INPUT_CLASS}
        placeholder="¿Qué sabes hacer? (ej. limpieza del hogar, cuidar niños, camarero/a...)"
        value={queSabeHacer}
        onChange={(e) => setQueSabeHacer(e.target.value)}
      />

      <select
        className={INPUT_CLASS + " bg-white"}
        value={experiencia}
        onChange={(e) => setExperiencia(e.target.value)}
      >
        <option value="">¿Cuánta experiencia tienes?</option>
        {OPCIONES_EXPERIENCIA.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.label}
          </option>
        ))}
      </select>

      <input
        className={INPUT_CLASS}
        placeholder="¿Qué días y horario puedes trabajar? (ej. lunes a viernes por las mañanas)"
        value={disponibilidad}
        onChange={(e) => setDisponibilidad(e.target.value)}
      />

      <div>
        <p className="text-sm text-stone-500 mb-1.5">¿Tienes referencias de trabajos anteriores?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReferencias((v) => (v === "si" ? "" : "si"))}
            className={
              "flex-1 text-sm py-2 rounded-lg border " +
              (referencias === "si"
                ? "border-teal-700 bg-teal-50 text-teal-800 font-medium"
                : "border-stone-200 text-stone-500")
            }
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => setReferencias((v) => (v === "no" ? "" : "no"))}
            className={
              "flex-1 text-sm py-2 rounded-lg border " +
              (referencias === "no"
                ? "border-teal-700 bg-teal-50 text-teal-800 font-medium"
                : "border-stone-200 text-stone-500")
            }
          >
            No
          </button>
        </div>
      </div>

      <textarea
        className={INPUT_CLASS + " resize-none"}
        rows={2}
        placeholder="¿Algo más que quieras contar? (opcional)"
        value={algoMas}
        onChange={(e) => setAlgoMas(e.target.value)}
      />

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={generar}
          disabled={!queSabeHacer.trim()}
          className="flex-1 bg-teal-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-40"
        >
          Usar este texto
        </button>
        <button
          type="button"
          onClick={onCerrar}
          className="text-sm px-3 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
