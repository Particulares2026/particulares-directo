# Particulares Directo

Anuncios de empleo entre particulares: cada persona se registra con su correo
y contraseña, y solo ella puede editar o eliminar sus propios anuncios.

## Cómo está construida

- **Next.js** — la propia web (páginas, formularios, buscador).
- **Supabase** — base de datos (Postgres) y autenticación. Es quien de verdad
  cifra las contraseñas, gestiona las sesiones y, mediante **Row Level
  Security**, obliga a nivel de base de datos a que cada persona solo pueda
  modificar sus propios anuncios — aunque alguien manipulara el código de la
  web, la base de datos rechazaría el cambio igualmente.

No hay servidor propio que mantener: Supabase y el hosting (por ejemplo
Vercel) se encargan de eso.

## Puesta en marcha

### 1. Crear el proyecto de Supabase

1. Ve a [supabase.com](https://supabase.com), crea una cuenta gratuita y un
   nuevo proyecto.
2. Dentro del proyecto, abre **SQL Editor** → **New query**, pega el
   contenido de `supabase/schema.sql` y ejecútalo. Esto crea la tabla de
   anuncios y las reglas de seguridad.
3. Ve a **Authentication → Providers** y confirma que **Email** está
   activado (lo está por defecto).
   - Para pruebas rápidas puedes desactivar "Confirm email" en
     **Authentication → Settings**, así las cuentas quedan activas al
     instante. Para producción real, déjalo activado: así solo se puede
     registrar alguien con un correo que realmente controla.
4. Ve a **Settings → API** y copia el **Project URL** y la clave
   **anon public**.

### 2. Configurar el proyecto en tu ordenador

```bash
cd particulares-directo
cp .env.local.example .env.local
```

Abre `.env.local` y pega ahí la URL y la clave del paso anterior.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 3. Publicarla en internet (gratis)

1. Sube esta carpeta a un repositorio de GitHub.
2. Ve a [vercel.com](https://vercel.com), crea una cuenta e importa el
   repositorio.
3. En la configuración del proyecto, añade las mismas dos variables de
   entorno del paso 1 (`NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Despliega. Vercel te dará una URL pública (algo como
   `particulares-directo.vercel.app`) — desde ese momento cualquiera en
   internet puede entrar, registrarse y publicar su anuncio.

## Estructura del proyecto

```
app/
  page.tsx                → listado público de anuncios + buscador
  login/page.tsx          → entrar con correo y contraseña
  registro/page.tsx       → crear cuenta con correo y contraseña
  publicar/page.tsx       → publicar un anuncio (requiere sesión)
  mis-anuncios/page.tsx   → anuncios propios, con opción de eliminarlos
  auth/callback/route.ts  → confirma el correo tras el registro
components/
  Header.tsx, AnuncioCard.tsx, Buscador.tsx, AnuncioForm.tsx, LogoutButton.tsx
lib/supabase/
  client.ts               → cliente de Supabase para el navegador
  server.ts                → cliente de Supabase para el servidor
supabase/schema.sql        → tabla de anuncios + reglas de seguridad
```

## Próximos pasos posibles

- Añadir un correo de bienvenida o de aviso cuando alguien recibe interés
  en su anuncio (Supabase permite disparar funciones en cada inserción).
- Paginar el listado cuando haya muchos anuncios.
- Añadir un campo de categoría más allá de "busco/ofrezco empleo" si en el
  futuro quieres ampliarlo a otro tipo de anuncios entre particulares.
