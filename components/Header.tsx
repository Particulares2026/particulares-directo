import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-stone-100 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
      <Link href="/" className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-md bg-teal-700 shrink-0" />
        <span className="font-serif text-lg tracking-tight">
          Particulares Directo
        </span>
      </Link>
      <nav className="flex items-center gap-3 md:gap-4 text-sm">
        {user ? (
          <>
            <Link
              href="/publicar"
              className="text-stone-600 hover:text-stone-900 hidden sm:inline"
            >
              Publicar anuncio
            </Link>
            <Link href="/mis-anuncios" className="text-stone-600 hover:text-stone-900">
              Mis anuncios
            </Link>
            <span className="text-stone-400 hidden md:inline">{user.email}</span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="text-stone-600 hover:text-stone-900">
              Entrar
            </Link>
            <Link
              href="/registro"
              className="bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800"
            >
              Crear cuenta
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
