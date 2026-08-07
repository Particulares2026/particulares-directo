export const DIAS_DESTACADO = 30;

const PRECIOS_CENTIMOS: Partial<Record<string, number>> = {
  inmobiliaria: 299,
};

const PRECIO_DEFECTO_CENTIMOS = 100;

export function precioDestacarCentimos(categoria: string): number {
  return PRECIOS_CENTIMOS[categoria] ?? PRECIO_DEFECTO_CENTIMOS;
}

export function precioDestacarTexto(categoria: string): string {
  const euros = precioDestacarCentimos(categoria) / 100;
  return euros.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export function estaDestacado(destacadoHasta: string | null | undefined): boolean {
  return Boolean(destacadoHasta && new Date(destacadoHasta).getTime() > Date.now());
}
