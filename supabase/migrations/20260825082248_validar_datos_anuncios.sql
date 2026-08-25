-- Impide que peticiones manipuladas guarden números imposibles o mezclen
-- campos de inmobiliaria, trabajo y categorías generales.

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.anuncios'::regclass and conname = 'anuncios_numeros_en_rango'
  ) then
    alter table public.anuncios
      add constraint anuncios_numeros_en_rango
      check (
        (precio is null or precio between 0 and 1000000000)
        and (precio_anterior is null or precio_anterior between 0 and 1000000000)
        and (habitaciones is null or habitaciones between 0 and 100)
        and (banos is null or banos between 0 and 100)
        and (tamano is null or tamano between 1 and 10000000)
        and (salario_min is null or salario_min between 0 and 10000000)
        and (salario_max is null or salario_max between 0 and 10000000)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.anuncios'::regclass and conname = 'anuncios_salario_coherente'
  ) then
    alter table public.anuncios
      add constraint anuncios_salario_coherente
      check (
        (salario_min is null or salario_max is null or salario_min <= salario_max)
        and ((salario_min is null and salario_max is null) or salario_periodo is not null)
        and (salario_periodo is distinct from 'convenir' or (salario_min is null and salario_max is null))
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.anuncios'::regclass and conname = 'anuncios_coordenadas_completas'
  ) then
    alter table public.anuncios
      add constraint anuncios_coordenadas_completas
      check (
        (lat is null and lng is null)
        or (
          lat is not null and lng is not null
          and lat between -90 and 90 and lng between -180 and 180
        )
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.anuncios'::regclass and conname = 'anuncios_campos_inmobiliaria_coherentes'
  ) then
    alter table public.anuncios
      add constraint anuncios_campos_inmobiliaria_coherentes
      check (
        (
          categoria = 'inmobiliaria'
          and operacion is not null
          and tipo_inmueble is not null
          and provincia is not null
          and precio is not null
          and (
            (operacion = 'alquiler' and duracion_alquiler is not null)
            or (operacion = 'venta' and duracion_alquiler is null)
          )
        )
        or (
          categoria <> 'inmobiliaria'
          and operacion is null
          and tipo_inmueble is null
          and precio is null
          and precio_anterior is null
          and habitaciones is null
          and banos is null
          and amueblado is null
          and tamano is null
          and duracion_alquiler is null
          and estado is null
          and lat is null
          and lng is null
        )
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.anuncios'::regclass and conname = 'anuncios_campos_trabajo_coherentes'
  ) then
    alter table public.anuncios
      add constraint anuncios_campos_trabajo_coherentes
      check (
        categoria = 'trabajo'
        or (
          sector_trabajo is null
          and modalidad_trabajo is null
          and salario_min is null
          and salario_max is null
          and salario_periodo is null
          and experiencia_trabajo is null
          and cardinality(idiomas_trabajo) = 0
          and incorporacion is null
        )
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.anuncios'::regclass and conname = 'anuncios_ubicacion_categoria_coherente'
  ) then
    alter table public.anuncios
      add constraint anuncios_ubicacion_categoria_coherente
      check (
        categoria in ('inmobiliaria', 'trabajo')
        or (provincia is null and municipio is null)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.anuncios'::regclass and conname = 'anuncios_caracteristicas_categoria_coherentes'
  ) then
    alter table public.anuncios
      add constraint anuncios_caracteristicas_categoria_coherentes
      check (
        categoria in ('inmobiliaria', 'trabajo')
        or cardinality(caracteristicas) = 0
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.anuncios'::regclass and conname = 'anuncios_listas_limitadas'
  ) then
    alter table public.anuncios
      add constraint anuncios_listas_limitadas
      check (
        cardinality(fotos) <= 10
        and cardinality(palabras_clave) <= 30
        and cardinality(caracteristicas) <= 30
        and cardinality(idiomas_trabajo) <= 30
      ) not valid;
  end if;
end;
$migration$;

alter table public.anuncios validate constraint anuncios_numeros_en_rango;
alter table public.anuncios validate constraint anuncios_salario_coherente;
alter table public.anuncios validate constraint anuncios_coordenadas_completas;
alter table public.anuncios validate constraint anuncios_campos_inmobiliaria_coherentes;
alter table public.anuncios validate constraint anuncios_campos_trabajo_coherentes;
alter table public.anuncios validate constraint anuncios_ubicacion_categoria_coherente;
alter table public.anuncios validate constraint anuncios_caracteristicas_categoria_coherentes;
alter table public.anuncios validate constraint anuncios_listas_limitadas;

