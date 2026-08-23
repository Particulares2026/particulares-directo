-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.

create table if not exists public.anuncios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null check (categoria in (
    'inmobiliaria', 'trabajo', 'coches', 'moda', 'muebles-hogar', 'mascotas', 'tecnologia', 'deporte'
  )),
  tipo text not null check (tipo in ('busco', 'ofrezco')),
  titulo text not null,
  descripcion text,
  ubicacion text,
  palabras_clave text[] not null default '{}',
  nombre_contacto text not null,
  telefono_contacto text,
  email_contacto text not null,
  -- Qué medios de contacto se muestran públicamente en el anuncio (al menos uno).
  mostrar_telefono boolean not null default true,
  mostrar_email boolean not null default false,
  created_at timestamptz not null default now(),
  -- Campos específicos de la categoría inmobiliaria (null para el resto de categorías).
  operacion text check (operacion in ('venta', 'alquiler')),
  -- Provincia y municipio se usan en inmobiliaria y también en trabajo.
  provincia text,
  municipio text,
  tipo_inmueble text check (tipo_inmueble in (
    'piso', 'casa', 'habitacion', 'garaje', 'trastero', 'local', 'terreno', 'edificio'
  )),
  precio numeric,
  -- Precio inmediatamente anterior al actual, para poder mostrar "antes X, ahora Y"
  -- cuando el propietario baja o sube el precio (como hace idealista).
  precio_anterior numeric,
  habitaciones int,
  banos int,
  amueblado boolean,
  tamano numeric,
  caracteristicas text[] not null default '{}',
  duracion_alquiler text check (duracion_alquiler in ('temporada', 'larga_estancia')),
  fotos text[] not null default '{}',
  estado text check (estado in ('nuevo', 'para_entrar', 'necesita_reformas')),
  -- Ubicación en el mapa (solo inmobiliaria; null si el anuncio no la tiene marcada).
  lat double precision,
  lng double precision,
  -- Campos específicos de la categoría trabajo (null para el resto de categorías).
  sector_trabajo text,
  modalidad_trabajo text,
  salario_min numeric,
  salario_max numeric,
  salario_periodo text,
  experiencia_trabajo text,
  idiomas_trabajo text[] not null default '{}',
  incorporacion text,
  -- Caducidad: un anuncio se desactiva 30 días después de fecha_activacion si no se renueva.
  activo boolean not null default true,
  fecha_activacion timestamptz not null default now(),
  aviso_5_enviado boolean not null default false,
  aviso_3_enviado boolean not null default false,
  -- Seguimiento interno: las ediciones vuelven a dejar el anuncio pendiente.
  moderado_at timestamptz,
  moderado_por uuid references auth.users(id) on delete set null,
  -- Anuncio destacado (de pago): vigente mientras destacado_hasta sea futuro.
  destacado_hasta timestamptz
);

create index if not exists anuncios_categoria_idx on public.anuncios (categoria);
create index if not exists anuncios_destacado_hasta_idx on public.anuncios (destacado_hasta);
create index if not exists anuncios_activo_idx on public.anuncios (activo);
create index if not exists anuncios_tipo_idx on public.anuncios (tipo);
create index if not exists anuncios_created_at_idx on public.anuncios (created_at desc);
create index if not exists anuncios_user_id_idx on public.anuncios (user_id);
create index if not exists anuncios_provincia_idx on public.anuncios (provincia);
create index if not exists anuncios_municipio_idx on public.anuncios (municipio);
create index if not exists anuncios_sector_trabajo_idx on public.anuncios (sector_trabajo);
create index if not exists anuncios_pendientes_moderacion_idx
  on public.anuncios (created_at desc)
  where moderado_at is null;
create index if not exists anuncios_moderado_por_idx
  on public.anuncios (moderado_por)
  where moderado_por is not null;

-- Activa la seguridad a nivel de fila: sin esto, con la clave "anon" cualquiera
-- podría leer o modificar toda la tabla directamente.
alter table public.anuncios enable row level security;

-- Solo los anuncios activos son públicos; el propietario también puede leer los suyos
-- cuando están inactivos para gestionarlos y reactivarlos.
create policy "Los anuncios activos son visibles y cada usuario ve los suyos"
  on public.anuncios for select
  using (activo = true or auth.uid() = user_id);

-- Solo un usuario autenticado puede crear anuncios, y únicamente a su propio nombre.
create policy "Los usuarios crean sus propios anuncios"
  on public.anuncios for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Un usuario solo puede modificar los anuncios de los que es autor.
create policy "Los usuarios editan solo sus propios anuncios"
  on public.anuncios for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Un usuario solo puede eliminar los anuncios de los que es autor.
create policy "Los usuarios eliminan solo sus propios anuncios"
  on public.anuncios for delete
  to authenticated
  using (auth.uid() = user_id);

-- El visitante anónimo solo puede leer campos públicos. Crear y editar contenido
-- pasa por el servidor; el usuario conserva DELETE sobre sus filas y UPDATE solo
-- para los botones "Actualizar" y "Desactivar", todo ello limitado por RLS.
revoke all privileges on table public.anuncios from anon;
revoke select, insert, update, references, trigger, truncate
  on table public.anuncios from authenticated;
grant delete on table public.anuncios to authenticated;
grant update (activo, fecha_activacion, aviso_5_enviado, aviso_3_enviado)
  on public.anuncios to authenticated;

-- Teléfono y email nunca se leen con la clave pública. El servidor los entrega solo
-- al propietario o a través del endpoint limitado de "Mostrar contacto".
grant select (
  id, user_id, categoria, tipo, titulo, descripcion, ubicacion, palabras_clave,
  nombre_contacto, mostrar_telefono, mostrar_email, created_at, operacion,
  provincia, municipio, tipo_inmueble, precio, precio_anterior, habitaciones,
  banos, amueblado, tamano, caracteristicas, duracion_alquiler, fotos, estado,
  lat, lng, sector_trabajo, modalidad_trabajo, salario_min, salario_max,
  salario_periodo, experiencia_trabajo, idiomas_trabajo, incorporacion, activo,
  fecha_activacion, destacado_hasta
) on public.anuncios to anon, authenticated;

-- Listas propias para agrupar favoritos (ej. "Para visitar", "Zona norte"...).
create table if not exists public.listas_favoritos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

alter table public.listas_favoritos enable row level security;

create policy "Los usuarios ven solo sus propias listas"
  on public.listas_favoritos for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Los usuarios crean sus propias listas"
  on public.listas_favoritos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Los usuarios renombran sus propias listas"
  on public.listas_favoritos for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Los usuarios eliminan sus propias listas"
  on public.listas_favoritos for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.favoritos (
  user_id uuid not null references auth.users(id) on delete cascade,
  anuncio_id uuid not null references public.anuncios(id) on delete cascade,
  lista_id uuid references public.listas_favoritos(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, anuncio_id)
);

alter table public.favoritos enable row level security;

create policy "Los usuarios ven solo sus propios favoritos"
  on public.favoritos for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Los usuarios añaden solo sus propios favoritos"
  on public.favoritos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Los usuarios actualizan sus propios favoritos"
  on public.favoritos for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Los usuarios eliminan solo sus propios favoritos"
  on public.favoritos for delete
  to authenticated
  using (auth.uid() = user_id);

-- Alertas por email de nuevos anuncios de inmobiliaria que coincidan con una búsqueda guardada.
create table if not exists public.alertas_busqueda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  categoria text not null default 'inmobiliaria',
  query text,
  operacion text,
  tipo text,
  provincia text,
  tipo_inmueble text,
  precio_min numeric,
  precio_max numeric,
  tamano_min numeric,
  tamano_max numeric,
  habitaciones int,
  banos int,
  amueblado boolean,
  duracion_alquiler text,
  estado text,
  caracteristicas text[] not null default '{}',
  created_at timestamptz not null default now(),
  ultima_revision timestamptz not null default now()
);

create index if not exists alertas_busqueda_user_id_idx on public.alertas_busqueda (user_id);

alter table public.alertas_busqueda enable row level security;

create policy "Los usuarios ven solo sus propias alertas"
  on public.alertas_busqueda for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Los usuarios eliminan sus propias alertas"
  on public.alertas_busqueda for delete
  to authenticated
  using (auth.uid() = user_id);

-- Bucket público para las fotos de los anuncios de inmobiliaria.
-- Solo imágenes reales (sin SVG, que puede llevar código incrustado) y máximo 5 MB por archivo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('inmuebles', 'inmuebles', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  on conflict (id) do update set
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Las fotos de inmuebles son visibles para todos"
  on storage.objects for select
  using (bucket_id = 'inmuebles');

create policy "Los usuarios suben fotos a su propia carpeta"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'inmuebles' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Los usuarios eliminan solo sus propias fotos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'inmuebles' and (storage.foldername(name))[1] = auth.uid()::text);

-- Registro de peticiones para "Mostrar contacto", para dificultar el rastreo
-- automático masivo de teléfonos y emails de los anuncios.
create table if not exists public.revelaciones_contacto (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  anuncio_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists revelaciones_contacto_ip_idx on public.revelaciones_contacto (ip, created_at);

alter table public.revelaciones_contacto enable row level security;
-- Sin políticas: solo es accesible con la clave de servicio, desde el servidor.

-- Registro de envíos del buzón de sugerencias, para limitar el spam automatizado.
create table if not exists public.envios_contacto (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists envios_contacto_ip_idx on public.envios_contacto (ip, created_at);

alter table public.envios_contacto enable row level security;
-- Sin políticas: solo es accesible con la clave de servicio, desde el servidor.

-- Histórico de precios de anuncios de inmobiliaria: guarda cada precio que ha tenido
-- un anuncio a lo largo del tiempo, para poder mostrar su evolución.
create table if not exists public.historial_precios (
  id uuid primary key default gen_random_uuid(),
  anuncio_id uuid not null references public.anuncios(id) on delete cascade,
  precio numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists historial_precios_anuncio_id_idx on public.historial_precios (anuncio_id, created_at);

alter table public.historial_precios enable row level security;

create policy "El historial de precios es visible para todos"
  on public.historial_precios for select
  using (true);

-- Bucket privado para las copias de seguridad automáticas diarias de la base de datos.
-- Sin políticas: solo es accesible con la clave de servicio, desde el servidor.
insert into storage.buckets (id, name, public)
  values ('backups', 'backups', false)
  on conflict (id) do nothing;

-- Registro técnico para limitar las subidas de fotos desde el servidor.
create table if not exists public.subidas_fotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists subidas_fotos_user_fecha_idx
  on public.subidas_fotos (user_id, created_at);

alter table public.subidas_fotos enable row level security;
revoke all privileges on table public.subidas_fotos from anon, authenticated;

-- Crear anuncios y gestionar archivos se hace exclusivamente desde el servidor.
drop policy if exists "Los usuarios crean sus propios anuncios" on public.anuncios;
revoke insert, update, delete on storage.objects from authenticated;
drop policy if exists "Los usuarios suben fotos a su propia carpeta" on storage.objects;
drop policy if exists "Los usuarios eliminan solo sus propias fotos" on storage.objects;

-- Privilegios mínimos para las tablas manejadas desde el navegador.
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

drop policy if exists "Los usuarios crean sus propias alertas" on public.alertas_busqueda;
create policy "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

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

-- Limpieza final de los anuncios de prueba y optimización de RLS/relaciones.
update public.anuncios
set
  titulo = regexp_replace(titulo, '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}', '[contacto oculto]', 'gi'),
  descripcion = regexp_replace(descripcion, '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}', '[contacto oculto]', 'gi'),
  ubicacion = regexp_replace(ubicacion, '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}', '[contacto oculto]', 'gi')
where
  (coalesce(titulo, '') || ' ' || coalesce(descripcion, '') || ' ' || coalesce(ubicacion, ''))
  ~* '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}';

alter table public.anuncios validate constraint anuncios_sin_email_en_texto_publico;
alter table public.anuncios validate constraint anuncios_sin_enlaces_en_texto_publico;
alter table public.anuncios validate constraint anuncios_sin_telefonos_en_texto_publico;

create index if not exists favoritos_anuncio_id_idx on public.favoritos (anuncio_id);
create index if not exists favoritos_lista_id_idx on public.favoritos (lista_id);
create index if not exists listas_favoritos_user_id_idx on public.listas_favoritos (user_id);

drop policy if exists "Los anuncios activos son visibles y cada usuario ve los suyos" on public.anuncios;
create policy "Los anuncios activos son visibles y cada usuario ve los suyos"
  on public.anuncios for select to public
  using (activo = true or (select auth.uid()) = user_id);

drop policy if exists "Los usuarios editan solo sus propios anuncios" on public.anuncios;
create policy "Los usuarios editan solo sus propios anuncios"
  on public.anuncios for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios eliminan solo sus propios anuncios" on public.anuncios;
create policy "Los usuarios eliminan solo sus propios anuncios"
  on public.anuncios for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios ven solo sus propios favoritos" on public.favoritos;
create policy "Los usuarios ven solo sus propios favoritos"
  on public.favoritos for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios eliminan solo sus propios favoritos" on public.favoritos;
create policy "Los usuarios eliminan solo sus propios favoritos"
  on public.favoritos for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios ven solo sus propias alertas" on public.alertas_busqueda;
create policy "Los usuarios ven solo sus propias alertas"
  on public.alertas_busqueda for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios eliminan sus propias alertas" on public.alertas_busqueda;
create policy "Los usuarios eliminan sus propias alertas"
  on public.alertas_busqueda for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios ven solo sus propias listas" on public.listas_favoritos;
create policy "Los usuarios ven solo sus propias listas"
  on public.listas_favoritos for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios crean sus propias listas" on public.listas_favoritos;
create policy "Los usuarios crean sus propias listas"
  on public.listas_favoritos for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios renombran sus propias listas" on public.listas_favoritos;
create policy "Los usuarios renombran sus propias listas"
  on public.listas_favoritos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios eliminan sus propias listas" on public.listas_favoritos;
create policy "Los usuarios eliminan sus propias listas"
  on public.listas_favoritos for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Forma final optimizada de la política de creación de alertas.
drop policy if exists "Los usuarios crean sus propias alertas" on public.alertas_busqueda;
create policy "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and lower(email) = lower((select auth.jwt() ->> 'email'))
  );

-- Límite atómico del buzón de sugerencias, accesible solo desde el servidor.
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
  select count(*) into v_total
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

-- Registro privado para aplicar cada pago de Stripe una sola vez.
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
    stripe_event_id, stripe_session_id, anuncio_id, user_id,
    importe_centimos, moneda
  ) values (
    p_stripe_event_id, p_stripe_session_id, p_anuncio_id, p_user_id,
    p_importe_centimos, p_moneda
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

create index if not exists pagos_destacados_user_idx
  on public.pagos_destacados (user_id);

drop policy if exists "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda;
create policy "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and lower(email) = (select lower(auth.jwt() ->> 'email'))
  );

-- Historial privado para rotar los destacados gratuitos. Cada anuncio puede
-- permanecer destacado 24 horas y volver a solicitarlo después de 7 días.
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
