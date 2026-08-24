"use client";

import { useState } from "react";
import Link from "next/link";
import { nombreCategoria } from "@/lib/categorias";

type AnuncioModeracion = {
  id: string;
  user_id: string;
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
  es_empresa: boolean;
  anuncios_activos_categoria: number;
};

const FORMATO_FECHA = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

type ResumenEmpresa = {
  categoria: string;
  cuentas: number;
  anuncios: number;
};

export default function PanelModeracion({
  anunciosIniciales,
  resumenEmpresas,
}: {
  anunciosIniciales: AnuncioModeracion[];
  resumenEmpresas: ResumenEmpresa[];
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4" aria-labelledby="resumen-empresas">
        <h2 id="resumen-empresas" className="font-medium text-violet-950">🏢 Cuentas empresa detectadas</h2>
        <p className="mt-1 text-xs text-violet-900/70">
          Una cuenta aparece aquí cuando mantiene dos o más anuncios activos en la misma categoría. La publicación está configurada como gratuita.
        </p>
        {resumenEmpresas.length === 0 ? (
          <p className="mt-3 text-sm text-violet-800">Todavía no hay cuentas empresa.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {resumenEmpresas.map((resumen) => (
              <div key={resumen.categoria} className="rounded-xl border border-violet-100 bg-white px-3 py-2">
                <p className="text-sm font-medium text-violet-950">{nombreCategoria(resumen.categoria)}</p>
                <p className="text-xs text-violet-800/70">
                  {resumen.cuentas} {resumen.cuentas === 1 ? "cuenta empresa" : "cuentas empresa"} · {resumen.anuncios} anuncios activos
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {anuncios.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-10">No hay anuncios que revisar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
      {anuncios.map((a) => (
        <div
          key={a.id}
          className={
            "rounded-xl border p-3 bg-white " +
            (a.es_empresa ? "border-violet-300 ring-1 ring-violet-100" : "border-stone-200")
          }
        >
          {a.fotos?.[0] && (
            <img
              src={a.fotos[0]}
              alt={`Foto de ${a.titulo}`}
              className="w-full h-32 object-cover rounded-lg mb-3 border border-stone-100"
            />
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full border bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200">
                  {nombreCategoria(a.categoria)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full border bg-stone-50 text-stone-600 border-stone-200">
                  {a.tipo === "ofrezco" ? "Ofrezco" : "Busco"}
                </span>
                <span
                  className={
                    "text-xs px-2 py-0.5 rounded-full border " +
                    (a.es_empresa
                      ? "bg-violet-100 text-violet-800 border-violet-200"
                      : "bg-sky-50 text-sky-700 border-sky-200")
                  }
                >
                  {a.es_empresa ? "🏢 Empresa" : "👤 Particular"}
                </span>
                {a.activo === false && (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="break-words font-medium text-stone-900">{a.titulo}</p>
              {a.descripcion && (
                <p className="text-sm text-stone-600 mt-1 line-clamp-3">{a.descripcion}</p>
              )}
              <p className="mt-1.5 break-all text-xs text-stone-400 sm:break-normal">
                {a.nombre_contacto}
                {a.telefono_contacto ? ` · ${a.telefono_contacto}` : ""}
                {a.email_contacto ? ` · ${a.email_contacto}` : ""}
              </p>
              <p className="text-xs text-stone-300 mt-0.5">
                {FORMATO_FECHA.format(new Date(a.created_at))}
              </p>
              <p className="text-xs text-violet-600 mt-0.5">
                {a.anuncios_activos_categoria} {a.anuncios_activos_categoria === 1 ? "anuncio activo" : "anuncios activos"} en esta categoría
              </p>
            </div>
            <div className="flex w-full flex-row flex-wrap items-center justify-end gap-2 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end">
              <button
                onClick={() => aceptar(a.id)}
                disabled={procesando === a.id}
                className="inline-flex min-h-10 items-center rounded-lg bg-teal-600 px-4 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-40"
              >
                {procesando === a.id ? "Procesando…" : "Aceptar"}
              </button>
              <Link href={`/anuncio/${a.id}`} target="_blank" className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs text-teal-700 hover:bg-teal-50 hover:underline">
                Ver anuncio
              </Link>
              <button
                onClick={() => eliminar(a.id, a.titulo)}
                disabled={procesando === a.id}
                className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs text-red-600 hover:bg-red-50 hover:underline disabled:opacity-40"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
        </div>
      )}
    </div>
  );
}

