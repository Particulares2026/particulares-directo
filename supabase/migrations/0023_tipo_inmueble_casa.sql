-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Añade "Casa" como tipo de inmueble válido.

alter table public.anuncios drop constraint if exists anuncios_tipo_inmueble_check;

alter table public.anuncios add constraint anuncios_tipo_inmueble_check
  check (tipo_inmueble in ('piso', 'casa', 'habitacion', 'garaje', 'trastero', 'local', 'terreno', 'edificio'));
