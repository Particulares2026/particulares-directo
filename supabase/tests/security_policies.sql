begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(22);

select extensions.ok(
  to_regclass('public.anuncios') is not null,
  'Existe la tabla de anuncios'
);

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.anuncios'::regclass),
  'Los anuncios tienen RLS activado'
);

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.favoritos'::regclass),
  'Los favoritos tienen RLS activado'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.revelaciones_contacto', 'SELECT'),
  'Los visitantes no pueden leer las revelaciones de contacto'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.revelaciones_contacto', 'SELECT'),
  'Los usuarios no pueden leer las revelaciones de contacto'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.envios_contacto', 'SELECT'),
  'Los visitantes no pueden leer el control contra spam'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.pagos_destacados', 'SELECT'),
  'Los usuarios no pueden leer el registro privado de pagos'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.registrar_envio_contacto(text,timestamp with time zone,integer)',
    'EXECUTE'
  ),
  'Los visitantes no pueden ejecutar el control interno de envíos'
);

select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.aplicar_destacado_gratuito(uuid,uuid,integer,integer)',
    'EXECUTE'
  ),
  'El navegador no puede aplicar destacados directamente'
);

select extensions.ok(
  has_column_privilege('anon', 'public.anuncios', 'titulo', 'SELECT'),
  'Los visitantes pueden leer el título público'
);

select extensions.ok(
  not has_column_privilege('anon', 'public.anuncios', 'email_contacto', 'SELECT'),
  'El correo de contacto no se expone directamente'
);

select extensions.ok(
  not exists (
    select 1
    from storage.buckets
    cross join unnest(coalesce(allowed_mime_types, array[]::text[])) as mime
    where id = 'inmuebles' and lower(mime) = 'image/svg+xml'
  ),
  'El almacenamiento no permite imágenes SVG ejecutables'
);

select extensions.ok(
  to_regclass('private.consentimientos_legales') is not null,
  'Existe el registro privado de consentimientos legales'
);

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'private.consentimientos_legales'::regclass),
  'El registro de consentimientos tiene RLS activado'
);

select extensions.ok(
  not has_table_privilege('anon', 'private.consentimientos_legales', 'SELECT'),
  'Los visitantes no pueden leer los consentimientos legales'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'private.consentimientos_legales', 'SELECT'),
  'Los usuarios no pueden leer ni enumerar consentimientos legales'
);

select extensions.ok(
  to_regclass('public.denuncias_anuncios') is not null,
  'Existe el registro confidencial de denuncias'
);

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.denuncias_anuncios'::regclass),
  'Las denuncias tienen RLS activado'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.denuncias_anuncios', 'SELECT'),
  'Los visitantes no pueden leer denuncias'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.denuncias_anuncios', 'SELECT'),
  'Los usuarios no pueden leer denuncias'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.denuncias_anuncios', 'INSERT'),
  'Los visitantes no pueden insertar denuncias saltándose el servidor'
);

select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.registrar_denuncia_anuncio(uuid,text,text,text,text,timestamp with time zone,integer)',
    'EXECUTE'
  ),
  'El navegador no puede ejecutar el registro interno de denuncias'
);

select * from extensions.finish();

rollback;
