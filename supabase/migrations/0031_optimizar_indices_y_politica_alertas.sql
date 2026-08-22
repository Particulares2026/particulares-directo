-- Cubre la relación con el usuario para que las bajas de cuentas y las
-- consultas administrativas de pagos no recorran la tabla completa.
create index if not exists pagos_destacados_user_idx
  on public.pagos_destacados (user_id);

-- Coloca toda la lectura del JWT dentro del SELECT para que Postgres la calcule
-- una sola vez por consulta, incluso cuando se normaliza el correo.
drop policy if exists "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda;

create policy "Los usuarios crean sus propias alertas"
  on public.alertas_busqueda for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and lower(email) = (select lower(auth.jwt() ->> 'email'))
  );

