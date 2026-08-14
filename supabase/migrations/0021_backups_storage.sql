-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Bucket privado para las copias de seguridad automáticas diarias de la base de datos.
-- No es público y no tiene políticas: solo es accesible con la clave de servicio, desde el servidor.

insert into storage.buckets (id, name, public)
  values ('backups', 'backups', false)
  on conflict (id) do nothing;
