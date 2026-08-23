"use client";

import { useState } from "react";
import Link from "next/link";
import { nombreCategoria } from "@/lib/categorias";

type AnuncioModeracion = {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  tipo: "busco" | "ofrezco";
  nombre_contacto: string;
  telefono_contacto: string | null;
  email_contacto: string | null;
  activo?: boolean;
  created_at: string;
  fotos?: string[];
};

export default function PanelModeracion({
  anunciosIniciales,
}: {
  anunciosIniciales: AnuncioModeracion[];
}) {
  const [anuncios, setAnuncios] = useState(anunciosIniciales);
  const [procesando, setProcesando] = useState<string | null>(null);

  const aceptar = async (id: string) => {
    setProcesando(id);
    const res = await fetch("/api/admin/aceptar-anuncio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => null);
    setProcesando(null);
    if (res.ok) {
      setAnuncios((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert(data?.error || "No se pudo aceptar el anuncio.");
    }
  };

  const eliminar = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}"? No se puede deshacer.`)) return;
    setProcesando(id);
    const res = await fetch("/api/admin/eliminar-anuncio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => null);
    setProcesando(null);
    if (res.ok) {
      setAnuncios((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert(data?.error || "No se pudo eliminar el anuncio.");
    }
  };

  if (anuncios.length === 0) {
    return <p className="text-sm text-stone-400 text-center py-10">No hay anuncios que revisar.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
      {anuncios.map((a) => (
        <div key={a.id} className="border border-stone-200 rounded-xl p-3 bg-white">
          {a.fotos?.[0] && (
            <img
              src={a.fotos[0]}
              alt={`Foto de ${a.titulo}`}
              className="w-full h-32 object-cover rounded-lg mb-3 border border-stone-100"
            />
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full border bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200">
                  {nombreCategoria(a.categoria)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full border bg-stone-50 text-stone-600 border-stone-200">
                  {a.tipo === "ofrezco" ? "Ofrezco" : "Busco"}
                </span>
                {a.activo === false && (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="font-medium text-stone-900">{a.titulo}</p>
              {a.descripcion && (
                <p className="text-sm text-stone-600 mt-1 line-clamp-3">{a.descripcion}</p>
              )}
              <p className="text-xs text-stone-400 mt-1.5">
                {a.nombre_contacto}
                {a.telefono_contacto ? ` · ${a.telefono_contacto}` : ""}
                {a.email_contacto ? ` · ${a.email_contacto}` : ""}
              </p>
              <p className="text-xs text-stone-300 mt-0.5">
                {new Date(a.created_at).toLocaleString("es-ES")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => aceptar(a.id)}
                disabled={procesando === a.id}
                className="text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg px-3 py-1.5 disabled:opacity-40"
              >
                {procesando === a.id ? "Procesando…" : "Aceptar"}
              </button>
              <Link href={`/anuncio/${a.id}`} target="_blank" className="text-xs text-teal-700 hover:underline">
                Ver anuncio
              </Link>
              <button
                onClick={() => eliminar(a.id, a.titulo)}
                disabled={procesando === a.id}
                className="text-xs text-red-600 hover:underline disabled:opacity-40"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
