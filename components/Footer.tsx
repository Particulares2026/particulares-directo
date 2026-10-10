import Link from "next/link";
import CookieSettingsButton from "@/components/CookieSettingsButton";

export default function Footer() {
  return (
    <footer className="border-t border-stone-100 px-4 md:px-8 py-6 mt-10 text-sm text-stone-600 flex flex-wrap items-center justify-between gap-2">
      <span>© {new Date().getFullYear()} Particulares Directo</span>
      <div className="flex flex-wrap gap-4">
        <Link href="/guias" className="hover:text-stone-900">Guías y seguridad</Link>
        <Link href="/aviso-legal" className="hover:text-stone-900">
          Aviso legal y privacidad
        </Link>
        <Link href="/terminos" className="hover:text-stone-900">
          Términos y condiciones
        </Link>
        <CookieSettingsButton />
      </div>
    </footer>
  );
}
