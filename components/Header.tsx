import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { esAdmin } from "@/lib/admin";
import LogoutButton from "./LogoutButton";
import BuzonSugerencias from "./BuzonSugerencias";

export default async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b-2 border-fuchsia-100 px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-y-2 sticky top-0 bg-white/90 backdrop-blur z-10">
      <Link href="/" className="flex items-center gap-2 sm:gap-3">
        <svg
          viewBox="0 0 100 100"
          className="w-10 h-10 sm:w-16 sm:h-16 shrink-0"
          aria-hidden="true"
        >
          <rect x="0" y="0" width="100" height="100" rx="20" fill="#ec1178" />
          <text
            x="7"
            y="83"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="100"
            fill="#ffffff"
          >
            P
          </text>
          <text
            x="55"
            y="94"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="50"
            fill="#ffffff"
          >
            D
          </text>
        </svg>
        <span className="font-sans font-bold text-lg sm:text-2xl tracking-tight">
          Particulares Directo
        </span>
      </Link>
      <nav className="flex items-center gap-2 sm:gap-4 text-sm">
        <BuzonSugerencias />
        {user ? (
          <>
            <Link
              href="/publicar"
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white px-3 py-1.5 rounded-full hover:from-fuchsia-700 hover:to-pink-700 shadow-sm"
            >
              Publicar anuncio
            </Link>
            <Link href="/mis-anuncios" className="text-stone-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg px-2 py-1">
              Mis anuncios
            </Link>
            <Link href="/mi-perfil" className="text-stone-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg px-2 py-1">
              👤 Perfil
            </Link>
            <Link href="/favoritos" className="text-stone-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg px-2 py-1">
              ❤ Favoritos
            </Link>
            {esAdmin(user.email) && (
              <Link href="/moderacion" className="text-stone-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg px-2 py-1">
                🛡️ Moderación
              </Link>
            )}
            <span className="text-stone-400 hidden md:inline">{user.email}</span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="text-stone-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg px-2 py-1">
              Entrar
            </Link>
            <Link
              href="/registro"
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white px-3 py-1.5 rounded-full hover:from-fuchsia-700 hover:to-pink-700 shadow-sm"
            >
              Crear cuenta
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
