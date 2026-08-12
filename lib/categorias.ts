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

const ETIQUETAS_TIPO: Partial<Record<CategoriaSlug, [string, string]>> = {
  trabajo: ["Busco empleo", "Ofrezco empleo"],
  inmobiliaria: ["Busco vivienda", "Ofrezco vivienda"],
  coches: ["Busco coche", "Vendo coche"],
};

export function etiquetasTipo(categoria: string): [string, string] {
  return ETIQUETAS_TIPO[categoria as CategoriaSlug] ?? ["Busco", "Ofrezco"];
}
