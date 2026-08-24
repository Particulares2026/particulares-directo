"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import AnuncioCard from "./AnuncioCard";
import AlertasBusqueda from "./AlertasBusqueda";
import { createClient } from "@/lib/supabase/client";
import {
  PROVINCIAS,
  TIPOS_INMUEBLE,
  OPERACIONES,
  CARACTERISTICAS,
  DURACIONES_ALQUILER,
  ESTADOS_INMUEBLE,
} from "@/lib/inmobiliaria";

const MapaAnuncios = dynamic(() => import("./mapa/MapaAnuncios"), {
  ssr: false,
  loading: () => <div className="h-[480px] rounded-lg border border-stone-200 bg-stone-50 animate-pulse" />,
});

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const POR_PAGINA = 20;

const SELECT_CLASS =
  "min-h-11 w-full max-w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-base focus:outline-none focus:ring-2 focus:ring-teal-600 sm:w-auto sm:text-sm";
const INPUT_CLASS =
  "min-h-11 w-full rounded-lg border border-stone-300 px-2.5 py-2 text-base focus:outline-none focus:ring-2 focus:ring-teal-600 sm:text-sm";

const ORDEN_OPCIONES = [
  { valor: "relevancia", label: "Relevancia" },
  { valor: "bajada_precio", label: "Han bajado de precio" },
  { valor: "recientes", label: "Más recientes" },
  { valor: "antiguos", label: "Más antiguos" },
  { valor: "precio_asc", label: "Precio: menor a mayor" },
  { valor: "precio_desc", label: "Precio: mayor a menor" },
  { valor: "preciom2_asc", label: "€/m²: menor a mayor" },
  { valor: "preciom2_desc", label: "€/m²: mayor a menor" },
];

export default function FiltrosInmobiliaria({
  anuncios,
  currentUserId,
  userEmail,
  favoritosIniciales,
}: {
  anuncios: any[];
  currentUserId: string | null;
  userEmail: string | null;
  favoritosIniciales: string[];
}) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [operacion, setOperacion] = useState("");
  const [tipo, setTipo] = useState("");
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [municipiosDisponibles, setMunicipiosDisponibles] = useState<string[]>([]);
  const [tipoInmueble, setTipoInmueble] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [tamanoMin, setTamanoMin] = useState("");
  const [tamanoMax, setTamanoMax] = useState("");
  const [habitaciones, setHabitaciones] = useState("");
  const [banos, setBanos] = useState("");
  const [amueblado, setAmueblado] = useState("");
  const [duracionAlquiler, setDuracionAlquiler] = useState("");
  const [estado, setEstado] = useState("");
  const [caracteristicas, setCaracteristicas] = useState<string[]>([]);
  const [caracteristicasAbierto, setCaracteristicasAbierto] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set(favoritosIniciales));
  const [favoritosError, setFavoritosError] = useState<string | null>(null);
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [vista, setVista] = useState<"lista" | "mapa">("lista");
  const [masFiltrosAbierto, setMasFiltrosAbierto] = useState(false);
  const [orden, setOrden] = useState("relevancia");

  const filtrosSecundariosActivos = [
    tipo, amueblado, duracionAlquiler, tamanoMin, tamanoMax,
    habitaciones, banos, estado, soloFavoritos ? "si" : "",
  ].filter(Boolean).length + caracteristicas.length;

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
      ? await supabase
        .from("favoritos")
        .delete()
        .eq("user_id", currentUserId)
        .eq("anuncio_id", anuncioId)
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
    const precioMinN = precioMin ? Number(precioMin) : null;
    const precioMaxN = precioMax ? Number(precioMax) : null;
    const tamanoMinN = tamanoMin ? Number(tamanoMin) : null;
    const tamanoMaxN = tamanoMax ? Number(tamanoMax) : null;
    const habMin = habitaciones ? Number(habitaciones) : null;
    const banosMin = banos ? Number(banos) : null;

    return anuncios.filter((a) => {
      if (tokens.length > 0) {
        const haystack = [a.titulo, a.descripcion, a.ubicacion, a.provincia, ...(a.palabras_clave || [])]
          .join(" ")
          .toLowerCase();
        if (!tokens.some((t) => haystack.includes(t))) return false;
      }
      if (operacion && a.operacion !== operacion) return false;
      if (tipo && a.tipo !== tipo) return false;
      if (provincia && a.provincia !== provincia) return false;
      if (municipio && a.municipio !== municipio) return false;
      if (tipoInmueble && a.tipo_inmueble !== tipoInmueble) return false;
      if (precioMinN != null && (a.precio == null || a.precio < precioMinN)) return false;
      if (precioMaxN != null && (a.precio == null || a.precio > precioMaxN)) return false;
      if (tamanoMinN != null && (a.tamano == null || a.tamano < tamanoMinN)) return false;
      if (tamanoMaxN != null && (a.tamano == null || a.tamano > tamanoMaxN)) return false;
      if (habMin != null && (a.habitaciones == null || a.habitaciones < habMin)) return false;
      if (banosMin != null && (a.banos == null || a.banos < banosMin)) return false;
      if (amueblado && (a.amueblado == null || (a.amueblado ? "si" : "no") !== amueblado)) return false;
      if (duracionAlquiler && a.duracion_alquiler !== duracionAlquiler) return false;
      if (caracteristicas.length > 0) {
        const tiene: string[] = a.caracteristicas || [];
        if (!caracteristicas.every((c) => tiene.includes(c))) return false;
      }
      if (estado && a.estado !== estado) return false;
      if (soloFavoritos && !favoritos.has(a.id)) return false;
      return true;
    });
  }, [
    anuncios, query, operacion, tipo, provincia, municipio, tipoInmueble,
    precioMin, precioMax, tamanoMin, tamanoMax, habitaciones, banos,
    amueblado, duracionAlquiler, caracteristicas, estado, soloFavoritos, favoritos,
  ]);

  const ordenados = useMemo(() => {
    if (orden === "relevancia") return filtrados;

    const precioM2 = (a: any) => (a.precio != null && a.tamano ? a.precio / a.tamano : null);
    const bajada = (a: any) => (a.precio_anterior != null && a.precio != null ? a.precio_anterior - a.precio : null);

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
      case "precio_asc":
        return copia.sort(conNulosAlFinal((a) => a.precio, false));
      case "precio_desc":
        return copia.sort(conNulosAlFinal((a) => a.precio, true));
      case "preciom2_asc":
        return copia.sort(conNulosAlFinal(precioM2, false));
      case "preciom2_desc":
        return copia.sort(conNulosAlFinal(precioM2, true));
      case "bajada_precio":
        return copia.sort(conNulosAlFinal(bajada, true));
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
        aria-label="Buscar anuncios inmobiliarios"
        className="mb-3 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
        placeholder="Busca por título, palabra clave o ubicación"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50/60 to-teal-50/40 rounded-xl p-3 mb-5 space-y-2.5">
        <div className="flex flex-wrap gap-2">
          <select aria-label="Operación" className={SELECT_CLASS} value={operacion} onChange={(e) => setOperacion(e.target.value)}>
            <option value="">Venta o alquiler</option>
            {OPERACIONES.map((o) => (
              <option key={o.valor} value={o.valor}>{o.label}</option>
            ))}
          </select>
          <select aria-label="Tipo de inmueble" className={SELECT_CLASS} value={tipoInmueble} onChange={(e) => setTipoInmueble(e.target.value)}>
            <option value="">Tipo de inmueble</option>
            {TIPOS_INMUEBLE.map((t) => (
              <option key={t.valor} value={t.valor}>{t.label}</option>
            ))}
          </select>
          <select
            aria-label="Provincia"
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
            <select aria-label="Municipio" className={SELECT_CLASS} value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
              <option value="">Municipio</option>
              {municipiosDisponibles.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            aria-label="Precio mínimo"
            className={INPUT_CLASS}
            placeholder="Precio mínimo €"
            type="number"
            min="0"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
          />
          <input
            aria-label="Precio máximo"
            className={INPUT_CLASS}
            placeholder="Precio máximo €"
            type="number"
            min="0"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
          />
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
              <select aria-label="Ofertas o demandas" className={SELECT_CLASS} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Ofertas o demandas</option>
                <option value="ofrezco">Ofertas</option>
                <option value="busco">Demandas</option>
              </select>
              <select aria-label="Amueblado" className={SELECT_CLASS} value={amueblado} onChange={(e) => setAmueblado(e.target.value)}>
                <option value="">Amueblado o sin amueblar</option>
                <option value="si">Amueblado</option>
                <option value="no">Sin amueblar</option>
              </select>
              <select
                aria-label="Duración del alquiler"
                className={SELECT_CLASS}
                value={duracionAlquiler}
                onChange={(e) => setDuracionAlquiler(e.target.value)}
              >
                <option value="">Temporada o larga estancia</option>
                {DURACIONES_ALQUILER.map((d) => (
                  <option key={d.valor} value={d.valor}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                aria-label="Tamaño mínimo"
                className={INPUT_CLASS}
                placeholder="Tamaño mínimo m²"
                type="number"
                min="0"
                value={tamanoMin}
                onChange={(e) => setTamanoMin(e.target.value)}
              />
              <input
                aria-label="Tamaño máximo"
                className={INPUT_CLASS}
                placeholder="Tamaño máximo m²"
                type="number"
                min="0"
                value={tamanoMax}
                onChange={(e) => setTamanoMax(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-start">
              <select aria-label="Número mínimo de habitaciones" className={SELECT_CLASS} value={habitaciones} onChange={(e) => setHabitaciones(e.target.value)}>
                <option value="">Nº Habitaciones</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}+ hab.</option>
                ))}
              </select>
              <select aria-label="Número mínimo de baños" className={SELECT_CLASS} value={banos} onChange={(e) => setBanos(e.target.value)}>
                <option value="">Nº Baños</option>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>{n}+ baños</option>
                ))}
              </select>

              <div className="relative">
                <button
                  type="button"
                  aria-expanded={caracteristicasAbierto}
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
                  <div className="absolute z-10 mt-1 w-56 border border-stone-200 rounded-lg bg-white shadow-md p-2 space-y-1">
                    {CARACTERISTICAS.map((c) => (
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

            <div className="pt-1 flex flex-wrap items-center gap-2">
              {currentUserId && (
                  <button
                    type="button"
                    aria-pressed={soloFavoritos}
                  onClick={() => setSoloFavoritos((v) => !v)}
                  className={
                    "text-sm px-3 py-2 rounded-lg border font-medium " +
                    (soloFavoritos
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100")
                  }
                >
                  ❤ Solo mis favoritos
                </button>
              )}
              {ESTADOS_INMUEBLE.map((e) => (
                <button
                  key={e.valor}
                  type="button"
                  aria-pressed={estado === e.valor}
                  onClick={() => setEstado((prev) => (prev === e.valor ? "" : e.valor))}
                  className={
                    "inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border " +
                    (estado === e.valor
                      ? "border-stone-900 bg-stone-50 text-stone-900 font-medium"
                      : "border-stone-300 text-stone-600")
                  }
                >
                  <span className={"w-2.5 h-2.5 rounded-full shrink-0 " + e.color} aria-hidden="true" />
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertasBusqueda
        currentUserId={currentUserId}
        userEmail={userEmail}
        filtros={{
          query, operacion, tipo, provincia, tipoInmueble, precioMin, precioMax,
          tamanoMin, tamanoMax, habitaciones, banos, amueblado, duracionAlquiler,
          estado, caracteristicas,
        }}
      />

      {favoritosError && <p role="alert" className="text-sm text-red-600 mb-3">{favoritosError}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-sm text-stone-600">
          {filtrados.length} {filtrados.length === 1 ? "inmueble encontrado" : "inmuebles encontrados"}
        </p>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
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
          <div className="flex text-sm font-medium border-2 border-[#b00859] rounded-lg overflow-hidden shrink-0">
            <button
              type="button"
              aria-pressed={vista === "lista"}
              onClick={() => setVista("lista")}
              className={"px-4 py-1.5 " + (vista === "lista" ? "bg-[#b00859] text-white" : "text-[#a80754] hover:bg-fuchsia-50")}
            >
              Lista
            </button>
            <button
              type="button"
              aria-pressed={vista === "mapa"}
              onClick={() => setVista("mapa")}
              className={"px-4 py-1.5 " + (vista === "mapa" ? "bg-[#b00859] text-white" : "text-[#a80754] hover:bg-fuchsia-50")}
            >
              Mapa
            </button>
          </div>
        </div>
      </div>

      {anuncios.length === 0 && (
        <p className="text-sm text-stone-600 text-center py-10">
          Todavía no hay anuncios publicados. Sé la primera persona en publicar uno.
        </p>
      )}

      {anuncios.length > 0 && filtrados.length === 0 && (
        <p className="text-sm text-stone-600 text-center py-10">
          No hay anuncios que coincidan con estos filtros.
        </p>
      )}

      {vista === "mapa" && filtrados.length > 0 && <MapaAnuncios anuncios={filtrados} />}

      {vista === "lista" && (
        <>
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
        </>
      )}
    </div>
  );
}

