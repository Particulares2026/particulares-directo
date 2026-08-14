-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Histórico de precios de anuncios de inmobiliaria: permite mostrar "antes X, ahora Y"
-- cuando baja/sube el precio (como idealista) y consultar la evolución completa.

alter table public.anuncios add column if not exists precio_anterior numeric;

-- Enlaces opcionales a otras plataformas donde el propietario ha publicado el
-- mismo inmueble (idealista, fotocasa...), añadidos manualmente por él.
alter table public.anuncios add column if not exists enlaces_externos text[] not null default '{}';

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
