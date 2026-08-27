-- Conserva el rastro de cada archivo para aplicar los límites de forma atómica
-- y poder retirar únicamente imágenes que no pertenezcan a ningún anuncio.
alter table public.subidas_fotos
  add column if not exists storage_path text,
  add column if not exists completada boolean not null default false;

create unique index if not exists subidas_fotos_storage_path_idx
  on public.subidas_fotos (storage_path)
  where storage_path is not null;

create index if not exists subidas_fotos_limpieza_idx
  on public.subidas_fotos (created_at)
  where storage_path is not null;

-- Registra también las imágenes que ya existían antes de esta mejora. No se
-- modifica ni elimina ningún archivo durante la migración.
insert into public.subidas_fotos (user_id, created_at, storage_path, completada)
select
  usuario.id,
  coalesce(objeto.created_at, statement_timestamp()),
  objeto.name,
  true
from storage.objects objeto
join auth.users usuario
  on usuario.id::text = split_part(objeto.name, '/', 1)
where objeto.bucket_id = 'inmuebles'
  and objeto.name is not null
  and objeto.name like usuario.id::text || '/%'
on conflict (storage_path) where storage_path is not null do nothing;

grant select, insert, update, delete on table public.subidas_fotos to service_role;

create or replace function public.reservar_subida_foto(
  p_user_id uuid,
  p_storage_path text,
  p_limite_hora integer,
  p_limite_total integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_subidas_hora integer;
  v_objetos integer;
  v_reservas_pendientes integer;
  v_reserva_id uuid;
begin
  if p_user_id is null
    or p_storage_path is null
    or p_limite_hora < 1
    or p_limite_total < 1
    or p_limite_hora > 1000
    or p_limite_total > 10000
    or p_storage_path !~ (
      '^' || p_user_id::text ||
      '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp|gif)$'
    )
  then
    return jsonb_build_object('estado', 'invalida');
  end if;

  -- Una sola reserva por usuario puede comprobar e incrementar el cupo cada vez.
  -- El bloqueo dura únicamente esta breve transacción, nunca durante la subida.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('subida_foto:' || p_user_id::text, 0)
  );

  select count(*)::integer
  into v_subidas_hora
  from public.subidas_fotos
  where user_id = p_user_id
    and created_at >= statement_timestamp() - interval '1 hour';

  if v_subidas_hora >= p_limite_hora then
    return jsonb_build_object('estado', 'limite_hora');
  end if;

  select count(*)::integer
  into v_objetos
  from storage.objects
  where bucket_id = 'inmuebles'
    and name like p_user_id::text || '/%';

  -- Mientras Storage termina una subida, la reserva evita que otra petición
  -- simultánea vea todavía el cupo anterior y lo rebase.
  select count(*)::integer
  into v_reservas_pendientes
  from public.subidas_fotos reserva
  where reserva.user_id = p_user_id
    and reserva.storage_path is not null
    and not reserva.completada
    and reserva.created_at >= statement_timestamp() - interval '24 hours'
    and not exists (
      select 1
      from storage.objects objeto
      where objeto.bucket_id = 'inmuebles'
        and objeto.name = reserva.storage_path
    );

  if v_objetos + v_reservas_pendientes >= p_limite_total then
    return jsonb_build_object('estado', 'limite_total');
  end if;

  insert into public.subidas_fotos (user_id, storage_path, completada)
  values (p_user_id, p_storage_path, false)
  returning id into v_reserva_id;

  return jsonb_build_object('estado', 'reservada', 'id', v_reserva_id);
end;
$$;

revoke all on function public.reservar_subida_foto(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.reservar_subida_foto(uuid, text, integer, integer)
  to service_role;

