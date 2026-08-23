"use client";

import { useState } from "react";
import Link from "next/link";
import BuzonSugerencias from "./BuzonSugerencias";
import LogoutButton from "./LogoutButton";

type HeaderNavProps = {
  authenticated: boolean;
  email: string | null;
  admin: boolean;
};

const LINK_CLASS =
  "block rounded-xl px-3 py-2 text-stone-700 hover:bg-fuchsia-50 hover:text-[#ec1178] min-[1281px]:px-2 min-[1281px]:py-1";
const PRIMARY_LINK_CLASS =
  "block rounded-xl bg-[#ec1178] px-3 py-2 font-medium text-white shadow-sm hover:bg-[#c90e66] min-[1281px]:rounded-full min-[1281px]:py-1.5";

export default function HeaderNav({ authenticated, email, admin }: HeaderNavProps) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-controls="menu-principal"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 shadow-sm hover:border-[#ec1178] hover:text-[#ec1178] min-[1281px]:hidden"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {abierto ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        Menú
      </button>

      <nav
        id="menu-principal"
        aria-label="Navegación principal"
        className={
          (abierto ? "flex" : "hidden") +
          " absolute left-4 right-4 top-[calc(100%+0.5rem)] max-h-[calc(100vh-6rem)] flex-col gap-1 overflow-y-auto rounded-2xl border border-fuchsia-100 bg-white p-3 text-sm shadow-xl " +
          "min-[1281px]:static min-[1281px]:flex min-[1281px]:max-h-none min-[1281px]:flex-row min-[1281px]:items-center min-[1281px]:gap-2 min-[1281px]:overflow-visible min-[1281px]:border-0 min-[1281px]:bg-transparent min-[1281px]:p-0 min-[1281px]:shadow-none " +
          "[&>button]:w-full [&>button]:justify-start [&>button]:rounded-xl [&>button]:px-3 [&>button]:py-2 [&>button]:text-left " +
          "min-[1281px]:[&>button]:w-auto min-[1281px]:[&>button]:rounded-lg min-[1281px]:[&>button]:px-2 min-[1281px]:[&>button]:py-1"
        }
      >
        <BuzonSugerencias />
        {authenticated ? (
          <>
            <Link href="/publicar" onClick={cerrar} className={PRIMARY_LINK_CLASS}>
              Publicar anuncio
            </Link>
            <Link href="/mis-anuncios" onClick={cerrar} className={LINK_CLASS}>
              Mis anuncios
            </Link>
            <Link href="/mi-perfil" onClick={cerrar} className={LINK_CLASS}>
              👤 Perfil
            </Link>
            <Link href="/favoritos" onClick={cerrar} className={LINK_CLASS}>
              ❤ Favoritos
            </Link>
            {admin && (
              <Link href="/moderacion" onClick={cerrar} className={LINK_CLASS}>
                🛡️ Moderación
              </Link>
            )}
            {email && <span className="hidden max-w-48 truncate text-stone-400 2min-[1281px]:inline">{email}</span>}
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" onClick={cerrar} className={LINK_CLASS}>
              Entrar
            </Link>
            <Link href="/registro" onClick={cerrar} className={PRIMARY_LINK_CLASS}>
              Crear cuenta
            </Link>
          </>
        )}
      </nav>
    </>
  );
}
