-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade el destacado de pago a los anuncios.

alter table public.anuncios add column if not exists destacado_hasta timestamptz;
create index if not exists anuncios_destacado_hasta_idx on public.anuncios (destacado_hasta);
