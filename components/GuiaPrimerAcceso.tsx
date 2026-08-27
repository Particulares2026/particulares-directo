"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CLAVE_AVISO = "pd_guia_registro_correo_v1";

export default function GuiaPrimerAcceso() {
  const [abierto, setAbierto] = useState(false);
  const dialogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLAVE_AVISO) !== "visto") {
        setAbierto(true);
      }
    } catch {
      setAbierto(true);
    }
  }, []);

  useEffect(() => {
    if (!abierto) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogoRef.current?.focus();

    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cerrar();
      }
    };

    window.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  const marcarComoVisto = () => {
    try {
      window.localStorage.setItem(CLAVE_AVISO, "visto");
    } catch {
      // El aviso sigue siendo util aunque el navegador bloquee el almacenamiento.
    }
  };

  const cerrar = () => {
    marcarComoVisto();
    setAbierto(false);
  };

  return (
    <>
      <section
        className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6"
        aria-labelledby="primeros-pasos-portada"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            Importante antes de publicar
          </p>
          <h2 id="primeros-pasos-portada" className="mt-1 font-serif text-xl text-stone-900">
            Crea tu cuenta y confirma el correo
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">
            Recibirás un mensaje para confirmar tu cuenta. Si no lo encuentras,
            revisa también las carpetas de <strong>Spam</strong>, <strong>Correo no deseado</strong> o{" "}
            <strong>Promociones</strong>.
          </p>
        </div>
        <div className="mt-4 flex shrink-0 flex-wrap gap-3 sm:mt-0 sm:justify-end">
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="rounded-full border border-amber-500 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
          >
            Ver instrucciones
          </button>
          <Link
            href="/registro"
            className="rounded-full bg-[#ec1178] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#d50f6c] focus:outline-none focus:ring-2 focus:ring-[#ec1178] focus:ring-offset-2"
          >
            Crear cuenta
          </Link>
        </div>
      </section>

      {abierto && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-stone-950/60 px-3 py-4 sm:px-6 sm:py-8"
          role="presentation"
        >
          <div
            ref={dialogoRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-guia-registro"
            aria-describedby="descripcion-guia-registro"
            tabIndex={-1}
            className="relative mx-auto w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl outline-none sm:p-8"
          >
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar instrucciones"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white text-xl text-stone-600 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-[#ec1178]"
            >
              ×
            </button>

            <p className="pr-12 text-sm font-semibold uppercase tracking-wide text-[#b80d5e]">
              Antes de publicar tu primer anuncio
            </p>
            <h2 id="titulo-guia-registro" className="mt-2 pr-12 font-serif text-2xl text-stone-950 sm:text-3xl">
              Cómo crear y confirmar tu cuenta
            </h2>
            <p id="descripcion-guia-registro" className="mt-3 leading-7 text-stone-600">
              Puedes mirar los anuncios sin registrarte. Para publicar uno, sigue estos pasos:
            </p>

            <ol className="mt-6 space-y-4">
              <li className="flex gap-4 rounded-2xl bg-fuchsia-50 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ec1178] font-bold text-white">1</span>
                <div>
                  <p className="font-semibold text-stone-900">Crea tu cuenta</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Completa tu nombre, teléfono, correo electrónico y una contraseña de al menos 10 caracteres.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 rounded-2xl bg-fuchsia-50 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ec1178] font-bold text-white">2</span>
                <div>
                  <p className="font-semibold text-stone-900">Abre el correo de confirmación</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Te enviaremos un mensaje a la dirección indicada. Abre ese correo y pulsa el enlace para confirmar la cuenta.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-500 font-bold text-white">3</span>
                <div>
                  <p className="font-semibold text-amber-950">¿No encuentras el correo?</p>
                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    Espera unos minutos y revisa <strong>Spam</strong>, <strong>Correo no deseado</strong> y{" "}
                    <strong>Promociones</strong>. El mensaje puede llegar a una de esas carpetas.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 rounded-2xl bg-fuchsia-50 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ec1178] font-bold text-white">4</span>
                <div>
                  <p className="font-semibold text-stone-900">Entra y publica</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Después de confirmar la cuenta, vuelve a la página, entra con tu correo y contraseña y publica tu anuncio.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                href="/registro"
                onClick={cerrar}
                className="rounded-xl bg-[#ec1178] px-5 py-3 text-center font-semibold text-white shadow-sm hover:bg-[#d50f6c] focus:outline-none focus:ring-2 focus:ring-[#ec1178] focus:ring-offset-2"
              >
                Crear mi cuenta
              </Link>
              <Link
                href="/login"
                onClick={cerrar}
                className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-center font-semibold text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
              >
                Ya tengo cuenta: entrar
              </Link>
            </div>

            <button
              type="button"
              onClick={cerrar}
              className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              Ahora solo quiero ver anuncios
            </button>
          </div>
        </div>
      )}
    </>
  );
}
