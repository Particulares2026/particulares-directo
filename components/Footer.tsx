import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-stone-100 px-4 md:px-8 py-6 mt-10 text-sm text-stone-400 flex flex-wrap items-center justify-between gap-2">
      <span>© {new Date().getFullYear()} Particulares Directo</span>
      <div className="flex gap-4">
        <Link href="/aviso-legal" className="hover:text-stone-600">
          Aviso legal y privacidad
        </Link>
        <Link href="/terminos" className="hover:text-stone-600">
          Términos y condiciones
        </Link>
      </div>
    </footer>
  );
}
