"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { nombreCategoria } from "@/lib/categorias";

export type FiltrosActuales = {
  query: string;
  operacion: string;
  tipo: string;
  provincia: string;
  tipoInmueble: string;
  precioMin: string;
  precioMax: string;
  tamanoMin: string;
  tamanoMax: string;
  habitaciones: string;
  banos: string;
  amueblado: string;
  duracionAlquiler: string;
  estado: string;
  caracteristicas: string[];
};

type Alerta = {
  id: string;
  query: string | null;
  operacion: string | null;
  tipo: string | null;
  provincia: string | null;
  tipo_inmueble: string | null;
  precio_min: number | null;
  precio_max: number | null;
  estado: string | null;
};

function describirAlerta(a: Alerta) {
  const partes = [
    a.tipo === "ofrezco" ? "Ofertas" : a.tipo === "busco" ? "Demandas" : null,
    a.operacion === "venta" ? "Venta" : a.operacion === "alquiler" ? "Alquiler" : null,
    a.tipo_inmueble || null,
    a.provincia || null,
    a.precio_min ? `desde ${Number(a.precio_min).toLocaleString("es-ES")} €` : null,
    a.precio_max ? `hasta ${Number(a.precio_max).toLocaleString("es-ES")} €` : null,
    a.query ? `"${a.query}"` : null,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : "Todos los anuncios de inmobiliaria";
}

export default function AlertasBusqueda({
  currentUserId,
  userEmail,
  filtros,
}: {
  currentUserId: string | null;
  userEmail: string | null;
  filtros: FiltrosActuales;
}) {
  const supabase = createClient();
  const [abierto, setAbierto] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarAlertas = async () => {
    if (!currentUserId) return;
    const { data } = await supabase
      .from("alertas_busqueda")
      .select("id, query, operacion, tipo, provincia, tipo_inmueble, precio_min, precio_max, estado")
      .eq("user_id", currentUserId)
      .eq("categoria", "inmobiliaria")
      .order("created_at", { ascending: false });
    setAlertas(data || []);
  };

  useEffect(() => {
    if (abierto) cargarAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  if (!currentUserId) return null;

  const guardarAlerta = async () => {
    setGuardando(true);
    setMensaje(null);
    const { error } = await supabase.from("alertas_busqueda").insert({
      user_id: currentUserId,
      email: userEmail,
      categoria: "inmobiliaria",
      query: filtros.query.trim() || null,
      operacion: filtros.operacion || null,
      tipo: filtros.tipo || null,
      provincia: filtros.provincia || null,
      tipo_inmueble: filtros.tipoInmueble || null,
      precio_min: filtros.precioMin ? Number(filtros.precioMin) : null,
      precio_max: filtros.precioMax ? Number(filtros.precioMax) : null,
      tamano_min: filtros.tamanoMin ? Number(filtros.tamanoMin) : null,
      tamano_max: filtros.tamanoMax ? Number(filtros.tamanoMax) : null,
      habitaciones: filtros.habitaciones ? Number(filtros.habitaciones) : null,
      banos: filtros.banos ? Number(filtros.banos) : null,
      amueblado: filtros.amueblado ? filtros.amueblado === "si" : null,
      duracion_alquiler: filtros.duracionAlquiler || null,
      estado: filtros.estado || null,
      caracteristicas: filtros.caracteristicas,
    });
    setGuardando(false);
    if (error) {
      setMensaje("No se pudo guardar la alerta. Inténtalo de nuevo.");
      return;
    }
    setMensaje("Alerta guardada. Te avisaremos por email de los anuncios nuevos que coincidan.");
    cargarAlertas();
  };

  const eliminarAlerta = async (id: string) => {
    setAlertas((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));
    await supabase.from("alertas_busqueda").delete().eq("id", id);
  };

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="text-sm border border-stone-300 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50"
      >
        🔔 Alertas por email
      </button>

      {abierto && (
        <div className="mt-2 border border-stone-200 rounded-xl p-3 space-y-3">
          <div>
            <p className="text-sm text-stone-600 mb-1.5">
              Guarda esta búsqueda para recibir un email cuando se publique un anuncio nuevo que coincida.
            </p>
            <button
              type="button"
              onClick={guardarAlerta}
              disabled={guardando}
              className="text-sm bg-fuchsia-600 text-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-700 disabled:opacity-40"
            >
              {guardando ? "Guardando…" : "Avisarme de anuncios así"}
            </button>
            {mensaje && <p className="text-xs text-stone-500 mt-1.5">{mensaje}</p>}
          </div>

          {alertas && alertas.length > 0 && (
            <div className="pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-400 mb-1.5">Tus alertas guardadas en {nombreCategoria("inmobiliaria")}</p>
              <ul className="space-y-1.5">
                {alertas.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-stone-600">{describirAlerta(a)}</span>
                    <button
                      type="button"
                      onClick={() => eliminarAlerta(a.id)}
                      className="shrink-0 text-xs text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
