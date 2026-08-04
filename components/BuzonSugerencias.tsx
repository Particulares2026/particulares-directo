"use client";

import { useState } from "react";

export default function BuzonSugerencias() {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"error" | "sugerencia">("sugerencia");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cerrar = () => {
    setAbierto(false);
    setTimeout(() => {
      setTipo("sugerencia");
      setMensaje("");
      setEnviado(false);
      setError(null);
    }, 200);
  };

  const enviar = async () => {
    if (!mensaje.trim()) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, mensaje: mensaje.trim() }),
      });
      if (!res.ok) throw new Error();
      setEnviado(true);
    } catch {
      setError("No se ha podido enviar. Inténtalo de nuevo en unos minutos.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 text-sm"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="m4 6.5 8 6.5 8-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Contacto
      </button>

      {abierto && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={cerrar}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 text-xl leading-none"
            >
              ×
            </button>

            {!enviado ? (
              <>
                <h2 className="font-serif text-xl text-center mb-1">Buzón de sugerencias</h2>
                <p className="text-sm text-stone-500 text-center mb-5">
                  ¿Encontraste un error o tienes una idea?
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setTipo("error")}
                    className={
                      "flex flex-col items-center gap-1.5 py-4 rounded-xl border text-sm font-medium " +
                      (tipo === "error"
                        ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700"
                        : "border-stone-200 text-stone-500")
                    }
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 4h16v12H8l-4 4V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M12 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="12" cy="14.5" r="0.9" fill="currentColor" />
                    </svg>
                    Reportar error
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo("sugerencia")}
                    className={
                      "flex flex-col items-center gap-1.5 py-4 rounded-xl border text-sm font-medium " +
                      (tipo === "sugerencia"
                        ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700"
                        : "border-stone-200 text-stone-500")
                    }
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M9 18h6M10 21h4M8 14a4 4 0 1 1 8 0c0 1.6-1 2.3-1.5 3-.3.4-.5.7-.5 1H10c0-.3-.2-.6-.5-1-.5-.7-1.5-1.4-1.5-3Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Sugerencia
                  </button>
                </div>

                <label className="block text-xs font-medium text-stone-500 mb-1.5">
                  {tipo === "error" ? "Cuéntanos qué ha fallado" : "Tu sugerencia"}
                </label>
                <textarea
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none mb-1"
                  rows={4}
                  placeholder={
                    tipo === "error" ? "Al publicar un anuncio..." : "Me gustaría que la app tuviera..."
                  }
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  maxLength={2000}
                />
                <p className="text-xs text-stone-400 mb-3">Es anónimo: no pedimos tu nombre ni tu correo.</p>

                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                <button
                  type="button"
                  onClick={enviar}
                  disabled={!mensaje.trim() || enviando}
                  className="w-full bg-stone-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-40"
                >
                  {enviando ? "Enviando…" : "Enviar comentario"}
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">✓</div>
                <h2 className="font-serif text-xl mb-1">¡Gracias!</h2>
                <p className="text-sm text-stone-500 mb-6">
                  {tipo === "error"
                    ? "Gracias por avisarnos del error, lo revisaremos."
                    : "Gracias por tu sugerencia, la tendremos en cuenta."}
                </p>
                <button
                  type="button"
                  onClick={cerrar}
                  className="w-full bg-stone-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-800"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
