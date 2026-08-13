-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Registro de peticiones para "Mostrar contacto", con límite por IP para dificultar
-- el rastreo automático masivo de teléfonos y emails de los anuncios.

create table if not exists public.revelaciones_contacto (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  anuncio_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists revelaciones_contacto_ip_idx on public.revelaciones_contacto (ip, created_at);

alter table public.revelaciones_contacto enable row level security;
-- Sin políticas: solo es accesible con la clave de servicio, desde el servidor.
