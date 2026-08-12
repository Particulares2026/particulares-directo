"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { iconoMarcador } from "./icono";

const CENTRO_ESPANA: [number, number] = [40.4168, -3.7038];

function ClicEnMapa({ onClic }: { onClic: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClic(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function CentrarMapa({ centro }: { centro: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(centro, map.getZoom() < 12 ? 14 : map.getZoom());
  }, [centro, map]);
  return null;
}

export default function SelectorUbicacion({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [centroForzado, setCentroForzado] = useState<[number, number] | null>(null);

  const posicion: [number, number] | null = lat != null && lng != null ? [lat, lng] : null;

  const buscarDireccion = async () => {
    if (!busqueda.trim()) return;
    setBuscando(true);
    setErrorBusqueda(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(
          busqueda
        )}`
      );
      const data = await res.json();
      if (data.length === 0) {
        setErrorBusqueda("No se ha encontrado esa dirección.");
        return;
      }
      const encontrado: [number, number] = [Number(data[0].lat), Number(data[0].lon)];
      onChange(encontrado[0], encontrado[1]);
      setCentroForzado(encontrado);
    } catch {
      setErrorBusqueda("No se pudo buscar la dirección. Inténtalo de nuevo.");
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          placeholder="Busca una dirección o zona para situarla en el mapa"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              buscarDireccion();
            }
          }}
        />
        <button
          type="button"
          onClick={buscarDireccion}
          disabled={buscando}
          className="shrink-0 text-sm px-3 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
        >
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </div>
      {errorBusqueda && <p className="text-xs text-red-600 mb-2">{errorBusqueda}</p>}
      <p className="text-xs text-stone-400 mb-2">
        O pincha directamente en el mapa para marcar la zona aproximada.
      </p>
      <div className="rounded-lg overflow-hidden border border-stone-300">
        <MapContainer
          center={posicion ?? CENTRO_ESPANA}
          zoom={posicion ? 14 : 6}
          style={{ height: "260px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClicEnMapa onClic={onChange} />
          {centroForzado && <CentrarMapa centro={centroForzado} />}
          {posicion && <Marker position={posicion} icon={iconoMarcador} />}
        </MapContainer>
      </div>
    </div>
  );
}
