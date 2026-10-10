export const MINIMO_ANUNCIOS = 3;
type AnuncioPrecio = { provincia: string | null; operacion: string | null; precio: number | null; tamano: number | null };
type Muestra = { suma: number; cantidad: number; media: number | null };
export type PrecioProvincia = { provincia: string; venta: Muestra; alquiler: Muestra };
export function resumirPrecios(anuncios: AnuncioPrecio[]): PrecioProvincia[] {
  const provincias = new Map<string, PrecioProvincia>();
  for (const anuncio of anuncios) {
    if (!anuncio.provincia?.trim() || !Number.isFinite(anuncio.precio) || !Number.isFinite(anuncio.tamano)
      || anuncio.precio! <= 0 || anuncio.tamano! <= 0
      || (anuncio.operacion !== 'venta' && anuncio.operacion !== 'alquiler')) continue;
    const valor = anuncio.precio! / anuncio.tamano!;
    if (!Number.isFinite(valor)) continue;
    const provincia = anuncio.provincia.trim();
    const fila = provincias.get(provincia) ?? { provincia,
      venta: { suma: 0, cantidad: 0, media: null }, alquiler: { suma: 0, cantidad: 0, media: null } };
    const muestra = fila[anuncio.operacion];
    muestra.suma += valor;
    muestra.cantidad++;
    muestra.media = muestra.cantidad >= MINIMO_ANUNCIOS ? muestra.suma / muestra.cantidad : null;
    provincias.set(provincia, fila);
  }
  return Array.from(provincias.values()).sort((a, b) => a.provincia.localeCompare(b.provincia, 'es'));
}
