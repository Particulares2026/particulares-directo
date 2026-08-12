-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade los campos específicos de la categoría trabajo (servicio doméstico, hostelería,
-- oficios, cuidado de personas, trabajo temporal para extranjeros...).

alter table public.anuncios add column if not exists sector_trabajo text;
alter table public.anuncios add column if not exists modalidad_trabajo text;
alter table public.anuncios add column if not exists salario_min numeric;
alter table public.anuncios add column if not exists salario_max numeric;
alter table public.anuncios add column if not exists salario_periodo text;
alter table public.anuncios add column if not exists experiencia_trabajo text;
alter table public.anuncios add column if not exists idiomas_trabajo text[] not null default '{}';
alter table public.anuncios add column if not exists incorporacion text;

create index if not exists anuncios_sector_trabajo_idx on public.anuncios (sector_trabajo);
