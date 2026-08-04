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
  email_contacto text not null,
  created_at timestamptz not null default now()
);

create index if not exists anuncios_categoria_idx on public.anuncios (categoria);
create index if not exists anuncios_tipo_idx on public.anuncios (tipo);
create index if not exists anuncios_created_at_idx on public.anuncios (created_at desc);
create index if not exists anuncios_user_id_idx on public.anuncios (user_id);

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
