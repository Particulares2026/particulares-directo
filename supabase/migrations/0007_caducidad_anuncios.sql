-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade la caducidad de 30 días a los anuncios (activo/inactivo + avisos por correo).

alter table public.anuncios add column if not exists activo boolean not null default true;
alter table public.anuncios add column if not exists fecha_activacion timestamptz not null default now();
alter table public.anuncios add column if not exists aviso_5_enviado boolean not null default false;
alter table public.anuncios add column if not exists aviso_3_enviado boolean not null default false;

create index if not exists anuncios_activo_idx on public.anuncios (activo);
