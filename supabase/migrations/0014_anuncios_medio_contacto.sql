-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Permite elegir si el anuncio muestra teléfono, email, o ambos.

alter table public.anuncios add column if not exists mostrar_telefono boolean not null default true;
alter table public.anuncios add column if not exists mostrar_email boolean not null default false;
