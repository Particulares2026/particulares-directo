create index if not exists anuncios_moderado_por_idx
  on public.anuncios (moderado_por)
  where moderado_por is not null;
