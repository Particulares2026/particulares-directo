-- Mantiene la comparación con el correo verificado del JWT, en una forma que
-- Postgres puede calcular una sola vez por consulta dentro de la política RLS.
drop policy if exists "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda;

create policy "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and lower(email) = lower((select auth.jwt() ->> 'email'))
  );

