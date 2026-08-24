"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ObjetivoCarrusel = "principal" | "modal";

type GaleriaFotosProps = {
  fotos: string[];
  titulo: string;
  modoDetalle?: boolean;
};

function normalizarIndice(indice: number, total: number) {
  return (indice + total) % total;
}

export default function GaleriaFotos({ fotos, titulo, modoDetalle = false }: GaleriaFotosProps) {
  const imagenes = fotos.filter(Boolean);
  const total = imagenes.length;
  const [indice, setIndice] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const indiceRef = useRef(0);
  const carruselRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  const guardarIndice = useCallback((nuevoIndice: number) => {
    indiceRef.current = nuevoIndice;
    setIndice(nuevoIndice);
  }, []);

  const desplazarA = useCallback(
    (nuevoIndice: number, objetivo: ObjetivoCarrusel, comportamiento: ScrollBehavior = "smooth") => {
      if (total < 1) return;
      const normalizado = normalizarIndice(nuevoIndice, total);
      guardarIndice(normalizado);
      const contenedor = objetivo === "modal" ? modalRef.current : carruselRef.current;
      if (!contenedor) return;
      contenedor.scrollTo({ left: normalizado * contenedor.clientWidth, behavior: comportamiento });
    },
    [guardarIndice, total]
  );

  const actualizarIndiceAlDesplazar = (contenedor: HTMLDivElement) => {
    if (!contenedor.clientWidth) return;
    const nuevoIndice = Math.round(contenedor.scrollLeft / contenedor.clientWidth);
    if (nuevoIndice >= 0 && nuevoIndice < total && nuevoIndice !== indiceRef.current) {
      guardarIndice(nuevoIndice);
    }
  };

  const abrirModal = () => setModalAbierto(true);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    window.requestAnimationFrame(() => desplazarA(indiceRef.current, "principal", "auto"));
  }, [desplazarA]);

  useEffect(() => {
    if (indiceRef.current < total) return;
    guardarIndice(0);
    carruselRef.current?.scrollTo({ left: 0, behavior: "auto" });
  }, [guardarIndice, total]);

  useEffect(() => {
    if (!modalAbierto) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      desplazarA(indiceRef.current, "modal", "auto");
      cerrarRef.current?.focus();
    });

    const alPulsarTecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") cerrarModal();
      if (event.key === "ArrowLeft") desplazarA(indiceRef.current - 1, "modal");
      if (event.key === "ArrowRight") desplazarA(indiceRef.current + 1, "modal");
    };
    window.addEventListener("keydown", alPulsarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", alPulsarTecla);
    };
  }, [cerrarModal, desplazarA, modalAbierto]);

  if (total === 0) return null;

  const clasesAltura = modoDetalle
    ? "aspect-[4/3] sm:aspect-[16/10] md:max-h-[620px]"
    : "aspect-[4/3] sm:aspect-[16/9] sm:max-h-[420px]";

  const contador = (
    <span
      aria-live="polite"
      className="rounded-full bg-black/70 px-3 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm"
    >
      {indice + 1} / {total}
    </span>
  );

  return (
    <>
      <section
        aria-label={`Galería de fotos de ${titulo}`}
        className="group relative mt-3 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm"
      >
        <div
          ref={carruselRef}
          onScroll={(event) => actualizarIndiceAlDesplazar(event.currentTarget)}
          className={
            "flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain " +
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
            clasesAltura
          }
        >
          {imagenes.map((url, posicion) => (
            <button
              key={`${url}-${posicion}`}
              type="button"
              onClick={abrirModal}
              aria-label={`Ampliar foto ${posicion + 1} de ${total}: ${titulo}`}
              className="relative h-full min-w-full cursor-zoom-in snap-center snap-always overflow-hidden bg-stone-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec1178]/70 focus-visible:ring-inset"
            >
              <img
                src={url}
                alt={`${titulo}, foto ${posicion + 1} de ${total}`}
                loading={posicion === 0 && modoDetalle ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="h-full w-full select-none object-cover"
              />
            </button>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => desplazarA(indiceRef.current - 1, "principal")}
              aria-label="Ver foto anterior"
              className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-stone-800 shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec1178]/60"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => desplazarA(indiceRef.current + 1, "principal")}
              aria-label="Ver foto siguiente"
              className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-stone-800 shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec1178]/60"
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={abrirModal}
          aria-label={`Abrir las ${total} fotos en pantalla completa`}
          className="absolute bottom-3 right-3 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec1178]/60"
        >
          {contador}
        </button>
      </section>

      {modalAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fotos ampliadas de ${titulo}`}
          className="fixed inset-0 z-[100] flex flex-col bg-black"
        >
          <header className="relative z-10 flex min-h-16 items-center justify-between gap-3 bg-black/90 px-3 py-2 text-white sm:px-5">
            <p className="min-w-0 truncate text-sm font-medium sm:text-base">{titulo}</p>
            <div className="flex shrink-0 items-center gap-3">
              <span aria-live="polite" className="text-sm text-white/80">
                {indice + 1} / {total}
              </span>
              <button
                ref={cerrarRef}
                type="button"
                onClick={cerrarModal}
                aria-label="Cerrar la galería"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec1178]/70"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </header>

          <div
            ref={modalRef}
            onScroll={(event) => actualizarIndiceAlDesplazar(event.currentTarget)}
            className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {imagenes.map((url, posicion) => (
              <figure
                key={`ampliada-${url}-${posicion}`}
                className="flex h-full min-w-full snap-center snap-always items-center justify-center p-2 sm:p-6"
              >
                <img
                  src={url}
                  alt={`${titulo}, foto ampliada ${posicion + 1} de ${total}`}
                  loading={Math.abs(posicion - indiceRef.current) <= 1 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  className="max-h-full max-w-full select-none object-contain"
                />
              </figure>
            ))}
          </div>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => desplazarA(indiceRef.current - 1, "modal")}
                aria-label="Ver foto anterior"
                className="absolute left-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-3xl text-white shadow-lg transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec1178]/70 sm:left-5"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                onClick={() => desplazarA(indiceRef.current + 1, "modal")}
                aria-label="Ver foto siguiente"
                className="absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-3xl text-white shadow-lg transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec1178]/70 sm:right-5"
              >
                <span aria-hidden="true">›</span>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

