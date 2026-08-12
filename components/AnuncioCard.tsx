"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { etiquetasTipo } from "@/lib/categorias";
import {
  TIPOS_INMUEBLE,
  OPERACIONES,
  CARACTERISTICAS,
  DURACIONES_ALQUILER,
  ESTADOS_INMUEBLE,
  FOTOS_BUCKET,
  extraerPathStorage,
} from "@/lib/inmobiliaria";
import { estaDestacado, precioDestacarTexto } from "@/lib/destacar";

type Anuncio = {
  id: string;
  categoria: string;
  tipo: "busco" | "ofrezco";
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  palabras_clave: string[];
  nombre_contacto: string;
  telefono_contacto: string | null;
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
  fotos?: string[];
  estado?: string | null;
  activo?: boolean;
  destacado_hasta?: string | null;
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
  const [gestionando, setGestionando] = useState(false);
  const [destacando, setDestacando] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  const eliminar = async () => {
    if (!confirm("¿Eliminar este anuncio? No se puede deshacer.")) return;
    setDeleting(true);
    const { error } = await supabase.from("anuncios").delete().eq("id", anuncio.id);
    if (!error && anuncio.fotos && anuncio.fotos.length > 0) {
      const paths = anuncio.fotos.map(extraerPathStorage).filter((p): p is string => Boolean(p));
      if (paths.length > 0) await supabase.storage.from(FOTOS_BUCKET).remove(paths);
    }
    setDeleting(false);
    if (!error) router.refresh();
  };

  const actualizar = async () => {
    setGestionando(true);
    await supabase
      .from("anuncios")
      .update({
        activo: true,
        fecha_activacion: new Date().toISOString(),
        aviso_5_enviado: false,
        aviso_3_enviado: false,
      })
      .eq("id", anuncio.id);
    setGestionando(false);
    router.refresh();
  };

  const activar = actualizar;

  const desactivar = async () => {
    setGestionando(true);
    await supabase.from("anuncios").update({ activo: false }).eq("id", anuncio.id);
    setGestionando(false);
    router.refresh();
  };

  const destacar = async () => {
    setDestacando(true);
    try {
      const res = await fetch("/api/destacar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anuncioId: anuncio.id }),
      });
      const data = await res.json().catch(() => null);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      alert(data?.error || "No se pudo iniciar el pago. Inténtalo de nuevo en un momento.");
    } catch {
      alert("No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setDestacando(false);
    }
  };

  const esOferta = anuncio.tipo === "ofrezco";
  const [etiquetaBusco, etiquetaOfrezco] = etiquetasTipo(anuncio.categoria);
  const esInmobiliaria = anuncio.categoria === "inmobiliaria";
  const destacado = estaDestacado(anuncio.destacado_hasta);

  return (
    <div
      className={
        "rounded-xl p-4 border " +
        (destacado ? "border-amber-300 bg-amber-50/40" : "border-stone-200")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {destacado && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-300">
                ★ Destacado
              </span>
            )}
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
            {anuncio.activo === false && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">
                Inactivo
              </span>
            )}
            {esInmobiliaria && anuncio.estado && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border bg-stone-50 text-stone-600 border-stone-200">
                <span
                  className={"w-2 h-2 rounded-full " + ESTADOS_INMUEBLE.find((e) => e.valor === anuncio.estado)?.color}
                  aria-hidden="true"
                />
                {ESTADOS_INMUEBLE.find((e) => e.valor === anuncio.estado)?.label}
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
            <Link href={`/editar/${anuncio.id}`} className="text-xs text-teal-700 hover:underline">
              Editar
            </Link>
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

      {anuncio.fotos && anuncio.fotos.length > 0 && (
        <div className="relative mt-2">
          <div className="flex gap-2 overflow-x-auto">
            {anuncio.fotos.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0"
                onMouseEnter={() => setFotoAmpliada(url)}
                onMouseLeave={() => setFotoAmpliada(null)}
                onTouchStart={() => setFotoAmpliada(url)}
                onTouchEnd={() => setFotoAmpliada(null)}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="h-28 w-28 object-cover rounded-lg border border-stone-200"
                />
              </a>
            ))}
          </div>
          {fotoAmpliada && (
            <img
              src={fotoAmpliada}
              alt=""
              className="pointer-events-none absolute left-0 top-0 z-20 w-56 h-56 max-w-[75vw] max-h-[75vw] object-cover rounded-lg border border-stone-300 shadow-lg"
            />
          )}
        </div>
      )}

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
        Contacto: {anuncio.nombre_contacto}
        {anuncio.telefono_contacto ? ` · ${anuncio.telefono_contacto}` : ""}
      </p>

      {isOwner && (
        <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-stone-100">
          {anuncio.activo !== false && (
            <button
              onClick={actualizar}
              disabled={gestionando}
              className="text-xs text-teal-700 hover:underline disabled:opacity-40"
            >
              Actualizar
            </button>
          )}
          {anuncio.activo === false ? (
            <button
              onClick={activar}
              disabled={gestionando}
              className="text-xs text-teal-700 hover:underline disabled:opacity-40"
            >
              Activar
            </button>
          ) : (
            <button
              onClick={desactivar}
              disabled={gestionando}
              className="text-xs text-stone-500 hover:underline disabled:opacity-40"
            >
              Desactivar
            </button>
          )}
          {destacado ? (
            <span className="text-xs text-amber-700">
              Destacado hasta {new Date(anuncio.destacado_hasta as string).toLocaleDateString("es-ES")}
            </span>
          ) : (
            <button
              onClick={destacar}
              disabled={destacando}
              className="text-xs text-amber-700 hover:underline disabled:opacity-40"
            >
              {destacando ? "Redirigiendo…" : `★ Destacar anuncio (${precioDestacarTexto(anuncio.categoria)})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
