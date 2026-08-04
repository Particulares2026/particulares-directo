"use client";

import { useMemo, useState } from "react";
import AnuncioCard from "./AnuncioCard";
import { createClient } from "@/lib/supabase/client";
import { PROVINCIAS, TIPOS_INMUEBLE, OPERACIONES } from "@/lib/inmobiliaria";

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const SELECT_CLASS =
  "border border-stone-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white";
const INPUT_CLASS =
  "border border-stone-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 w-full";

export default function FiltrosInmobiliaria({
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
  const [operacion, setOperacion] = useState("");
  const [tipo, setTipo] = useState("");
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [provincia, setProvincia] = useState("");
  const [tipoInmueble, setTipoInmueble] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [habitaciones, setHabitaciones] = useState("");
  const [banos, setBanos] = useState("");
  const [amueblado, setAmueblado] = useState("");
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set(favoritosIniciales));

  const toggleFavorito = async (anuncioId: string) => {
    if (!currentUserId) return;
    const esFavorito = favoritos.has(anuncioId);
    const next = new Set(favoritos);
    if (esFavorito) next.delete(anuncioId);
    else next.add(anuncioId);
    setFavoritos(next);

    if (esFavorito) {
      await supabase
        .from("favoritos")
        .delete()
        .eq("user_id", currentUserId)
        .eq("anuncio_id", anuncioId);
    } else {
      await supabase.from("favoritos").insert({ user_id: currentUserId, anuncio_id: anuncioId });
    }
  };

  const filtrados = useMemo(() => {
    const tokens = tokenize(query);
    const min = precioMin ? Number(precioMin) : null;
    const max = precioMax ? Number(precioMax) : null;
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
      if (soloFavoritos && !favoritos.has(a.id)) return false;
      if (provincia && a.provincia !== provincia) return false;
      if (tipoInmueble && a.tipo_inmueble !== tipoInmueble) return false;
      if (min != null && (a.precio == null || a.precio < min)) return false;
      if (max != null && (a.precio == null || a.precio > max)) return false;
      if (habMin != null && (a.habitaciones == null || a.habitaciones < habMin)) return false;
      if (banosMin != null && (a.banos == null || a.banos < banosMin)) return false;
      if (amueblado && (a.amueblado == null || (a.amueblado ? "si" : "no") !== amueblado)) return false;
      return true;
    });
  }, [
    anuncios, query, operacion, tipo, soloFavoritos, favoritos,
    provincia, tipoInmueble, precioMin, precioMax, habitaciones, banos, amueblado,
  ]);

  return (
    <div>
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
        placeholder="Busca por título, palabra clave o ubicación"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="border border-stone-200 rounded-xl p-3 mb-5 space-y-2.5">
        <div className="flex flex-wrap gap-2">
          <select className={SELECT_CLASS} value={operacion} onChange={(e) => setOperacion(e.target.value)}>
            <option value="">Venta o alquiler</option>
            {OPERACIONES.map((o) => (
              <option key={o.valor} value={o.valor}>{o.label}</option>
            ))}
          </select>
          <select className={SELECT_CLASS} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Ofertas o demandas</option>
            <option value="ofrezco">Ofertas</option>
            <option value="busco">Demandas</option>
          </select>
          <select className={SELECT_CLASS} value={tipoInmueble} onChange={(e) => setTipoInmueble(e.target.value)}>
            <option value="">Tipo de inmueble</option>
            {TIPOS_INMUEBLE.map((t) => (
              <option key={t.valor} value={t.valor}>{t.label}</option>
            ))}
          </select>
          <select className={SELECT_CLASS} value={provincia} onChange={(e) => setProvincia(e.target.value)}>
            <option value="">Provincia</option>
            {PROVINCIAS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select className={SELECT_CLASS} value={amueblado} onChange={(e) => setAmueblado(e.target.value)}>
            <option value="">Amueblado o sin amueblar</option>
            <option value="si">Amueblado</option>
            <option value="no">Sin amueblar</option>
          </select>
          {currentUserId && (
            <button
              type="button"
              onClick={() => setSoloFavoritos((v) => !v)}
              className={
                "text-sm px-3 py-2 rounded-lg border " +
                (soloFavoritos
                  ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700 font-medium"
                  : "border-stone-300 text-stone-500")
              }
            >
              ★ Solo mis favoritos
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            className={INPUT_CLASS + " w-28"}
            placeholder="Precio mín. €"
            type="number"
            min="0"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
          />
          <input
            className={INPUT_CLASS + " w-28"}
            placeholder="Precio máx. €"
            type="number"
            min="0"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
          />
          <select className={SELECT_CLASS} value={habitaciones} onChange={(e) => setHabitaciones(e.target.value)}>
            <option value="">Habitaciones</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}+ hab.</option>
            ))}
          </select>
          <select className={SELECT_CLASS} value={banos} onChange={(e) => setBanos(e.target.value)}>
            <option value="">Baños</option>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>{n}+ baños</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-stone-500 mb-3">
        {filtrados.length} {filtrados.length === 1 ? "inmueble encontrado" : "inmuebles encontrados"}
      </p>

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

      <div className="space-y-3">
        {filtrados.map((a) => (
          <AnuncioCard
            key={a.id}
            anuncio={a}
            isOwner={a.user_id === currentUserId}
            esFavorito={favoritos.has(a.id)}
            onToggleFavorito={currentUserId ? () => toggleFavorito(a.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
