"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { etiquetasTipo, colorCategoria } from "@/lib/categorias";
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
import {
  CARACTERISTICAS_TRABAJO,
  nombreSector,
  nombreModalidad,
  nombreExperiencia,
  textoSalario,
} from "@/lib/trabajo";
import GraficoPrecios from "./GraficoPrecios";

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
  mostrar_telefono?: boolean;
  mostrar_email?: boolean;
  user_id: string;
  operacion?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  tipo_inmueble?: string | null;
  precio?: number | null;
  precio_anterior?: number | null;
  habitaciones?: number | null;
  banos?: number | null;
  amueblado?: boolean | null;
  tamano?: number | null;
  caracteristicas?: string[];
  duracion_alquiler?: string | null;
  fotos?: string[];
  estado?: string | null;
  enlaces_externos?: string[];
  activo?: boolean;
  destacado_hasta?: string | null;
  sector_trabajo?: string | null;
  modalidad_trabajo?: string | null;
  salario_min?: number | null;
  salario_max?: number | null;
  salario_periodo?: string | null;
  experiencia_trabajo?: string | null;
  idiomas_trabajo?: string[];
  incorporacion?: string | null;
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
  const [contactoRevelado, setContactoRevelado] = useState<{ telefono: string | null; email: string | null } | null>(null);
  const [revelando, setRevelando] = useState(false);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [historialPrecios, setHistorialPrecios] = useState<{ precio: number; created_at: string }[] | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const verHistorial = async () => {
    setHistorialAbierto((v) => !v);
    if (historialPrecios || cargandoHistorial) return;
    setCargandoHistorial(true);
    const { data } = await supabase
      .from("historial_precios")
      .select("precio, created_at")
      .eq("anuncio_id", anuncio.id)
      .order("created_at", { ascending: false });
    setHistorialPrecios(data || []);
    setCargandoHistorial(false);
  };

  const revelarContacto = async () => {
    setRevelando(true);
    try {
      const res = await fetch(`/api/anuncios/${anuncio.id}/contacto`);
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setContactoRevelado({ telefono: data.telefono_contacto ?? null, email: data.email_contacto ?? null });
      } else {
        alert(data?.error || "No se pudo cargar el contacto. Inténtalo de nuevo.");
      }
    } catch {
      alert("No se pudo cargar el contacto. Inténtalo de nuevo.");
    } finally {
      setRevelando(false);
    }
  };

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
  const esTrabajo = anuncio.categoria === "trabajo";
  const destacado = estaDestacado(anuncio.destacado_hasta);
  const colorCat = colorCategoria(anuncio.categoria);

  const claseColor = esTrabajo
    ? esOferta
      ? "border-green-300 bg-green-50"
      : "border-blue-300 bg-blue-50"
    : destacado
    ? "border-amber-300 bg-amber-50/40"
    : `${colorCat.border} ${colorCat.bg}`;

  return (
    <div
      className={
        (esTrabajo ? "rounded-2xl p-4 border-2 " : "rounded-2xl p-4 border ") +
        claseColor +
        " shadow-sm hover:shadow-md transition-shadow duration-200" +
        (destacado && esTrabajo ? " ring-2 ring-amber-400 ring-offset-1" : "")
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
            {esTrabajo && anuncio.sector_trabajo && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200">
                {nombreSector(anuncio.sector_trabajo)}
              </span>
            )}
            {esTrabajo && anuncio.modalidad_trabajo && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-stone-50 text-stone-600 border-stone-200">
                {nombreModalidad(anuncio.modalidad_trabajo)}
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
          {(anuncio.provincia || anuncio.municipio || anuncio.ubicacion) && (
            <p className="text-sm text-stone-500">
              {[anuncio.provincia, anuncio.municipio, anuncio.ubicacion].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleFavorito && (
            <button
              onClick={onToggleFavorito}
              aria-label={esFavorito ? "Quitar de favoritos" : "Añadir a favoritos"}
              className={esFavorito ? "text-red-600" : "text-stone-300 hover:text-stone-400"}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill={esFavorito ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21s-6.72-4.35-9.43-8.06C.28 9.49 1.02 5.5 4.5 4.02 7.2 2.86 10 4 12 6.5c2-2.5 4.8-3.64 7.5-2.48 3.48 1.48 4.22 5.47 1.93 8.92C18.72 16.65 12 21 12 21z" />
              </svg>
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-stone-600">
          {anuncio.precio != null && (
            <span className="inline-flex items-center gap-1.5">
              {anuncio.precio_anterior != null && anuncio.precio_anterior !== anuncio.precio && (
                <span className="text-stone-400 line-through">
                  {anuncio.precio_anterior.toLocaleString("es-ES")} €
                </span>
              )}
              <span className={anuncio.precio_anterior != null && anuncio.precio_anterior > anuncio.precio ? "text-green-700 font-medium" : ""}>
                {anuncio.precio.toLocaleString("es-ES")} €
              </span>
              {anuncio.precio_anterior != null && anuncio.precio_anterior !== anuncio.precio && (
                <span
                  className={
                    "text-xs font-medium px-1.5 py-0.5 rounded-full border " +
                    (anuncio.precio_anterior > anuncio.precio
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200")
                  }
                >
                  {anuncio.precio_anterior > anuncio.precio ? "▼ Bajó de precio" : "▲ Subió de precio"}
                </span>
              )}
            </span>
          )}
          {anuncio.tamano != null && <span>{anuncio.tamano} m²</span>}
          {anuncio.precio != null && anuncio.tamano ? (
            <span className="text-stone-400">{Math.round(anuncio.precio / anuncio.tamano).toLocaleString("es-ES")} €/m²</span>
          ) : null}
          {anuncio.habitaciones != null && <span>{anuncio.habitaciones} hab.</span>}
          {anuncio.banos != null && <span>{anuncio.banos} baños</span>}
          {anuncio.amueblado != null && <span>{anuncio.amueblado ? "Amueblado" : "Sin amueblar"}</span>}
          {anuncio.duracion_alquiler && (
            <span>{DURACIONES_ALQUILER.find((d) => d.valor === anuncio.duracion_alquiler)?.label}</span>
          )}
          {anuncio.precio != null && anuncio.id !== "preview" && (
            <button
              type="button"
              onClick={verHistorial}
              className="text-xs text-red-600 font-medium hover:underline inline-flex items-center gap-1"
            >
              {historialAbierto ? "Ocultar histórico de precio" : "Ver histórico de precio"}
            </button>
          )}
        </div>
      )}

      {esInmobiliaria && historialAbierto && (
        <div className="mt-2 border border-stone-200 rounded-lg p-2.5 text-sm">
          {cargandoHistorial && <p className="text-stone-400">Cargando…</p>}
          {!cargandoHistorial && historialPrecios && historialPrecios.length === 0 && (
            <p className="text-stone-400">Sin cambios de precio registrados.</p>
          )}
          {!cargandoHistorial && historialPrecios && historialPrecios.length > 0 && (
            <GraficoPrecios historial={historialPrecios} />
          )}
        </div>
      )}

      {esInmobiliaria && anuncio.enlaces_externos && anuncio.enlaces_externos.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs">
          <span className="text-stone-400">También en:</span>
          {anuncio.enlaces_externos
            .filter((u) => /^https?:\/\//i.test(u))
            .map((u, i) => (
              <a
                key={i}
                href={u}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-teal-700 hover:underline"
              >
                {(() => {
                  try {
                    return new URL(u).hostname.replace(/^www\./, "");
                  } catch {
                    return u;
                  }
                })()}
              </a>
            ))}
        </div>
      )}

      {esTrabajo && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-stone-600">
          {(anuncio.salario_min != null || anuncio.salario_max != null || anuncio.salario_periodo) && (
            <span>{textoSalario(anuncio.salario_min, anuncio.salario_max, anuncio.salario_periodo)}</span>
          )}
          {anuncio.experiencia_trabajo && <span>{nombreExperiencia(anuncio.experiencia_trabajo)}</span>}
          {anuncio.incorporacion === "inmediata" && <span>Incorporación inmediata</span>}
        </div>
      )}

      {esTrabajo && anuncio.idiomas_trabajo && anuncio.idiomas_trabajo.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {anuncio.idiomas_trabajo.map((idioma) => (
            <span
              key={idioma}
              className="text-xs px-2 py-0.5 rounded-full border border-teal-200 bg-teal-50 text-teal-700"
            >
              {idioma}
            </span>
          ))}
        </div>
      )}

      {esInmobiliaria && anuncio.operacion === "venta" && anuncio.precio != null && (
        <Link
          href={`/calculadora-hipoteca?precio=${anuncio.precio}`}
          className="inline-block mt-1.5 text-xs text-teal-700 hover:underline"
        >
          Calcular cuota de hipoteca
        </Link>
      )}

      {(esInmobiliaria || esTrabajo) && anuncio.caracteristicas && anuncio.caracteristicas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {anuncio.caracteristicas.map((c) => (
            <span
              key={c}
              className="text-xs px-2 py-0.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
            >
              {CARACTERISTICAS.find((x) => x.valor === c)?.label ??
                CARACTERISTICAS_TRABAJO.find((x) => x.valor === c)?.label ??
                c}
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
        {(contactoRevelado?.telefono ?? (anuncio.mostrar_telefono !== false ? anuncio.telefono_contacto : null)) && (
          <>
            {" · "}
            {(() => {
              const telefono = contactoRevelado?.telefono ?? anuncio.telefono_contacto!;
              return (
                <a href={`tel:${telefono.replace(/\s+/g, "")}`} className="hover:underline">
                  {telefono}
                </a>
              );
            })()}
          </>
        )}
        {(contactoRevelado?.email ?? (anuncio.mostrar_email ? anuncio.email_contacto : null)) && (
          <>
            {" · "}
            {(() => {
              const email = contactoRevelado?.email ?? anuncio.email_contacto!;
              return (
                <a href={`mailto:${email}`} className="hover:underline">
                  {email}
                </a>
              );
            })()}
          </>
        )}
        {!isOwner &&
          !contactoRevelado &&
          !anuncio.telefono_contacto &&
          !anuncio.email_contacto &&
          (anuncio.mostrar_telefono !== false || anuncio.mostrar_email) && (
            <>
              {" · "}
              <button
                type="button"
                onClick={revelarContacto}
                disabled={revelando}
                className="text-teal-700 hover:underline disabled:opacity-40"
              >
                {revelando ? "Cargando…" : "Mostrar contacto"}
              </button>
            </>
          )}
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
