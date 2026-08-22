-- Evita que la clave pública de Supabase pueda descargar teléfonos y emails
-- directamente, saltándose el botón "Mostrar contacto" y sus límites.

drop policy if exists "Los anuncios son visibles para todos" on public.anuncios;
drop policy if exists "Los anuncios activos son visibles y cada usuario ve los suyos" on public.anuncios;

create policy "Los anuncios activos son visibles y cada usuario ve los suyos"
  on public.anuncios for select
  using (activo = true or auth.uid() = user_id);

-- SELECT a nivel de tabla permitiría pedir telefono_contacto y email_contacto.
-- Se sustituye por permisos columna a columna, excluyendo ambos datos.
revoke select on public.anuncios from anon, authenticated;

grant select (
  id,
  user_id,
  categoria,
  tipo,
  titulo,
  descripcion,
  ubicacion,
  palabras_clave,
  nombre_contacto,
  mostrar_telefono,
  mostrar_email,
  created_at,
  operacion,
  provincia,
  municipio,
  tipo_inmueble,
  precio,
  precio_anterior,
  habitaciones,
  banos,
  amueblado,
  tamano,
  caracteristicas,
  duracion_alquiler,
  fotos,
  estado,
  lat,
  lng,
  sector_trabajo,
  modalidad_trabajo,
  salario_min,
  salario_max,
  salario_periodo,
  experiencia_trabajo,
  idiomas_trabajo,
  incorporacion,
  activo,
  fecha_activacion,
  destacado_hasta
) on public.anuncios to anon, authenticated;

