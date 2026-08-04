"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { etiquetasTipo } from "@/lib/categorias";
import { TIPOS_INMUEBLE, OPERACIONES, CARACTERISTICAS, DURACIONES_ALQUILER } from "@/lib/inmobiliaria";

type Anuncio = {
  id: string;
  categoria: string;
  tipo: "busco" | "ofrezco";
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  palabras_clave: string[];
  nombre_contacto: string;
  email_contacto: string;
  user_id: string;
  operacion?: string | null;
  provincia?: string | null;
  tipo_inmueble?: string | null;
  precio?: number | null;
  habitaciones?: number | null;
  banos?: number | null;
  amueblado?: boolean | null;
  tamano?: number | null;
  caracteristicas?: string[];
  duracion_alquiler?: string | null;
};

export default function AnuncioCard({
  anuncio,
  isOwner,
  esFavorito,
  onToggleFavorito,
}: {
  anuncio: Anuncio;
  isOwner: boolean;
  esFavorito?: boolean;
  onToggleFavorito?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  const eliminar = async () => {
    if (!confirm("¿Eliminar este anuncio? No se puede deshacer.")) return;
    setDeleting(true);
    const { error } = await supabase.from("anuncios").delete().eq("id", anuncio.id);
    setDeleting(false);
    if (!error) router.refresh();
  };

  const esOferta = anuncio.tipo === "ofrezco";
  const [etiquetaBusco, etiquetaOfrezco] = etiquetasTipo(anuncio.categoria);
  const esInmobiliaria = anuncio.categoria === "inmobiliaria";

  return (
    <div className="border border-stone-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={
                "text-xs font-medium px-2 py-0.5 rounded-full border " +
                (esOferta
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-teal-50 text-teal-700 border-teal-200")
              }
            >
              {esOferta ? etiquetaOfrezco : etiquetaBusco}
            </span>
            {esInmobiliaria && anuncio.operacion && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200">
                {OPERACIONES.find((o) => o.valor === anuncio.operacion)?.label}
              </span>
            )}
            {esInmobiliaria && anuncio.tipo_inmueble && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-stone-50 text-stone-600 border-stone-200">
                {TIPOS_INMUEBLE.find((t) => t.valor === anuncio.tipo_inmueble)?.label}
              </span>
            )}
          </div>
          <p className="font-medium text-stone-900 mt-1.5">{anuncio.titulo}</p>
          {(anuncio.provincia || anuncio.ubicacion) && (
            <p className="text-sm text-stone-500">
              {[anuncio.provincia, anuncio.ubicacion].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleFavorito && (
            <button
              onClick={onToggleFavorito}
              aria-label={esFavorito ? "Quitar de favoritos" : "Añadir a favoritos"}
              className={"text-lg leading-none " + (esFavorito ? "text-fuchsia-600" : "text-stone-300 hover:text-stone-400")}
            >
              {esFavorito ? "★" : "☆"}
            </button>
          )}
          {isOwner && (
            <button
              onClick={eliminar}
              disabled={deleting}
              className="text-xs text-red-500 hover:underline disabled:opacity-40"
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          )}
        </div>
      </div>

      {esInmobiliaria && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-stone-600">
          {anuncio.precio != null && <span>{anuncio.precio.toLocaleString("es-ES")} €</span>}
          {anuncio.tamano != null && <span>{anuncio.tamano} m²</span>}
          {anuncio.habitaciones != null && <span>{anuncio.habitaciones} hab.</span>}
          {anuncio.banos != null && <span>{anuncio.banos} baños</span>}
          {anuncio.amueblado != null && <span>{anuncio.amueblado ? "Amueblado" : "Sin amueblar"}</span>}
          {anuncio.duracion_alquiler && (
            <span>{DURACIONES_ALQUILER.find((d) => d.valor === anuncio.duracion_alquiler)?.label}</span>
          )}
        </div>
      )}

      {esInmobiliaria && anuncio.caracteristicas && anuncio.caracteristicas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {anuncio.caracteristicas.map((c) => (
            <span
              key={c}
              className="text-xs px-2 py-0.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
            >
              {CARACTERISTICAS.find((x) => x.valor === c)?.label ?? c}
            </span>
          ))}
        </div>
      )}

      {anuncio.descripcion && (
        <p className="text-sm text-stone-600 mt-2">{anuncio.descripcion}</p>
      )}

      {anuncio.palabras_clave?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {anuncio.palabras_clave.map((k, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full border border-stone-200 bg-stone-50 text-stone-500"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-stone-400 mt-2">
        Contacto: {anuncio.nombre_contacto} · {anuncio.email_contacto}
      </p>
    </div>
  );
}
