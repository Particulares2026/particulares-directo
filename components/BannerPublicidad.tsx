"use client";

import { useEffect, useState } from "react";

const ANUNCIOS = [
  {
    fondo: "bg-gradient-to-r from-red-600 to-red-500",
    titulo: "Tu marca aquí",
    subtitulo: "Anúnciate en Particulares Directo y llega a miles de personas",
  },
  {
    fondo: "bg-gradient-to-r from-sky-600 to-sky-500",
    titulo: "Refresco Cola — edición ejemplo",
    subtitulo: "Así se vería el anuncio de una marca real en este espacio",
  },
  {
    fondo: "bg-gradient-to-r from-emerald-600 to-emerald-500",
    titulo: "Zapatillas Correr+",
    subtitulo: "Otro ejemplo de banner rotativo para un anunciante",
  },
];

const INTERVALO_MS = 4500;

export default function BannerPublicidad() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % ANUNCIOS.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden h-20 md:h-24">
      {ANUNCIOS.map((anuncio, i) => (
        <div
          key={i}
          className={
            "absolute inset-0 flex flex-col items-center justify-center text-center px-4 text-white transition-opacity duration-700 " +
            anuncio.fondo +
            " " +
            (i === indice ? "opacity-100" : "opacity-0 pointer-events-none")
          }
        >
          <p className="font-serif text-lg md:text-xl leading-tight">{anuncio.titulo}</p>
          <p className="text-xs md:text-sm text-white/85 mt-0.5">{anuncio.subtitulo}</p>
        </div>
      ))}

      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5">
        {ANUNCIOS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndice(i)}
            aria-label={`Ver anuncio ${i + 1}`}
            className={"w-1.5 h-1.5 rounded-full " + (i === indice ? "bg-white" : "bg-white/40")}
          />
        ))}
      </div>
    </div>
  );
}
