-- Conserva únicamente el estado interno de revisión. Aceptar un anuncio no
-- altera su visibilidad; sirve para que el panel muestre solo los pendientes.
alter table public.anuncios
  add column if not exists moderado_at timestamptz;

alter table public.anuncios
  add column if not exists moderado_por uuid references auth.users(id) on delete set null;

create index if not exists anuncios_pendientes_moderacion_idx
  on public.anuncios (created_at desc)
  where moderado_at is null;

comment on column public.anuncios.moderado_at is
  'Fecha de la última aceptación manual. Se vacía cuando el propietario edita el anuncio.';
