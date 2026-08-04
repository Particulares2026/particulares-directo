-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade la columna de fotos y el bucket de almacenamiento para las imágenes de inmuebles.

alter table public.anuncios add column if not exists fotos text[] not null default '{}';

insert into storage.buckets (id, name, public)
  values ('inmuebles', 'inmuebles', true)
  on conflict (id) do nothing;

drop policy if exists "Las fotos de inmuebles son visibles para todos" on storage.objects;
create policy "Las fotos de inmuebles son visibles para todos"
  on storage.objects for select
  using (bucket_id = 'inmuebles');

drop policy if exists "Los usuarios suben fotos a su propia carpeta" on storage.objects;
create policy "Los usuarios suben fotos a su propia carpeta"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'inmuebles' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Los usuarios eliminan solo sus propias fotos" on storage.objects;
create policy "Los usuarios eliminan solo sus propias fotos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'inmuebles' and (storage.foldername(name))[1] = auth.uid()::text);
