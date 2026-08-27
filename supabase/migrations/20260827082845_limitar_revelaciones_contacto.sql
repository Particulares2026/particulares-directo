-- Comprueba, reserva y devuelve el contacto en una sola transacción para que
-- varias peticiones simultáneas no puedan superar los límites anti-rastreo.
create or replace function public.registrar_revelacion_contacto(
  p_ip text,
  p_anuncio_id uuid,
  p_desde timestamptz,
  p_limite_total integer,
  p_limite_anuncio integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total integer;
  v_mismo_anuncio integer;
  v_telefono text;
  v_email text;
  v_mostrar_telefono boolean;
  v_mostrar_email boolean;
begin
  if p_ip is null
    or length(p_ip) > 200
    or p_anuncio_id is null
    or p_desde is null
    or p_limite_total < 1
    or p_limite_anuncio < 1
    or p_limite_anuncio > p_limite_total then
    return pg_catalog.jsonb_build_object('estado', 'invalido');
  end if;

  select
    telefono_contacto,
    email_contacto,
    mostrar_telefono,
    mostrar_email
  into
    v_telefono,
    v_email,
    v_mostrar_telefono,
    v_mostrar_email
  from public.anuncios
  where id = p_anuncio_id and activo = true;

  if not found then
    return pg_catalog.jsonb_build_object('estado', 'no_encontrado');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_ip, 0)
  );

  select count(*) into v_total
  from public.revelaciones_contacto
  where ip = p_ip and created_at >= p_desde;

  select count(*) into v_mismo_anuncio
  from public.revelaciones_contacto
  where ip = p_ip
    and anuncio_id = p_anuncio_id
    and created_at >= p_desde;

  if v_total >= p_limite_total or v_mismo_anuncio >= p_limite_anuncio then
    return pg_catalog.jsonb_build_object('estado', 'limite');
  end if;

  insert into public.revelaciones_contacto (ip, anuncio_id)
  values (p_ip, p_anuncio_id);

  return pg_catalog.jsonb_build_object(
    'estado', 'permitido',
    'telefono_contacto', case when v_mostrar_telefono is not false then v_telefono else null end,
    'email_contacto', case when v_mostrar_email then v_email else null end
  );
end;
$$;

revoke all on function public.registrar_revelacion_contacto(
  text, uuid, timestamptz, integer, integer
) from public, anon, authenticated;
grant execute on function public.registrar_revelacion_contacto(
  text, uuid, timestamptz, integer, integer
) to service_role;

