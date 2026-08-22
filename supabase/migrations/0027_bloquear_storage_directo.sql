-- Supabase Storage conserva privilegios internos de tabla para que su API funcione.
-- El control efectivo se realiza con RLS: al retirar estas políticas, anon y
-- authenticated ya no pueden subir ni borrar archivos directamente. La ruta del
-- servidor usa service_role y mantiene el flujo legítimo de la aplicación.
drop policy if exists "Los usuarios suben fotos a su propia carpeta" on storage.objects;
drop policy if exists "Los usuarios eliminan solo sus propias fotos" on storage.objects;
