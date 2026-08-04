-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade tamaño, características y duración del alquiler a los anuncios de inmobiliaria.

alter table public.anuncios add column if not exists tamano numeric;

alter table public.anuncios add column if not exists caracteristicas text[] not null default '{}';

alter table public.anuncios add column if not exists duracion_alquiler text;
alter table public.anuncios drop constraint if exists anuncios_duracion_alquiler_check;
alter table public.anuncios add constraint anuncios_duracion_alquiler_check check (duracion_alquiler in (
  'temporada', 'larga_estancia'
));
