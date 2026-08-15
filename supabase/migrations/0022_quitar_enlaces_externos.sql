-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Quita el campo de enlaces a otras plataformas: no interesa dirigir tráfico fuera de la web.

alter table public.anuncios drop column if exists enlaces_externos;
