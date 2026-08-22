-- Los archivos se suben desde una ruta de servidor que valida su contenido y aplica
-- límites por cuenta. Se guarda solo un registro técnico, sin datos de la imagen.
create table if not exists public.subidas_fotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists subidas_fotos_user_fecha_idx
  on public.subidas_fotos (user_id, created_at);

alter table public.subidas_fotos enable row level security;
revoke all privileges on table public.subidas_fotos from anon, authenticated;

-- Esta tabla figuraba en el esquema del proyecto, pero no existía en producción.
-- Sin ella, el endpoint anterior no podía contar las revelaciones y el límite se
-- saltaba de forma silenciosa.
create table if not exists public.revelaciones_contacto (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  anuncio_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists revelaciones_contacto_ip_idx
  on public.revelaciones_contacto (ip, created_at);

alter table public.revelaciones_contacto enable row level security;

-- Crear anuncios y subir o borrar fotos pasa exclusivamente por rutas del servidor.
drop policy if exists "Los usuarios crean sus propios anuncios" on public.anuncios;
revoke insert, update, delete on storage.objects from authenticated;

-- Privilegios mínimos para las tablas que sí se manejan desde el navegador.
revoke all privileges on table public.alertas_busqueda from anon, authenticated;
grant select, insert, delete on table public.alertas_busqueda to authenticated;

revoke all privileges on table public.listas_favoritos from anon, authenticated;
grant select, insert, delete on table public.listas_favoritos to authenticated;
grant update (nombre) on table public.listas_favoritos to authenticated;

revoke all privileges on table public.favoritos from anon, authenticated;
grant select, insert, delete on table public.favoritos to authenticated;
grant update (lista_id) on table public.favoritos to authenticated;

revoke all privileges on table public.historial_precios from anon, authenticated;
grant select on table public.historial_precios to anon, authenticated;

revoke all privileges on table public.revelaciones_contacto from anon, authenticated;
revoke all privileges on table public.envios_contacto from anon, authenticated;

-- Una alerta solo puede enviar avisos al correo verificado de la propia sesión.
drop policy if exists "Los usuarios crean sus propias alertas" on public.alertas_busqueda;
create policy "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

-- Un favorito no puede apuntar a una lista que pertenezca a otra cuenta.
drop policy if exists "Los usuarios añaden solo sus propios favoritos" on public.favoritos;
create policy "Los usuarios añaden solo sus propios favoritos"
  on public.favoritos for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      lista_id is null
      or exists (
        select 1 from public.listas_favoritos lista
        where lista.id = lista_id and lista.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Los usuarios actualizan sus propios favoritos" on public.favoritos;
create policy "Los usuarios actualizan sus propios favoritos"
  on public.favoritos for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      lista_id is null
      or exists (
        select 1 from public.listas_favoritos lista
        where lista.id = lista_id and lista.user_id = (select auth.uid())
      )
    )
  );

-- Defensa adicional: aunque una ruta del servidor se modifique en el futuro, los
-- nuevos anuncios no podrán exponer correo, teléfono o enlaces en el texto público.
-- NOT VALID conserva el anuncio de prueba antiguo que ya contiene un correo; la
-- restricción sí se aplica a cualquier alta o edición nueva.
alter table public.anuncios
  add constraint anuncios_sin_email_en_texto_publico
  check (
    (coalesce(titulo, '') || ' ' || coalesce(descripcion, '') || ' ' || coalesce(ubicacion, ''))
    !~* '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}'
  ) not valid;

alter table public.anuncios
  add constraint anuncios_sin_enlaces_en_texto_publico
  check (
    (coalesce(titulo, '') || ' ' || coalesce(descripcion, '') || ' ' || coalesce(ubicacion, ''))
    !~* '(https?://|www[.])'
  ) not valid;

alter table public.anuncios
  add constraint anuncios_sin_telefonos_en_texto_publico
  check (
    (coalesce(titulo, '') || ' ' || coalesce(descripcion, '') || ' ' || coalesce(ubicacion, ''))
    !~ '(^|[^0-9])([+][0-9]{1,3}[ -]?)?([0-9][ ().-]?){8,15}([^0-9]|$)'
  ) not valid;
