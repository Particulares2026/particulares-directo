-- Todas las altas y bajas de anuncios pasan por el servidor para que no se
-- puedan saltar los límites ni la limpieza de fotografías desde el Data API.
revoke delete on public.anuncios from authenticated;

create table if not exists public.publicaciones_anuncios (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default statement_timestamp()
);

create index if not exists publicaciones_anuncios_user_fecha_idx
  on public.publicaciones_anuncios (user_id, created_at desc);

alter table public.publicaciones_anuncios enable row level security;
revoke all privileges on table public.publicaciones_anuncios from anon, authenticated;
grant select, insert, delete on table public.publicaciones_anuncios to service_role;

create or replace function public.reservar_publicacion_anuncio(
  p_user_id uuid,
  p_limite integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null or p_limite < 1 then
    return false;
  end if;

  -- Serializa únicamente las altas del mismo usuario. Así varias peticiones
  -- simultáneas no pueden observar el mismo contador y superar el límite.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if (
    select count(*)
    from public.publicaciones_anuncios
    where user_id = p_user_id
      and created_at >= statement_timestamp() - interval '1 hour'
  ) >= p_limite then
    return false;
  end if;

  insert into public.publicaciones_anuncios (user_id) values (p_user_id);
  return true;
end;
$$;

revoke all on function public.reservar_publicacion_anuncio(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.reservar_publicacion_anuncio(uuid, integer)
  to service_role;
