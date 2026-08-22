"use client";

import { useEffect, useMemo, useState } from "react";
import AnuncioCard from "./AnuncioCard";
import { createClient } from "@/lib/supabase/client";
import { PROVINCIAS } from "@/lib/inmobiliaria";
import {
  SECTORES_TRABAJO,
  MODALIDADES_TRABAJO,
  EXPERIENCIA_TRABAJO,
  IDIOMAS_TRABAJO,
  CARACTERISTICAS_TRABAJO,
} from "@/lib/trabajo";

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const POR_PAGINA = 20;

const SELECT_CLASS =
  "border border-stone-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white max-w-full";
const INPUT_CLASS =
  "border border-stone-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 w-full";

const ORDEN_OPCIONES = [
  { valor: "relevancia", label: "Relevancia" },
  { valor: "recientes", label: "Más recientes" },
  { valor: "antiguos", label: "Más antiguos" },
  { valor: "salario_asc", label: "Salario: menor a mayor" },
  { valor: "salario_desc", label: "Salario: mayor a menor" },
];

export default function FiltrosTrabajo({
  anuncios,
  currentUserId,
  favoritosIniciales,
}: {
  anuncios: any[];
  currentUserId: string | null;
  favoritosIniciales: string[];
}) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [municipiosDisponibles, setMunicipiosDisponibles] = useState<string[]>([]);
  const [modalidad, setModalidad] = useState("");
  const [tipo, setTipo] = useState("");
  const [salarioMin, setSalarioMin] = useState("");
  const [salarioMax, setSalarioMax] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [idiomas, setIdiomas] = useState<string[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<string[]>([]);
  const [caracteristicasAbierto, setCaracteristicasAbierto] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set(favoritosIniciales));
  const [favoritosError, setFavoritosError] = useState<string | null>(null);
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [masFiltrosAbierto, setMasFiltrosAbierto] = useState(false);
  const [orden, setOrden] = useState("relevancia");

  const filtrosSecundariosActivos = [
    tipo, modalidad, salarioMin, salarioMax, experiencia,
  ].filter(Boolean).length + idiomas.length + caracteristicas.length;

  useEffect(() => {
    if (!provincia) {
      setMunicipiosDisponibles([]);
      return;
    }
    let cancelado = false;
    fetch(`/api/municipios?provincia=${encodeURIComponent(provincia)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelado) setMunicipiosDisponibles(data.municipios || []);
      });
    return () => {
      cancelado = true;
    };
  }, [provincia]);

  const toggleIdioma = (valor: string) => {
    setIdiomas((prev) => (prev.includes(valor) ? prev.filter((i) => i !== valor) : [...prev, valor]));
  };

  const toggleCaracteristica = (valor: string) => {
    setCaracteristicas((prev) =>
      prev.includes(valor) ? prev.filter((c) => c !== valor) : [...prev, valor]
    );
  };

  const toggleFavorito = async (anuncioId: string) => {
    if (!currentUserId) return;
    const esFavorito = favoritos.has(anuncioId);
    setFavoritosError(null);
    const { error } = esFavorito
      ? await supabase.from("favoritos").delete().eq("user_id", currentUserId).eq("anuncio_id", anuncioId)
      : await supabase.from("favoritos").insert({ user_id: currentUserId, anuncio_id: anuncioId });
    if (error) {
      console.error(error);
      setFavoritosError("No se pudo actualizar favoritos. Inténtalo de nuevo.");
      return;
    }
    setFavoritos((prev) => {
      const next = new Set(prev);
      if (esFavorito) next.delete(anuncioId);
      else next.add(anuncioId);
      return next;
    });
  };

  const filtrados = useMemo(() => {
    const tokens = tokenize(query);
    const salarioMinN = salarioMin ? Number(salarioMin) : null;
    const salarioMaxN = salarioMax ? Number(salarioMax) : null;

    return anuncios.filter((a) => {
      if (tokens.length > 0) {
        const haystack = [a.titulo, a.descripcion, a.ubicacion, a.provincia, a.municipio, ...(a.palabras_clave || [])]
          .join(" ")
          .toLowerCase();
        if (!tokens.some((t) => haystack.includes(t))) return false;
      }
      if (sector && a.sector_trabajo !== sector) return false;
      if (provincia && a.provincia !== provincia) return false;
      if (municipio && a.municipio !== municipio) return false;
      if (modalidad && a.modalidad_trabajo !== modalidad) return false;
      if (tipo && a.tipo !== tipo) return false;
      if (experiencia && a.experiencia_trabajo !== experiencia) return false;
      if (salarioMinN != null) {
        const max = a.salario_max ?? a.salario_min;
        if (max == null || max < salarioMinN) return false;
      }
      if (salarioMaxN != null) {
        const min = a.salario_min ?? a.salario_max;
        if (min == null || min > salarioMaxN) return false;
      }
      if (idiomas.length > 0) {
        const tiene: string[] = a.idiomas_trabajo || [];
        if (!idiomas.every((i) => tiene.includes(i))) return false;
      }
      if (caracteristicas.length > 0) {
        const tiene: string[] = a.caracteristicas || [];
        if (!caracteristicas.every((c) => tiene.includes(c))) return false;
      }
      return true;
    });
  }, [
    anuncios, query, sector, provincia, municipio, modalidad, tipo,
    salarioMin, salarioMax, experiencia, idiomas, caracteristicas,
  ]);

  const ordenados = useMemo(() => {
    if (orden === "relevancia") return filtrados;
    const salario = (a: any) => a.salario_max ?? a.salario_min ?? null;
    const conNulosAlFinal = (valor: (a: any) => number | null, desc: boolean) => (a: any, b: any) => {
      const va = valor(a);
      const vb = valor(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return desc ? vb - va : va - vb;
    };
    const copia = [...filtrados];
    switch (orden) {
      case "recientes":
        return copia.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "antiguos":
        return copia.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "salario_asc":
        return copia.sort(conNulosAlFinal(salario, false));
      case "salario_desc":
        return copia.sort(conNulosAlFinal(salario, true));
      default:
        return filtrados;
    }
  }, [filtrados, orden]);

  useEffect(() => {
    setVisibles(POR_PAGINA);
  }, [filtrados, orden]);

  return (
    <div>
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
        placeholder="Busca por puesto, habilidad o ciudad"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50/60 to-teal-50/40 rounded-xl p-3 mb-5 space-y-2.5">
        <div className="flex flex-wrap gap-2">
          <select
            className={SELECT_CLASS}
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            <option value="">Sector</option>
            {SECTORES_TRABAJO.map((s) => (
              <option key={s.valor} value={s.valor}>{s.label}</option>
            ))}
          </select>
          <select
            className={SELECT_CLASS}
            value={provincia}
            onChange={(e) => {
              setProvincia(e.target.value);
              setMunicipio("");
            }}
          >
            <option value="">Provincia</option>
            {PROVINCIAS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {provincia && municipiosDisponibles.length > 0 && (
            <select className={SELECT_CLASS} value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
              <option value="">Municipio</option>
              {municipiosDisponibles.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
          <select className={SELECT_CLASS} value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
            <option value="">Contrato</option>
            {MODALIDADES_TRABAJO.map((m) => (
              <option key={m.valor} value={m.valor}>{m.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setMasFiltrosAbierto((v) => !v)}
          className={
            "text-sm px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 " +
            (filtrosSecundariosActivos > 0
              ? "border-fuchsia-600 text-fuchsia-700 font-medium"
              : "border-stone-300 text-stone-600")
          }
        >
          Más filtros{filtrosSecundariosActivos > 0 ? ` (${filtrosSecundariosActivos})` : ""}
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={masFiltrosAbierto ? "rotate-180" : ""}
          >
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {masFiltrosAbierto && (
          <div className="space-y-2.5 pt-1 border-t border-stone-100">
            <div className="flex flex-wrap gap-2 pt-2">
              <select className={SELECT_CLASS} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Busco o ofrezco</option>
                <option value="busco">Busco empleo</option>
                <option value="ofrezco">Ofrezco empleo</option>
              </select>
              <select className={SELECT_CLASS} value={experiencia} onChange={(e) => setExperiencia(e.target.value)}>
                <option value="">Experiencia</option>
                {EXPERIENCIA_TRABAJO.map((ex) => (
                  <option key={ex.valor} value={ex.valor}>{ex.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                className={INPUT_CLASS}
                placeholder="Salario mínimo €"
                type="number"
                min="0"
                value={salarioMin}
                onChange={(e) => setSalarioMin(e.target.value)}
              />
              <input
                className={INPUT_CLASS}
                placeholder="Salario máximo €"
                type="number"
                min="0"
                value={salarioMax}
                onChange={(e) => setSalarioMax(e.target.value)}
              />
            </div>

            <div>
              <p className="text-xs text-stone-400 mb-1.5">Idiomas</p>
              <div className="flex flex-wrap gap-1.5">
                {IDIOMAS_TRABAJO.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleIdioma(i)}
                    className={
                      "text-xs px-2.5 py-1.5 rounded-full border " +
                      (idiomas.includes(i)
                        ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700 font-medium"
                        : "border-stone-200 text-stone-500")
                    }
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setCaracteristicasAbierto((v) => !v)}
                className={
                  SELECT_CLASS +
                  " inline-flex items-center justify-between gap-2 " +
                  (caracteristicas.length > 0 ? "border-fuchsia-600 text-fuchsia-700 font-medium" : "")
                }
              >
                <span>Características{caracteristicas.length > 0 ? ` (${caracteristicas.length})` : ""}</span>
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {caracteristicasAbierto && (
                <div className="absolute z-10 mt-1 w-64 border border-stone-200 rounded-lg bg-white shadow-md p-2 space-y-1">
                  {CARACTERISTICAS_TRABAJO.map((c) => (
                    <label key={c.valor} className="flex items-center gap-2 text-sm px-1.5 py-1 rounded hover:bg-stone-50">
                      <input
                        type="checkbox"
                        checked={caracteristicas.includes(c.valor)}
                        onChange={() => toggleCaracteristica(c.valor)}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-sm text-stone-500">
          {filtrados.length} {filtrados.length === 1 ? "anuncio encontrado" : "anuncios encontrados"}
        </p>
        <select
          className={SELECT_CLASS}
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          aria-label="Ordenar por"
        >
          {ORDEN_OPCIONES.map((o) => (
            <option key={o.valor} value={o.valor}>
              Ordenar: {o.label}
            </option>
          ))}
        </select>
      </div>

      {favoritosError && <p role="alert" className="text-sm text-red-600 mb-3">{favoritosError}</p>}

      {anuncios.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-10">
          Todavía no hay anuncios publicados. Sé la primera persona en publicar uno.
        </p>
      )}

      {anuncios.length > 0 && filtrados.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-10">
          No hay anuncios que coincidan con estos filtros.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {ordenados.slice(0, visibles).map((a) => (
          <AnuncioCard
            key={a.id}
            anuncio={a}
            isOwner={a.user_id === currentUserId}
            esFavorito={favoritos.has(a.id)}
            onToggleFavorito={currentUserId ? () => toggleFavorito(a.id) : undefined}
          />
        ))}
      </div>

      {filtrados.length > visibles && (
        <button
          type="button"
          onClick={() => setVisibles((v) => v + POR_PAGINA)}
          className="w-full mt-3 text-sm border border-stone-300 rounded-lg py-2.5 text-stone-600 hover:bg-stone-50"
        >
          Cargar más
        </button>
      )}
    </div>
  );
}

