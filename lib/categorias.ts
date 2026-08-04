export type CategoriaSlug =
  | "inmobiliaria"
  | "trabajo"
  | "coches"
  | "moda"
  | "muebles-hogar"
  | "mascotas"
  | "tecnologia"
  | "deporte";

export const CATEGORIAS: { slug: CategoriaSlug; label: string }[] = [
  { slug: "inmobiliaria", label: "Inmobiliaria" },
  { slug: "trabajo", label: "Trabajo" },
  { slug: "coches", label: "Coches" },
  { slug: "moda", label: "Moda" },
  { slug: "muebles-hogar", label: "Muebles y hogar" },
  { slug: "mascotas", label: "Mascotas" },
  { slug: "tecnologia", label: "Tecnología" },
  { slug: "deporte", label: "Deporte" },
];

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
