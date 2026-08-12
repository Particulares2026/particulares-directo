-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
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
