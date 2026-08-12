-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade la ubicación en el mapa a los anuncios de inmobiliaria.

alter table public.anuncios add column if not exists lat double precision;
alter table public.anuncios add column if not exists lng double precision;
