"use client";

import { useEffect, useState } from "react";

const TEXTO = "Cádiz Paraíso Natural";
const INTERVALO_MS = 4500;

const IMAGENES = ["/banner/arena.jpg", "/banner/olas.jpg", "/banner/gastronomia.jpg"];

export default function BannerPublicidad() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % IMAGENES.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative overflow-hidden w-full shrink-0"
      style={{ height: "clamp(120px, 16vw, 200px)" }}
    >
      {IMAGENES.map((src, i) => (
        <div
          key={i}
          className={
            "absolute inset-0 transition-opacity duration-700 " +
            (i === indice ? "opacity-100" : "opacity-0 pointer-events-none")
          }
        >
          <img
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl brightness-75"
          />
          <img
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-contain brightness-125 saturate-125 contrast-105"
          />
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-serif text-xl sm:text-2xl md:text-3xl font-medium text-white text-center px-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
              {TEXTO}
            </p>
          </div>
        </div>
      ))}

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {IMAGENES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndice(i)}
            aria-label={`Ver imagen ${i + 1}`}
            className={"w-1.5 h-1.5 rounded-full " + (i === indice ? "bg-white" : "bg-white/40")}
          />
        ))}
      </div>
    </div>
  );
}
