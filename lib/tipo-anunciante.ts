type AnuncioConPropietario = {
  user_id: string;
  categoria: string;
  activo?: boolean;
};

export const UMBRAL_EMPRESA_POR_CATEGORIA = 2;

export function claveCuentaCategoria(userId: string, categoria: string) {
  return `${userId}:${categoria}`;
}

export function esEmpresaPorCantidad(cantidad: number) {
  return cantidad >= UMBRAL_EMPRESA_POR_CATEGORIA;
}

export function contarActivosPorCuentaYCategoria(anuncios: AnuncioConPropietario[]) {
  const activosPorCuentaYCategoria = new Map<string, number>();

  for (const anuncio of anuncios) {
    if (anuncio.activo === false) continue;
    const clave = claveCuentaCategoria(anuncio.user_id, anuncio.categoria);
    activosPorCuentaYCategoria.set(clave, (activosPorCuentaYCategoria.get(clave) || 0) + 1);
  }

  return activosPorCuentaYCategoria;
}

export function marcarTipoAnunciante<T extends AnuncioConPropietario>(anuncios: T[]) {
  const activosPorCuentaYCategoria = contarActivosPorCuentaYCategoria(anuncios);

  return anuncios.map((anuncio) => ({
    ...anuncio,
    anuncios_activos_categoria:
      activosPorCuentaYCategoria.get(claveCuentaCategoria(anuncio.user_id, anuncio.categoria)) || 0,
    es_empresa: esEmpresaPorCantidad(
      activosPorCuentaYCategoria.get(claveCuentaCategoria(anuncio.user_id, anuncio.categoria)) || 0
    ),
  }));
}

