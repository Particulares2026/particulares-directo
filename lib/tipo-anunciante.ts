type AnuncioConPropietario = {
  user_id: string;
  categoria: string;
  activo?: boolean;
};

export function marcarTipoAnunciante<T extends AnuncioConPropietario>(anuncios: T[]) {
  const activosPorCuentaYCategoria = new Map<string, number>();

  for (const anuncio of anuncios) {
    if (anuncio.activo === false) continue;
    const clave = `${anuncio.user_id}:${anuncio.categoria}`;
    activosPorCuentaYCategoria.set(clave, (activosPorCuentaYCategoria.get(clave) || 0) + 1);
  }

  return anuncios.map((anuncio) => ({
    ...anuncio,
    es_empresa:
      (activosPorCuentaYCategoria.get(`${anuncio.user_id}:${anuncio.categoria}`) || 0) > 1,
  }));
}
