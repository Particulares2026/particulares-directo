-- La renovación, activación y desactivación pasan por una ruta autenticada del
-- servidor. El navegador deja de poder cambiar directamente los campos de
-- caducidad y los avisos internos, aunque el anuncio pertenezca al usuario.
revoke update on public.anuncios from authenticated;
revoke update (activo, fecha_activacion, aviso_5_enviado, aviso_3_enviado)
  on public.anuncios from authenticated;

