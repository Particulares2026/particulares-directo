-- Retira datos de contacto incrustados en los anuncios de prueba y deja las
-- restricciones completamente validadas para todo el contenido existente.
update public.anuncios
set
  titulo = regexp_replace(
    titulo,
    '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}',
    '[contacto oculto]',
    'gi'
  ),
  descripcion = regexp_replace(
    descripcion,
    '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}',
    '[contacto oculto]',
    'gi'
  ),
  ubicacion = regexp_replace(
    ubicacion,
    '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}',
    '[contacto oculto]',
    'gi'
  )
where
  (coalesce(titulo, '') || ' ' || coalesce(descripcion, '') || ' ' || coalesce(ubicacion, ''))
  ~* '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}';

alter table public.anuncios
  validate constraint anuncios_sin_email_en_texto_publico;
alter table public.anuncios
  validate constraint anuncios_sin_enlaces_en_texto_publico;
alter table public.anuncios
  validate constraint anuncios_sin_telefonos_en_texto_publico;

-- Postgres no crea índices automáticamente para el lado que referencia una
-- clave foránea. Estos tres evitan escaneos completos al crecer favoritos.
create index if not exists favoritos_anuncio_id_idx
  on public.favoritos (anuncio_id);
create index if not exists favoritos_lista_id_idx
  on public.favoritos (lista_id);
create index if not exists listas_favoritos_user_id_idx
  on public.listas_favoritos (user_id);

-- Envolver auth.uid() en SELECT hace que Postgres lo calcule una sola vez por
-- consulta, no una vez por cada fila evaluada por RLS.
drop policy if exists "Los anuncios activos son visibles y cada usuario ve los suyos"
  on public.anuncios;
create policy "Los anuncios activos son visibles y cada usuario ve los suyos"
  on public.anuncios for select
  to public
  using (activo = true or (select auth.uid()) = user_id);

drop policy if exists "Los usuarios editan solo sus propios anuncios"
  on public.anuncios;
create policy "Los usuarios editan solo sus propios anuncios"
  on public.anuncios for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios eliminan solo sus propios anuncios"
  on public.anuncios;
create policy "Los usuarios eliminan solo sus propios anuncios"
  on public.anuncios for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios ven solo sus propios favoritos"
  on public.favoritos;
create policy "Los usuarios ven solo sus propios favoritos"
  on public.favoritos for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios eliminan solo sus propios favoritos"
  on public.favoritos;
create policy "Los usuarios eliminan solo sus propios favoritos"
  on public.favoritos for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios ven solo sus propias alertas"
  on public.alertas_busqueda;
create policy "Los usuarios ven solo sus propias alertas"
  on public.alertas_busqueda for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios eliminan sus propias alertas"
  on public.alertas_busqueda;
create policy "Los usuarios eliminan sus propias alertas"
  on public.alertas_busqueda for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios ven solo sus propias listas"
  on public.listas_favoritos;
create policy "Los usuarios ven solo sus propias listas"
  on public.listas_favoritos for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios crean sus propias listas"
  on public.listas_favoritos;
create policy "Los usuarios crean sus propias listas"
  on public.listas_favoritos for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios renombran sus propias listas"
  on public.listas_favoritos;
create policy "Los usuarios renombran sus propias listas"
  on public.listas_favoritos for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Los usuarios eliminan sus propias listas"
  on public.listas_favoritos;
create policy "Los usuarios eliminan sus propias listas"
  on public.listas_favoritos for delete
  to authenticated
  using ((select auth.uid()) = user_id);

