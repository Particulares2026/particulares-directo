"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type GaleriaFotosProps = {
  fotos: string[];
  titulo: string;
  modoDetalle?: boolean;
};

function normalizarIndice(indice: number, total: number) {
  return (indice + total) % total;
}

export default function GaleriaFotos({ fotos, titulo, modoDetalle = false }: GaleriaFotosProps) {
  const [indice, setIndice] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [imagenesConError, setImagenesConError] = useState<Set<string>>(() => new Set());
  const indiceRef = useRef(0);
  const inicioDeslizamientoRef = useRef<number | null>(null);
  const evitarClickRef = useRef(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  const imagenes = fotos.filter((url) => Boolean(url) && !imagenesConError.has(url));
  const total = imagenes.length;

  const guardarIndice = useCallback((nuevoIndice: number) => {
    indiceRef.current = nuevoIndice;
    setIndice(nuevoIndice);
  }, []);

  const irA = useCallback(
    (nuevoIndice: number) => {
      if (total < 1) return;
      guardarIndice(normalizarIndice(nuevoIndice, total));
    },
    [guardarIndice, total]
  );

  const registrarError = (url: string) => {
    setImagenesConError((actuales) => {
      const siguientes = new Set(actuales);
      siguientes.add(url);
      return siguientes;
    });
  };

  const iniciarDeslizamiento = (event: ReactPointerEvent<HTMLElement>) => {
    inicioDeslizamientoRef.current = event.clientX;
    evitarClickRef.current = false;
  };

  const terminarDeslizamiento = (event: ReactPointerEvent<HTMLElement>) => {
    const inicio = inicioDeslizamientoRef.current;
    inicioDeslizamientoRef.current = null;
    if (inicio == null) return;

    const distancia = event.clientX - inicio;
    if (Math.abs(distancia) < 45) return;
    evitarClickRef.current = true;
    irA(indiceRef.current + (distancia < 0 ? 1 : -1));
  };

  const abrirModal = () => {
    if (evitarClickRef.current) {
      evitarClickRef.current = false;
      return;
    }
    setModalAbierto(true);
  };

  const cerrarModal = useCallback(() => setModalAbierto(false), []);

  useEffect(() => {
    setImagenesConError(new Set());
    guardarIndice(0);
  }, [fotos, guardarIndice]);

  useEffect(() => {
    if (total === 0 || indiceRef.current < total) return;
    guardarIndice(Math.max(0, total - 1));
  }, [guardarIndice, total]);

  useEffect(() => {
    if (!modalAbierto) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => cerrarRef.current?.focus());

    const alPulsarTecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") cerrarModal();
      if (event.key === "ArrowLeft") irA(indiceRef.current - 1);
      if (event.key === "ArrowRight") irA(indiceRef.current + 1);
    };
    window.addEventListener("keydown", alPulsarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", alPulsarTecla);
    };
  }, [cerrarModal, irA, modalAbierto]);

  if (total === 0) return null;

  const indiceSeguro = Math.min(indice, total - 1);
  const imagenActual = imagenes[indiceSeguro];
  const clasesAltura = modoDetalle
    ? "aspect-[4/3] sm:aspect-[16/10] md:max-h-[620px]"
    : "aspect-[4/3] sm:aspect-[16/9] sm:max-h-[420px]";

  return (
    <>
      <section
        aria-label={`Galería de fotos de ${titulo}`}
        className={`group relative mt-3 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm ${clasesAltura}`}
      >
        <button
          type="button"
          onClick={abrirModal}
          onPointerDown={iniciarDeslizamiento}
          onPointerUp={terminarDeslizamiento}
          onPointerCancel={() => {
            inicioDeslizamientoRef.current = null;
          }}
          aria-label={`Ampliar foto ${indiceSeguro + 1} de ${total}: ${titulo}`}
          className="relative h-full w-full cursor-zoom-in touch-pan-y overflow-hidden bg-stone-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c10b61]/70 focus-visible:ring-inset"
        >
          <img
            key={imagenActual}
            src={imagenActual}
            alt={`${titulo}, foto ${indiceSeguro + 1} de ${total}`}
            loading={modoDetalle && indiceSeguro === 0 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            onError={() => registrarError(imagenActual)}
            className="h-full w-full select-none object-cover"
          />
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => irA(indiceRef.current - 1)}
              aria-label="Ver foto anterior"
              className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-stone-800 shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c10b61]/60"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => irA(indiceRef.current + 1)}
              aria-label="Ver foto siguiente"
              className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-stone-800 shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c10b61]/60"
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={abrirModal}
          aria-label={`Abrir las ${total} fotos en pantalla completa`}
          className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c10b61]/60"
        >
          <span aria-live="polite">{indiceSeguro + 1} / {total}</span>
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
                {indiceSeguro + 1} / {total}
              </span>
              <button
                ref={cerrarRef}
                type="button"
                onClick={cerrarModal}
                aria-label="Cerrar la galería"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c10b61]/70"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </header>

          <figure
            onPointerDown={iniciarDeslizamiento}
            onPointerUp={terminarDeslizamiento}
            onPointerCancel={() => {
              inicioDeslizamientoRef.current = null;
            }}
            className="flex min-h-0 flex-1 touch-none items-center justify-center p-2 sm:p-6"
          >
            <img
              key={`ampliada-${imagenActual}`}
              src={imagenActual}
              alt={`${titulo}, foto ampliada ${indiceSeguro + 1} de ${total}`}
              decoding="async"
              draggable={false}
              onError={() => registrarError(imagenActual)}
              className="max-h-full max-w-full select-none object-contain"
            />
          </figure>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => irA(indiceRef.current - 1)}
                aria-label="Ver foto anterior"
                className="absolute left-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-3xl text-white shadow-lg transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c10b61]/70 sm:left-5"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                onClick={() => irA(indiceRef.current + 1)}
                aria-label="Ver foto siguiente"
                className="absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-3xl text-white shadow-lg transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c10b61]/70 sm:right-5"
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
