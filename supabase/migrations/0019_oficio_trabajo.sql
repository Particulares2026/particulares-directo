-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Profesión concreta dentro del sector "oficios" (ej. fontanería, electricidad),
-- para poder filtrar por profesión en vez de solo por el sector general.

alter table public.anuncios add column if not exists oficio text;
