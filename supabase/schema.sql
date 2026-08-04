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
  created_at timestamptz not null default now(),
  -- Campos específicos de la categoría inmobiliaria (null para el resto de categorías).
  operacion text check (operacion in ('venta', 'alquiler')),
  provincia text,
  tipo_inmueble text check (tipo_inmueble in (
    'piso', 'habitacion', 'garaje', 'trastero', 'local', 'terreno', 'edificio'
  )),
  precio numeric,
  habitaciones int,
  banos int,
  amueblado boolean,
  tamano numeric,
  caracteristicas text[] not null default '{}',
  duracion_alquiler text check (duracion_alquiler in ('temporada', 'larga_estancia'))
);

create index if not exists anuncios_categoria_idx on public.anuncios (categoria);
create index if not exists anuncios_tipo_idx on public.anuncios (tipo);
create index if not exists anuncios_created_at_idx on public.anuncios (created_at desc);
create index if not exists anuncios_user_id_idx on public.anuncios (user_id);
create index if not exists anuncios_provincia_idx on public.anuncios (provincia);

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

create table if not exists public.favoritos (
  user_id uuid not null references auth.users(id) on delete cascade,
  anuncio_id uuid not null references public.anuncios(id) on delete cascade,
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

create policy "Los usuarios eliminan solo sus propios favoritos"
  on public.favoritos for delete
  to authenticated
  using (auth.uid() = user_id);
