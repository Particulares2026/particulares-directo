-- Denuncias de anuncios: circuito interno, limitado y no accesible desde el navegador.
create table if not exists public.denuncias_anuncios (
  id bigint generated always as identity primary key,
  anuncio_id uuid references public.anuncios(id) on delete set null,
  anunciante_id uuid references auth.users(id) on delete set null,
  anuncio_titulo text not null,
  anuncio_categoria text not null,
  motivo text not null,
  detalles text not null,
  email_reportante text,
  ip_hash text,
  estado text not null default 'pendiente',
  accion text,
  created_at timestamptz not null default statement_timestamp(),
  resuelta_at timestamptz,
  resuelta_por uuid references auth.users(id) on delete set null,
  constraint denuncias_anuncios_motivo_valido
    check (motivo in (
      'estafa',
      'ilegal',
      'ofensivo',
      'datos_personales',
      'duplicado',
      'categoria_incorrecta',
      'otro'
    )),
  constraint denuncias_anuncios_detalles_validos
    check (char_length(detalles) between 10 and 1500),
  constraint denuncias_anuncios_email_valido
    check (email_reportante is null or char_length(email_reportante) between 3 and 254),
  constraint denuncias_anuncios_ip_hash_valido
    check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  constraint denuncias_anuncios_estado_valido
    check (estado in ('pendiente', 'resuelta')),
  constraint denuncias_anuncios_resolucion_coherente
    check (
      (estado = 'pendiente' and resuelta_at is null and resuelta_por is null and accion is null)
      or
      (estado = 'resuelta' and resuelta_at is not null and accion is not null)
    )
);

comment on table public.denuncias_anuncios is
  'Denuncias confidenciales de anuncios, accesibles únicamente desde el servidor y moderación.';
comment on column public.denuncias_anuncios.ip_hash is
  'Huella HMAC temporal para limitar abuso; se elimina al cerrar la denuncia.';

alter table public.denuncias_anuncios enable row level security;

revoke all on table public.denuncias_anuncios from public, anon, authenticated;
revoke all on sequence public.denuncias_anuncios_id_seq from public, anon, authenticated;
grant select, insert, update on table public.denuncias_anuncios to service_role;
grant usage, select on sequence public.denuncias_anuncios_id_seq to service_role;

create index if not exists denuncias_anuncios_pendientes_idx
  on public.denuncias_anuncios (created_at desc)
  where estado = 'pendiente';
create index if not exists denuncias_anuncios_ip_fecha_idx
  on public.denuncias_anuncios (ip_hash, created_at desc)
  where ip_hash is not null;
create index if not exists denuncias_anuncios_anuncio_id_idx
  on public.denuncias_anuncios (anuncio_id)
  where anuncio_id is not null;
create index if not exists denuncias_anuncios_anunciante_id_idx
  on public.denuncias_anuncios (anunciante_id)
  where anunciante_id is not null;
create index if not exists denuncias_anuncios_resuelta_por_idx
  on public.denuncias_anuncios (resuelta_por)
  where resuelta_por is not null;

create or replace function public.registrar_denuncia_anuncio(
  p_anuncio_id uuid,
  p_motivo text,
  p_detalles text,
  p_email_reportante text,
  p_ip_hash text,
  p_desde timestamptz,
  p_limite integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total integer;
  v_anuncio record;
  v_id bigint;
begin
  if
    p_limite < 1
    or p_motivo not in (
      'estafa',
      'ilegal',
      'ofensivo',
      'datos_personales',
      'duplicado',
      'categoria_incorrecta',
      'otro'
    )
    or char_length(pg_catalog.btrim(p_detalles)) not between 10 and 1500
    or p_ip_hash !~ '^[0-9a-f]{64}$'
    or (
      p_email_reportante is not null
      and char_length(pg_catalog.btrim(p_email_reportante)) not between 3 and 254
    )
  then
    return pg_catalog.jsonb_build_object('estado', 'invalida');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('denuncia:' || p_ip_hash, 0)
  );

  select count(*)
  into v_total
  from public.denuncias_anuncios
  where ip_hash = p_ip_hash
    and created_at >= p_desde;

  if v_total >= p_limite then
    return pg_catalog.jsonb_build_object('estado', 'limite');
  end if;

  if exists (
    select 1
    from public.denuncias_anuncios
    where anuncio_id = p_anuncio_id
      and ip_hash = p_ip_hash
      and created_at >= statement_timestamp() - interval '24 hours'
  ) then
    return pg_catalog.jsonb_build_object('estado', 'duplicada');
  end if;

  select id, user_id, titulo, categoria
  into v_anuncio
  from public.anuncios
  where id = p_anuncio_id and activo = true;

  if not found then
    return pg_catalog.jsonb_build_object('estado', 'no_encontrado');
  end if;

  insert into public.denuncias_anuncios (
    anuncio_id,
    anunciante_id,
    anuncio_titulo,
    anuncio_categoria,
    motivo,
    detalles,
    email_reportante,
    ip_hash
  )
  values (
    v_anuncio.id,
    v_anuncio.user_id,
    v_anuncio.titulo,
    v_anuncio.categoria,
    p_motivo,
    pg_catalog.btrim(p_detalles),
    nullif(pg_catalog.btrim(p_email_reportante), ''),
    p_ip_hash
  )
  returning id into v_id;

  return pg_catalog.jsonb_build_object(
    'estado', 'registrada',
    'id', v_id,
    'anuncio_titulo', v_anuncio.titulo,
    'anuncio_categoria', v_anuncio.categoria
  );
end;
$$;

revoke all on function public.registrar_denuncia_anuncio(
  uuid, text, text, text, text, timestamptz, integer
) from public, anon, authenticated;
grant execute on function public.registrar_denuncia_anuncio(
  uuid, text, text, text, text, timestamptz, integer
) to service_role;
