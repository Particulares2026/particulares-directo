-- Prueba privada de la aceptación realizada durante el alta. No se guardan IP,
-- navegador ni otros datos técnicos: solo el usuario, las versiones y la fecha.
create schema if not exists private;

revoke all on schema private from public, anon, authenticated, service_role;

create table if not exists private.consentimientos_legales (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version_privacidad text not null,
  version_terminos text not null,
  aceptado_en timestamptz not null default statement_timestamp()
);

comment on table private.consentimientos_legales is
  'Prueba privada del aviso de privacidad y los términos aceptados al crear una cuenta.';
comment on column private.consentimientos_legales.aceptado_en is
  'Fecha asignada por PostgreSQL; no procede del reloj del navegador.';

alter table private.consentimientos_legales enable row level security;
revoke all on table private.consentimientos_legales from public, anon, authenticated, service_role;

create or replace function private.registrar_consentimiento_legal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if
    new.raw_user_meta_data #>> '{consentimiento_legal,aceptado}' = 'true'
    and new.raw_user_meta_data #>> '{consentimiento_legal,version_privacidad}' = '2026-08-27'
    and new.raw_user_meta_data #>> '{consentimiento_legal,version_terminos}' = '2026-08-27'
  then
    insert into private.consentimientos_legales (
      user_id,
      version_privacidad,
      version_terminos,
      aceptado_en
    )
    values (
      new.id,
      '2026-08-27',
      '2026-08-27',
      statement_timestamp()
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.registrar_consentimiento_legal()
  from public, anon, authenticated, service_role;

drop trigger if exists registrar_consentimiento_legal_alta on auth.users;
create trigger registrar_consentimiento_legal_alta
  after insert on auth.users
  for each row execute function private.registrar_consentimiento_legal();
