-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Impide crear o editar anuncios directamente desde el navegador (saltándose la moderación
-- de contenido y el precio de los destacados): a partir de ahora solo se puede a través del
-- servidor. Los botones "Actualizar" y "Desactivar" siguen funcionando porque solo tocan un
-- puñado de columnas concretas, que se dejan permitidas.

revoke insert on public.anuncios from authenticated;
revoke update on public.anuncios from authenticated;
grant update (activo, fecha_activacion, aviso_5_enviado, aviso_3_enviado)
  on public.anuncios to authenticated;

-- Registro de envíos del buzón de sugerencias, para limitar el spam automatizado.
create table if not exists public.envios_contacto (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists envios_contacto_ip_idx on public.envios_contacto (ip, created_at);

alter table public.envios_contacto enable row level security;
-- Sin políticas: solo es accesible con la clave de servicio, desde el servidor.
