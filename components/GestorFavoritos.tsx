"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AnuncioCard from "./AnuncioCard";

type Lista = { id: string; nombre: string };
type Favorito = { anuncio_id: string; lista_id: string | null; anuncios: any };

const SIN_CLASIFICAR = "sin-clasificar";
const TODOS = "todos";

export default function GestorFavoritos({
  currentUserId,
  listasIniciales,
  favoritosIniciales,
}: {
  currentUserId: string;
  listasIniciales: Lista[];
  favoritosIniciales: Favorito[];
}) {
  const supabase = createClient();
  const [listas, setListas] = useState<Lista[]>(listasIniciales);
  const [favoritos, setFavoritos] = useState<Favorito[]>(
    favoritosIniciales.filter((f) => f.anuncios)
  );
  const [pestana, setPestana] = useState<string>(TODOS);
  const [nuevaLista, setNuevaLista] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibles = useMemo(() => {
    if (pestana === TODOS) return favoritos;
    if (pestana === SIN_CLASIFICAR) return favoritos.filter((f) => !f.lista_id);
    return favoritos.filter((f) => f.lista_id === pestana);
  }, [favoritos, pestana]);

  const crearLista = async () => {
    const nombre = nuevaLista.trim();
    if (!nombre) return;
    setCreando(true);
    setError(null);
    const { data, error: crearError } = await supabase
      .from("listas_favoritos")
      .insert({ user_id: currentUserId, nombre })
      .select("id, nombre")
      .single();
    setCreando(false);
    if (crearError || !data) {
      console.error(crearError);
      setError("No se pudo crear la lista. Inténtalo de nuevo.");
      return;
    }
    setListas((prev) => [...prev, data]);
    setNuevaLista("");
    setPestana(data.id);
  };

  const eliminarLista = async (id: string) => {
    if (!confirm("¿Eliminar esta lista? Los favoritos que contiene no se borran, quedarán sin clasificar.")) return;
    setError(null);
    const { error: eliminarError } = await supabase.from("listas_favoritos").delete().eq("id", id);
    if (eliminarError) {
      console.error(eliminarError);
      setError("No se pudo eliminar la lista. Inténtalo de nuevo.");
      return;
    }
    setListas((prev) => prev.filter((l) => l.id !== id));
    setFavoritos((prev) => prev.map((f) => (f.lista_id === id ? { ...f, lista_id: null } : f)));
    if (pestana === id) setPestana(TODOS);
  };

  const moverAFavorito = async (anuncioId: string, listaId: string | null) => {
    setError(null);
    const { error: moverError } = await supabase
      .from("favoritos")
      .update({ lista_id: listaId })
      .eq("user_id", currentUserId)
      .eq("anuncio_id", anuncioId);
    if (moverError) {
      console.error(moverError);
      setError("No se pudo cambiar el favorito de lista. Inténtalo de nuevo.");
      return;
    }
    setFavoritos((prev) =>
      prev.map((f) => (f.anuncio_id === anuncioId ? { ...f, lista_id: listaId } : f))
    );
  };

  const quitarFavorito = async (anuncioId: string) => {
    setError(null);
    const { error: quitarError } = await supabase
      .from("favoritos")
      .delete()
      .eq("user_id", currentUserId)
      .eq("anuncio_id", anuncioId);
    if (quitarError) {
      console.error(quitarError);
      setError("No se pudo quitar el anuncio de favoritos. Inténtalo de nuevo.");
      return;
    }
    setFavoritos((prev) => prev.filter((f) => f.anuncio_id !== anuncioId));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          type="button"
          onClick={() => setPestana(TODOS)}
          className={
            "text-sm px-3 py-1.5 rounded-lg border " +
            (pestana === TODOS ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700 font-medium" : "border-stone-300 text-stone-600")
          }
        >
          Todos ({favoritos.length})
        </button>
        <button
          type="button"
          onClick={() => setPestana(SIN_CLASIFICAR)}
          className={
            "text-sm px-3 py-1.5 rounded-lg border " +
            (pestana === SIN_CLASIFICAR ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700 font-medium" : "border-stone-300 text-stone-600")
          }
        >
          Sin clasificar ({favoritos.filter((f) => !f.lista_id).length})
        </button>
        {listas.map((l) => (
          <div key={l.id} className="flex items-stretch">
            <button
              type="button"
              onClick={() => setPestana(l.id)}
              className={
                "text-sm pl-3 pr-2 py-1.5 rounded-l-lg border " +
                (pestana === l.id ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700 font-medium" : "border-stone-300 text-stone-600")
              }
            >
              {l.nombre} ({favoritos.filter((f) => f.lista_id === l.id).length})
            </button>
            <button
              type="button"
              onClick={() => eliminarLista(l.id)}
              aria-label={`Eliminar lista ${l.nombre}`}
              className={
                "text-sm px-2 rounded-r-lg border border-l-0 text-stone-400 hover:text-red-600 " +
                (pestana === l.id ? "border-fuchsia-600 bg-fuchsia-50" : "border-stone-300")
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <input
            className="border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="Nombre de una lista nueva (ej. Para visitar)"
            value={nuevaLista}
            onChange={(e) => setNuevaLista(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                crearLista();
              }
            }}
          />
          <button
            type="button"
            onClick={crearLista}
            disabled={creando || !nuevaLista.trim()}
            className="shrink-0 text-sm border border-stone-300 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 disabled:opacity-40"
          >
            + Nueva lista
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {favoritos.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-10">
          Todavía no has guardado ningún anuncio como favorito. Pincha el corazón ♡ en un anuncio para añadirlo aquí.
        </p>
      )}

      {favoritos.length > 0 && visibles.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-10">No hay favoritos en esta lista.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {visibles.map((f) => (
          <div key={f.anuncio_id}>
            <AnuncioCard
              anuncio={f.anuncios}
              isOwner={f.anuncios.user_id === currentUserId}
              esFavorito={true}
              onToggleFavorito={() => quitarFavorito(f.anuncio_id)}
            />
            {listas.length > 0 && (
              <div className="flex items-center gap-2 mt-1.5 px-1 min-w-0">
                <span className="text-xs text-stone-400 shrink-0">Lista:</span>
                <select
                  className="text-xs border border-stone-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 max-w-full min-w-0"
                  value={f.lista_id ?? ""}
                  onChange={(e) => moverAFavorito(f.anuncio_id, e.target.value || null)}
                >
                  <option value="">Sin clasificar</option>
                  {listas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

