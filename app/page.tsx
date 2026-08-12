import Link from "next/link";
import { CATEGORIAS_DESTACADAS } from "@/lib/categorias";

export default function HomePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <h1 className="font-serif text-2xl mb-1">Publica tu anuncio entre PARTICULARES DIRECTO</h1>
      <p className="text-stone-500 text-sm mb-6">
        Sin agencias ni intermediarios en un click
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CATEGORIAS_DESTACADAS.map((c) => (
          <Link
            key={c.slug}
            href={`/categoria/${c.slug}`}
            className="border border-stone-200 rounded-xl px-4 py-6 text-center font-medium text-stone-800 hover:border-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 transition-colors"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
