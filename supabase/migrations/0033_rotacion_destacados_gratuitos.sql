-- Los destacados gratuitos duran 24 horas y solo pueden activarse una vez cada
-- 7 días por anuncio. El registro es privado y el límite se aplica de forma
-- atómica para impedir activaciones simultáneas o llamadas directas a la API.
create table if not exists public.destacados_gratuitos (
  id uuid primary key default gen_random_uuid(),
  anuncio_id uuid not null references public.anuncios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists destacados_gratuitos_anuncio_fecha_idx
  on public.destacados_gratuitos (anuncio_id, created_at desc);

create index if not exists destacados_gratuitos_user_idx
  on public.destacados_gratuitos (user_id);

alter table public.destacados_gratuitos enable row level security;
revoke all privileges on table public.destacados_gratuitos from anon, authenticated;

create or replace function public.aplicar_destacado_gratuito(
  p_anuncio_id uuid,
  p_user_id uuid,
  p_horas integer,
  p_dias_espera integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ahora timestamptz := statement_timestamp();
  v_disponible_desde timestamptz;
  v_destacado_hasta timestamptz;
  v_filas_actualizadas integer;
begin
  if p_anuncio_id is null
    or p_user_id is null
    or p_horas < 1
    or p_horas > 168
    or p_dias_espera < 1
    or p_dias_espera > 365 then
    raise exception 'Parámetros de destacado no válidos';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_anuncio_id::text, 0)
  );

  select max(created_at) + pg_catalog.make_interval(days => p_dias_espera)
  into v_disponible_desde
  from public.destacados_gratuitos
  where anuncio_id = p_anuncio_id;

  if v_disponible_desde is not null and v_disponible_desde > v_ahora then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'disponible_desde', v_disponible_desde
    );
  end if;

  v_destacado_hasta := v_ahora + pg_catalog.make_interval(hours => p_horas);

  update public.anuncios
  set destacado_hasta = v_destacado_hasta
  where id = p_anuncio_id and user_id = p_user_id;

  get diagnostics v_filas_actualizadas = row_count;
  if v_filas_actualizadas <> 1 then
    raise exception 'El anuncio no existe o no pertenece al usuario';
  end if;

  insert into public.destacados_gratuitos (anuncio_id, user_id, created_at)
  values (p_anuncio_id, p_user_id, v_ahora);

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'destacado_hasta', v_destacado_hasta,
    'disponible_desde', v_ahora + pg_catalog.make_interval(days => p_dias_espera)
  );
end;
$$;

revoke all on function public.aplicar_destacado_gratuito(uuid, uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.aplicar_destacado_gratuito(uuid, uuid, integer, integer)
  to service_role;
