-- Esta función pertenece al mantenimiento interno de la base de datos y se
-- ejecuta como parte de un event trigger. No debe exponerse como RPC pública.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
