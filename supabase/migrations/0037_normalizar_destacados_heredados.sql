-- Normaliza únicamente destacados antiguos creados antes de la rotación gratuita.
-- Los pagos y los destacados ya registrados conservan siempre su fecha original.
with destacados_heredados as materialized (
  select a.id, a.user_id
  from public.anuncios as a
  where a.destacado_hasta > statement_timestamp() + interval '24 hours'
    and not exists (
      select 1
      from public.pagos_destacados as p
      where p.anuncio_id = a.id
    )
    and not exists (
      select 1
      from public.destacados_gratuitos as d
      where d.anuncio_id = a.id
    )
), destacados_registrados as (
  insert into public.destacados_gratuitos (anuncio_id, user_id, created_at)
  select id, user_id, statement_timestamp()
  from destacados_heredados
  returning anuncio_id
)
update public.anuncios as a
set destacado_hasta = statement_timestamp() + interval '24 hours'
where a.id in (
  select anuncio_id
  from destacados_registrados
);
