"use client";

import { useMemo, useState } from "react";
import AnuncioCard from "./AnuncioCard";

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function Buscador({
  anuncios,
  currentUserId,
}: {
  anuncios: any[];
  currentUserId: string | null;
}) {
  const [query, setQuery] = useState("");

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

  return (
    <div>
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
        placeholder="Busca por puesto, habilidad o ciudad (ej. React, Sevilla)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

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

      <div className="space-y-3">
        {filtrados.map((a) => (
          <AnuncioCard key={a.id} anuncio={a} isOwner={a.user_id === currentUserId} />
        ))}
      </div>
    </div>
  );
}
