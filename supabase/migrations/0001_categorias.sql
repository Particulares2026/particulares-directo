-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade categorías a los anuncios existentes y adapta el campo "tipo".

alter table public.anuncios add column if not exists categoria text;

update public.anuncios
  set categoria = 'trabajo'
  where categoria is null or categoria not in (
    'inmobiliaria', 'trabajo', 'coches', 'moda', 'muebles-hogar', 'mascotas', 'tecnologia', 'deporte'
  );

alter table public.anuncios alter column categoria set not null;

alter table public.anuncios drop constraint if exists anuncios_categoria_check;
alter table public.anuncios add constraint anuncios_categoria_check check (categoria in (
  'inmobiliaria', 'trabajo', 'coches', 'moda', 'muebles-hogar', 'mascotas', 'tecnologia', 'deporte'
));

create index if not exists anuncios_categoria_idx on public.anuncios (categoria);

-- Hay que quitar la restricción antigua de "tipo" antes de cambiar los valores,
-- porque solo permitía 'busco_empleo'/'ofrezco_empleo'.
alter table public.anuncios drop constraint if exists anuncios_tipo_check;

update public.anuncios set tipo = 'busco' where tipo = 'busco_empleo';
update public.anuncios set tipo = 'ofrezco' where tipo = 'ofrezco_empleo';
update public.anuncios set tipo = 'busco' where tipo not in ('busco', 'ofrezco');

alter table public.anuncios add constraint anuncios_tipo_check check (tipo in ('busco', 'ofrezco'));
