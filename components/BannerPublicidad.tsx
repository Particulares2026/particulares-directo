"use client";

import { useEffect, useState } from "react";

const TEXTO = "Cádiz Paraíso Natural";
const INTERVALO_MS = 3200;

const IMAGENES = ["/banner/arena.jpg", "/banner/olas.jpg", "/banner/gastronomia.jpg"];

const POSICIONES = [
  // centro
  { left: "50%", width: "44%", scale: 1, opacity: 1, z: 20 },
  // derecha
  { left: "84%", width: "30%", scale: 0.78, opacity: 0.55, z: 10 },
  // izquierda
  { left: "16%", width: "30%", scale: 0.78, opacity: 0.55, z: 10 },
];

export default function BannerPublicidad() {
  const [centro, setCentro] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCentro((c) => (c + 1) % IMAGENES.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative overflow-hidden w-full shrink-0 bg-stone-900"
      style={{ height: "clamp(140px, 20vw, 240px)" }}
    >
      {IMAGENES.map((src, i) => {
        const relativo = (i - centro + IMAGENES.length) % IMAGENES.length; // 0 centro, 1 derecha, 2->izquierda
        const pos = POSICIONES[relativo];
        return (
          <div
            key={src}
            className="absolute top-2 bottom-2 rounded-xl overflow-hidden shadow-lg transition-all duration-700 ease-in-out"
            style={{
              left: pos.left,
              width: pos.width,
              transform: `translateX(-50%) scale(${pos.scale})`,
              opacity: pos.opacity,
              zIndex: pos.z,
            }}
          >
            <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover brightness-110 saturate-125" />
            {relativo === 0 && (
              <>
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-serif text-lg sm:text-2xl md:text-3xl font-medium text-white text-center px-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                    {TEXTO}
                  </p>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
