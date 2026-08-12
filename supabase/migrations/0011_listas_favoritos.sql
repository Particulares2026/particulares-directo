-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Permite agrupar los favoritos en listas propias (ej. "Para visitar", "Zona norte"...).

create table if not exists public.listas_favoritos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

alter table public.favoritos add column if not exists lista_id uuid references public.listas_favoritos(id) on delete set null;

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

-- Faltaba: mover un favorito de lista requiere poder actualizarlo.
create policy "Los usuarios actualizan sus propios favoritos"
  on public.favoritos for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
