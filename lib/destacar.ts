// Durante el lanzamiento, el destacado gratuito debe rotar con rapidez para que
// no termine ocupando todo el listado. La futura modalidad de pago conserva una
// duración independiente.
export const HORAS_DESTACADO_GRATIS = 24;
export const DIAS_ESPERA_DESTACADO_GRATIS = 7;
export const DIAS_DESTACADO_PAGO = 7;

// A cero mientras la web está creciendo y aún no tiene tráfico suficiente.
// Para volver a cobrar, pon aquí el precio en céntimos de cada categoría.
const PRECIOS_CENTIMOS: Partial<Record<string, number>> = {};

const PRECIO_DEFECTO_CENTIMOS = 0;

export function precioDestacarCentimos(categoria: string): number {
  return PRECIOS_CENTIMOS[categoria] ?? PRECIO_DEFECTO_CENTIMOS;
}

export function precioDestacarTexto(categoria: string): string {
  const centimos = precioDestacarCentimos(categoria);
  if (centimos === 0) {
    return `gratis ${HORAS_DESTACADO_GRATIS} h · una vez cada ${DIAS_ESPERA_DESTACADO_GRATIS} días`;
  }
  const euros = centimos / 100;
  return euros.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export function estaDestacado(destacadoHasta: string | null | undefined): boolean {
  return Boolean(destacadoHasta && new Date(destacadoHasta).getTime() > Date.now());
}
