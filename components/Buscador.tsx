"use client";

import { useMemo, useState } from "react";
import AnuncioCard from "./AnuncioCard";
import { createClient } from "@/lib/supabase/client";

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const POR_PAGINA = 20;

const SELECT_CLASS =
  "border border-stone-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white";

const ORDEN_OPCIONES = [
  { valor: "relevancia", label: "Relevancia" },
  { valor: "recientes", label: "Más recientes" },
  { valor: "antiguos", label: "Más antiguos" },
];

export default function Buscador({
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
  const [orden, setOrden] = useState("relevancia");
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set(favoritosIniciales));
  const [favoritosError, setFavoritosError] = useState<string | null>(null);

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
    if (tokens.length === 0) return anuncios;
    return anuncios.filter((a) => {
      const haystack = [a.titulo, a.descripcion, a.ubicacion, ...(a.palabras_clave || [])]
        .join(" ")
        .toLowerCase();
      return tokens.some((t) => haystack.includes(t));
    });
  }, [anuncios, query]);

  const ordenados = useMemo(() => {
    if (orden === "relevancia") return filtrados;
    const copia = [...filtrados];
    if (orden === "recientes") {
      return copia.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return copia.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [filtrados, orden]);

  return (
    <div>
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
        placeholder="Busca por puesto, habilidad o ciudad (ej. React, Sevilla)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setVisibles(POR_PAGINA);
        }}
      />

      {anuncios.length > 0 && (
        <div className="flex justify-end mb-3">
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
      )}

      {anuncios.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-10">
          Todavía no hay anuncios publicados. Sé la primera persona en publicar uno.
        </p>
      )}

      {anuncios.length > 0 && filtrados.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-10">
          No hay anuncios que coincidan con esa búsqueda.
        </p>
      )}

      {favoritosError && <p role="alert" className="text-sm text-red-600 mb-3">{favoritosError}</p>}

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

