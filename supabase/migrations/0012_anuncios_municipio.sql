-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade el municipio (pueblo) a los anuncios de inmobiliaria, para poder filtrar dentro de una provincia.

alter table public.anuncios add column if not exists municipio text;
create index if not exists anuncios_municipio_idx on public.anuncios (municipio);
