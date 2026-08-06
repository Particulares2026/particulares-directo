-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade el estado del inmueble (nuevo / para entrar / necesita reformas).

alter table public.anuncios add column if not exists estado text;
alter table public.anuncios drop constraint if exists anuncios_estado_check;
alter table public.anuncios add constraint anuncios_estado_check check (estado in (
  'nuevo', 'para_entrar', 'necesita_reformas'
));
