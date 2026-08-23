-- Evalúa auth.jwt() una sola vez por consulta para que la política mantenga
-- el mismo control de correo sin repetir el trabajo por cada fila.
drop policy if exists "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda;

create policy "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and lower(email) = lower(((select auth.jwt()) ->> 'email'))
  );
