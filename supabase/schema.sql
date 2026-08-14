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
    'piso', 'habitacion', 'garaje', 'trastero', 'local', 'terreno', 'edificio'
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
  -- Enlaces opcionales a otras plataformas donde también está publicado el inmueble.
  enlaces_externos text[] not null default '{}',
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

-- Activa la seguridad a nivel de fila: sin esto, con la clave "anon" cualquiera
-- podría leer o modificar toda la tabla directamente.
alter table public.anuncios enable row level security;

-- Los anuncios son públicos: cualquier visitante (con o sin cuenta) puede verlos.
create policy "Los anuncios son visibles para todos"
  on public.anuncios for select
  using (true);

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

-- Crear y editar el contenido de un anuncio solo se puede desde el servidor (que aplica
-- moderación de contenido), nunca directamente desde el navegador. Se deja permitido
-- actualizar estas columnas concretas para que sigan funcionando los botones
-- "Actualizar" y "Desactivar", que no tocan el contenido del anuncio.
revoke insert on public.anuncios from authenticated;
revoke update on public.anuncios from authenticated;
grant update (activo, fecha_activacion, aviso_5_enviado, aviso_3_enviado)
  on public.anuncios to authenticated;

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
