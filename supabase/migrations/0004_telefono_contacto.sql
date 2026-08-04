-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade el teléfono de contacto de los anuncios (se muestra en vez del correo).

alter table public.anuncios add column if not exists telefono_contacto text;
