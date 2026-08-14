export type CategoriaSlug =
  | "inmobiliaria"
  | "trabajo"
  | "coches"
  | "moda"
  | "muebles-hogar"
  | "mascotas"
  | "tecnologia"
  | "deporte";

// "destacada: false" oculta la categoría de la portada y del selector al publicar,
// pero sus páginas, anuncios y enlaces directos siguen funcionando con normalidad.
export const CATEGORIAS: { slug: CategoriaSlug; label: string; destacada: boolean }[] = [
  { slug: "inmobiliaria", label: "Inmobiliaria", destacada: true },
  { slug: "trabajo", label: "Trabajo", destacada: true },
  { slug: "coches", label: "Coches", destacada: false },
  { slug: "moda", label: "Moda", destacada: false },
  { slug: "muebles-hogar", label: "Muebles y hogar", destacada: false },
  { slug: "mascotas", label: "Mascotas", destacada: false },
  { slug: "tecnologia", label: "Tecnología", destacada: false },
  { slug: "deporte", label: "Deporte", destacada: false },
];

export const CATEGORIAS_DESTACADAS = CATEGORIAS.filter((c) => c.destacada);

export function esCategoriaValida(slug: string): slug is CategoriaSlug {
  return CATEGORIAS.some((c) => c.slug === slug);
}

export function nombreCategoria(slug: string): string {
  return CATEGORIAS.find((c) => c.slug === slug)?.label ?? slug;
}

// Identidad de color por categoría: da vida a las tarjetas de anuncio y a los
// accesos de la portada sin depender solo de badges puntuales.
const COLORES_CATEGORIA: Record<
  CategoriaSlug,
  { border: string; bg: string; gradiente: string; icono: string }
> = {
  inmobiliaria: { border: "border-sky-200", bg: "bg-sky-50/50", gradiente: "from-sky-500 to-blue-600", icono: "🏠" },
  trabajo: { border: "border-stone-200", bg: "", gradiente: "from-teal-500 to-emerald-600", icono: "💼" },
  coches: { border: "border-indigo-200", bg: "bg-indigo-50/50", gradiente: "from-indigo-500 to-violet-600", icono: "🚗" },
  moda: { border: "border-rose-200", bg: "bg-rose-50/50", gradiente: "from-rose-500 to-pink-600", icono: "👗" },
  "muebles-hogar": { border: "border-orange-200", bg: "bg-orange-50/50", gradiente: "from-orange-500 to-amber-600", icono: "🛋️" },
  mascotas: { border: "border-lime-200", bg: "bg-lime-50/50", gradiente: "from-lime-500 to-green-600", icono: "🐾" },
  tecnologia: { border: "border-violet-200", bg: "bg-violet-50/50", gradiente: "from-violet-500 to-purple-600", icono: "💻" },
  deporte: { border: "border-cyan-200", bg: "bg-cyan-50/50", gradiente: "from-cyan-500 to-teal-600", icono: "⚽" },
};

export function colorCategoria(slug: string) {
  return COLORES_CATEGORIA[slug as CategoriaSlug] ?? COLORES_CATEGORIA.inmobiliaria;
}

const ETIQUETAS_TIPO: Partial<Record<CategoriaSlug, [string, string]>> = {
  trabajo: ["Busco empleo", "Ofrezco empleo"],
  inmobiliaria: ["Busco vivienda", "Ofrezco vivienda"],
  coches: ["Busco coche", "Vendo coche"],
};

export function etiquetasTipo(categoria: string): [string, string] {
  return ETIQUETAS_TIPO[categoria as CategoriaSlug] ?? ["Busco", "Ofrezco"];
}
