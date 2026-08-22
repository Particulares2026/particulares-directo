-- Hace atómico el límite del buzón para que varias peticiones simultáneas no
-- puedan superar el máximo y restringe la función al servidor.
create or replace function public.registrar_envio_contacto(
  p_ip text,
  p_desde timestamptz,
  p_limite integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total integer;
begin
  if p_ip is null or length(p_ip) > 200 or p_limite < 1 then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_ip, 0));

  select count(*)
  into v_total
  from public.envios_contacto
  where ip = p_ip and created_at >= p_desde;

  if v_total >= p_limite then
    return false;
  end if;

  insert into public.envios_contacto (ip) values (p_ip);
  return true;
end;
$$;

revoke all on function public.registrar_envio_contacto(text, timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.registrar_envio_contacto(text, timestamptz, integer)
  to service_role;

-- Registro privado de pagos aplicados. El identificador único del evento evita
-- duplicar un destacado cuando Stripe reintenta el mismo aviso.
create table if not exists public.pagos_destacados (
  stripe_event_id text primary key,
  stripe_session_id text not null unique,
  anuncio_id uuid references public.anuncios(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  importe_centimos integer not null check (importe_centimos > 0),
  moneda text not null check (moneda ~ '^[a-z]{3}$'),
  created_at timestamptz not null default now()
);

create index if not exists pagos_destacados_anuncio_idx
  on public.pagos_destacados (anuncio_id, created_at desc);

alter table public.pagos_destacados enable row level security;
revoke all privileges on table public.pagos_destacados from anon, authenticated;

-- Registra el pago y amplía el destacado dentro de una sola transacción. Ante
-- cualquier error no queda ni un pago a medias ni un anuncio sin destacar.
create or replace function public.procesar_pago_destacado(
  p_stripe_event_id text,
  p_stripe_session_id text,
  p_anuncio_id uuid,
  p_user_id uuid,
  p_importe_centimos integer,
  p_moneda text,
  p_dias integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_evento_insertado text;
  v_filas_actualizadas integer;
begin
  if p_stripe_event_id is null
    or p_stripe_session_id is null
    or p_importe_centimos <= 0
    or p_moneda !~ '^[a-z]{3}$'
    or p_dias < 1
    or p_dias > 365 then
    raise exception 'Datos de pago no válidos';
  end if;

  insert into public.pagos_destacados (
    stripe_event_id,
    stripe_session_id,
    anuncio_id,
    user_id,
    importe_centimos,
    moneda
  ) values (
    p_stripe_event_id,
    p_stripe_session_id,
    p_anuncio_id,
    p_user_id,
    p_importe_centimos,
    p_moneda
  )
  on conflict do nothing
  returning stripe_event_id into v_evento_insertado;

  if v_evento_insertado is null then
    return false;
  end if;

  update public.anuncios
  set destacado_hasta = greatest(coalesce(destacado_hasta, now()), now())
    + pg_catalog.make_interval(days => p_dias)
  where id = p_anuncio_id and user_id = p_user_id;

  get diagnostics v_filas_actualizadas = row_count;
  if v_filas_actualizadas <> 1 then
    raise exception 'El anuncio del pago no existe o no pertenece al usuario';
  end if;

  return true;
end;
$$;

revoke all on function public.procesar_pago_destacado(
  text, text, uuid, uuid, integer, text, integer
) from public, anon, authenticated;
grant execute on function public.procesar_pago_destacado(
  text, text, uuid, uuid, integer, text, integer
) to service_role;

