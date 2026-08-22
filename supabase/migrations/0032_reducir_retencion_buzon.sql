-- Los identificadores del buzón solo sirven durante la ventana del límite.
-- El servidor los guarda anonimizados y esta función elimina los ya caducados.
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
  delete from public.envios_contacto where created_at < p_desde;

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

