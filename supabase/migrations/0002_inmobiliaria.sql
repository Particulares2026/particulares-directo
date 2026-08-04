-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade los campos específicos de inmobiliaria y la tabla de favoritos.

alter table public.anuncios add column if not exists operacion text;
alter table public.anuncios drop constraint if exists anuncios_operacion_check;
alter table public.anuncios add constraint anuncios_operacion_check check (operacion in ('venta', 'alquiler'));

alter table public.anuncios add column if not exists provincia text;

alter table public.anuncios add column if not exists tipo_inmueble text;
alter table public.anuncios drop constraint if exists anuncios_tipo_inmueble_check;
alter table public.anuncios add constraint anuncios_tipo_inmueble_check check (tipo_inmueble in (
  'piso', 'habitacion', 'garaje', 'trastero', 'local', 'terreno', 'edificio'
));

alter table public.anuncios add column if not exists precio numeric;
alter table public.anuncios add column if not exists habitaciones int;
alter table public.anuncios add column if not exists banos int;
alter table public.anuncios add column if not exists amueblado boolean;

create index if not exists anuncios_provincia_idx on public.anuncios (provincia);

create table if not exists public.favoritos (
  user_id uuid not null references auth.users(id) on delete cascade,
  anuncio_id uuid not null references public.anuncios(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, anuncio_id)
);

alter table public.favoritos enable row level security;

drop policy if exists "Los usuarios ven solo sus propios favoritos" on public.favoritos;
create policy "Los usuarios ven solo sus propios favoritos"
  on public.favoritos for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Los usuarios añaden solo sus propios favoritos" on public.favoritos;
create policy "Los usuarios añaden solo sus propios favoritos"
  on public.favoritos for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Los usuarios eliminan solo sus propios favoritos" on public.favoritos;
create policy "Los usuarios eliminan solo sus propios favoritos"
  on public.favoritos for delete
  to authenticated
  using (auth.uid() = user_id);
