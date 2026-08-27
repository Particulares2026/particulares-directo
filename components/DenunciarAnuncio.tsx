"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";

const MOTIVOS = [
  ["estafa", "Posible estafa o engaño"],
  ["ilegal", "Contenido o actividad ilegal"],
  ["ofensivo", "Contenido ofensivo o discriminatorio"],
  ["datos_personales", "Expone datos personales"],
  ["duplicado", "Anuncio duplicado"],
  ["categoria_incorrecta", "Categoría incorrecta"],
  ["otro", "Otro motivo"],
] as const;

export default function DenunciarAnuncio({
  anuncioId,
  titulo,
}: {
  anuncioId: string;
  titulo: string;
}) {
  const [montado, setMontado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [detalles, setDetalles] = useState("");
  const [email, setEmail] = useState("");
  const [sitioWeb, setSitioWeb] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!abierto) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  const cerrar = () => {
    setAbierto(false);
    window.setTimeout(() => {
      setMotivo("");
      setDetalles("");
      setEmail("");
      setSitioWeb("");
      setEnviado(false);
      setError(null);
    }, 200);
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!motivo || detalles.trim().length < 10) return;

    setEnviando(true);
    setError(null);
    try {
      const response = await fetch(`/api/anuncios/${anuncioId}/denunciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivo,
          detalles: detalles.trim(),
          email: email.trim(),
          sitioWeb,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "No se pudo enviar la denuncia. Inténtalo de nuevo."
        );
      }
      setEnviado(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar la denuncia. Inténtalo de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        <span aria-hidden="true">🚩</span>
        Denunciar este anuncio
      </button>

      {montado &&
        abierto &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/45 p-4"
            onClick={cerrar}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-denuncia"
              className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="absolute right-4 top-4 text-xl leading-none text-stone-400 hover:text-stone-700"
              >
                ×
              </button>

              {!enviado ? (
                <>
                  <h2 id="titulo-denuncia" className="pr-8 font-serif text-xl text-stone-900">
                    Denunciar anuncio
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">{titulo}</p>

                  <form onSubmit={enviar} className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-stone-700">
                        Motivo *
                      </span>
                      <select
                        required
                        value={motivo}
                        onChange={(event) => setMotivo(event.target.value)}
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Selecciona un motivo</option>
                        {MOTIVOS.map(([valor, etiqueta]) => (
                          <option key={valor} value={valor}>
                            {etiqueta}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-stone-700">
                        Explica qué ocurre *
                      </span>
                      <textarea
                        required
                        minLength={10}
                        maxLength={1500}
                        rows={5}
                        value={detalles}
                        onChange={(event) => setDetalles(event.target.value)}
                        placeholder="Describe el problema con datos concretos para que podamos revisarlo."
                        className="w-full resize-y rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <span className="mt-1 block text-right text-xs text-stone-400">
                        {detalles.length}/1500
                      </span>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-stone-700">
                        Tu correo (opcional)
                      </span>
                      <input
                        type="email"
                        maxLength={254}
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Solo si necesitamos pedirte más información"
                        className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </label>

                    <div
                      aria-hidden="true"
                      className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                    >
                      <label htmlFor={`denuncia-web-${anuncioId}`}>Sitio web</label>
                      <input
                        id={`denuncia-web-${anuncioId}`}
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={sitioWeb}
                        onChange={(event) => setSitioWeb(event.target.value)}
                      />
                    </div>

                    <p className="text-xs leading-relaxed text-stone-500">
                      La denuncia se revisará de forma confidencial. El anunciante no verá tu correo.
                    </p>

                    {error && (
                      <p role="alert" className="text-sm text-red-600">
                        {error}
                      </p>
                    )}

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={cerrar}
                        className="min-h-11 rounded-lg border border-stone-300 px-4 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!motivo || detalles.trim().length < 10 || enviando}
                        className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
                      >
                        {enviando ? "Enviando…" : "Enviar denuncia"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="py-6 text-center">
                  <div className="text-3xl" aria-hidden="true">✓</div>
                  <h2 id="titulo-denuncia" className="mt-3 font-serif text-xl">
                    Denuncia recibida
                  </h2>
                  <p className="mt-2 text-sm text-stone-500">
                    Gracias por avisarnos. La revisaremos desde el panel de moderación.
                  </p>
                  <button
                    type="button"
                    onClick={cerrar}
                    className="mt-6 min-h-11 w-full rounded-lg bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
