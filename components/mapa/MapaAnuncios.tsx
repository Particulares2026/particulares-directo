"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { iconoMarcador } from "./icono";

const CENTRO_ESPANA: [number, number] = [40.4168, -3.7038];

type AnuncioConMapa = {
  id: string;
  titulo: string;
  ubicacion: string | null;
  precio: number | null;
  operacion: string | null;
  habitaciones: number | null;
  tamano: number | null;
  fotos: string[] | null;
  lat: number | null;
  lng: number | null;
};

function AjustarLimites({ posiciones }: { posiciones: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (posiciones.length > 0) {
      map.fitBounds(posiciones, { padding: [30, 30], maxZoom: 14 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(posiciones)]);
  return null;
}

export default function MapaAnuncios({ anuncios }: { anuncios: AnuncioConMapa[] }) {
  const conUbicacion = anuncios.filter(
    (a): a is AnuncioConMapa & { lat: number; lng: number } => a.lat != null && a.lng != null
  );
  const posiciones: [number, number][] = conUbicacion.map((a) => [a.lat, a.lng]);

  if (conUbicacion.length === 0) {
    return (
      <p className="text-sm text-stone-400 text-center py-10">
        Ninguno de estos anuncios tiene ubicación marcada en el mapa todavía.
      </p>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-stone-300">
      <MapContainer center={CENTRO_ESPANA} zoom={6} style={{ height: "480px", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AjustarLimites posiciones={posiciones} />
        {conUbicacion.map((a) => (
          <Marker key={a.id} position={[a.lat, a.lng]} icon={iconoMarcador}>
            <Popup>
              <div className="text-sm w-40">
                {a.fotos && a.fotos.length > 0 && (
                  <img
                    src={a.fotos[0]}
                    alt=""
                    className="w-full aspect-video object-cover rounded mb-1.5"
                  />
                )}
                <p className="font-medium mb-0.5 leading-tight">{a.titulo}</p>
                {a.ubicacion && <p className="text-stone-500 text-xs mb-1">{a.ubicacion}</p>}
                {a.precio != null && (
                  <p className="text-stone-800 font-medium">
                    {a.precio.toLocaleString("es-ES")} €{a.operacion === "alquiler" ? "/mes" : ""}
                  </p>
                )}
                <p className="text-stone-500 text-xs">
                  {[
                    a.habitaciones != null ? `${a.habitaciones} hab.` : null,
                    a.tamano != null ? `${a.tamano} m²` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
