import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");

function sourceFiles(relativeDirectory) {
  const directory = path.join(repoRoot, relativeDirectory);
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return sourceFiles(relativePath);
    return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [relativePath] : [];
  });
}

test("el entorno principal usa versiones mantenidas y reproducibles", () => {
  const packageJson = JSON.parse(read("package.json"));

  assert.equal(packageJson.engines.node, "22.x");
  assert.equal(packageJson.dependencies.next, "16.3.2");
  assert.equal(packageJson.dependencies.react, "19.2.7");
  assert.equal(packageJson.dependencies["react-dom"], "19.2.7");
  assert.equal(packageJson.dependencies["react-leaflet"], "5.0.0");
  assert.match(packageJson.scripts.build, /npm test/);
  assert.doesNotMatch(packageJson.scripts.lint, /next lint/);
});

test("Next.js mantiene las cabeceras defensivas esenciales", () => {
  const config = read("next.config.js");
  for (const header of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) {
    assert.match(config, new RegExp(header));
  }
  assert.match(config, /poweredByHeader:\s*false/);
});

test("ningún componente de navegador contiene secretos de servidor", () => {
  const secretNames = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "CRON_SECRET",
  ];

  for (const relativePath of [...sourceFiles("app"), ...sourceFiles("components")]) {
    const source = read(relativePath);
    if (!/^\s*["']use client["'];/.test(source)) continue;
    for (const secretName of secretNames) {
      assert.equal(source.includes(secretName), false, `${relativePath} expone ${secretName}`);
    }
  }
});

test("la sesión de servidor usa las API asíncronas y el proxy de Next.js 16", () => {
  const source = read("lib/supabase/server.ts");
  const proxy = read("proxy.ts");

  assert.match(source, /export async function createClient/);
  assert.match(source, /await cookies\(\)/);
  assert.match(proxy, /export async function proxy/);
  assert.match(proxy, /await supabase\.auth\.getUser\(\)/);

  for (const relativePath of [...sourceFiles("app"), ...sourceFiles("components")]) {
    const routeSource = read(relativePath);
    if (!routeSource.includes("@/lib/supabase/server")) continue;
    assert.equal(
      /(?<!await )createClient\(\)/.test(routeSource),
      false,
      `${relativePath} no espera al cliente de servidor`
    );
  }
});

test("el destacado gratuito conserva la rotación y el cobro desactivado", () => {
  const source = read("lib/destacar.ts");
  assert.match(source, /HORAS_DESTACADO_GRATIS\s*=\s*24/);
  assert.match(source, /DIAS_ESPERA_DESTACADO_GRATIS\s*=\s*7/);
  assert.match(source, /PRECIO_DEFECTO_CENTIMOS\s*=\s*0/);
  assert.match(source, /PRECIOS_CENTIMOS[^=]*=\s*\{\}/s);
});

test("los destacados heredados se limitan sin alterar pagos ni rotaciones válidas", () => {
  const migration = read("supabase/migrations/0037_normalizar_destacados_heredados.sql");

  assert.match(migration, /destacado_hasta\s*>\s*statement_timestamp\(\)\s*\+\s*interval '24 hours'/);
  assert.match(migration, /not exists[\s\S]*public\.pagos_destacados/);
  assert.match(migration, /not exists[\s\S]*public\.destacados_gratuitos/);
  assert.match(migration, /insert into public\.destacados_gratuitos/);
  assert.match(migration, /set destacado_hasta\s*=\s*statement_timestamp\(\)\s*\+\s*interval '24 hours'/);
});

test("las rutas privadas verifican al usuario antes de mostrar datos", () => {
  for (const relativePath of [
    "app/editar/[id]/page.tsx",
    "app/mi-perfil/page.tsx",
    "app/mis-anuncios/page.tsx",
    "app/moderacion/page.tsx",
    "app/publicar/page.tsx",
  ]) {
    const source = read(relativePath);
    assert.match(source, /auth\.getUser\(\)/, `${relativePath} no verifica la sesión`);
    assert.match(source, /redirect\(/, `${relativePath} no bloquea el acceso anónimo`);
  }
});

test("la revelación de contacto sigue limitada y no se almacena en caché", () => {
  const source = read("app/api/anuncios/[id]/contacto/route.ts");
  assert.match(source, /Cache-Control[^\n]*private, no-store/);
  assert.match(source, /LIMITE_REVELACIONES\s*=\s*20/);
  assert.match(source, /LIMITE_POR_ANUNCIO\s*=\s*10/);
  assert.match(source, /UUID\.test\(id\)/);
  assert.match(source, /export async function POST/);
  assert.match(source, /createHmac\("sha256"/);
  assert.doesNotMatch(source, /export async function GET/);
});

test("las acciones sensibles rechazan peticiones iniciadas desde otras webs", () => {
  for (const relativePath of [
    "app/api/anuncios/[id]/contacto/route.ts",
    "app/api/anuncios/[id]/estado/route.ts",
    "app/api/anuncios/route.ts",
    "app/api/anuncios/fotos/route.ts",
    "app/api/admin/aceptar-anuncio/route.ts",
    "app/api/admin/eliminar-anuncio/route.ts",
    "app/api/auth/restablecer-password/route.ts",
    "app/api/eliminar-cuenta/route.ts",
    "app/api/contacto/route.ts",
    "app/api/destacar/route.ts",
    "app/api/perfil/route.ts",
  ]) {
    const source = read(relativePath);
    assert.match(source, /esOrigenPermitido\(request\)/, `${relativePath} no valida el origen`);
    assert.match(source, /Origen no permitido/, `${relativePath} no rechaza otros orígenes`);
  }
});

test("la contraseña solo se cambia desde un enlace de recuperación válido", () => {
  const callback = read("app/auth/callback/route.ts");
  const page = read("app/restablecer-password/page.tsx");
  const form = read("components/RestablecerPasswordForm.tsx");
  const route = read("app/api/auth/restablecer-password/route.ts");
  const marker = read("lib/recuperacion-password.ts");

  assert.match(callback, /crearMarcaRecuperacion\(data\.user\.id\)/);
  assert.match(callback, /httpOnly:\s*true/);
  assert.match(callback, /sameSite:\s*"lax"/);
  assert.match(page, /validarMarcaRecuperacion\(marca, user\.id\)/);
  assert.match(form, /\/api\/auth\/restablecer-password/);
  assert.doesNotMatch(form, /auth\.updateUser/);
  assert.match(route, /validarMarcaRecuperacion\(marca, user\.id\)/);
  assert.match(route, /auth\.updateUser\(\{ password \}\)/);
  assert.match(route, /signOut\(\{ scope: "others" \}\)/);
  assert.match(route, /maxAge:\s*0/);
  assert.match(marker, /createHmac\("sha256"/);
  assert.match(marker, /timingSafeEqual/);
});

test("eliminar una cuenta borra también las fotos sueltas antes que el usuario", () => {
  const source = read("app/api/eliminar-cuenta/route.ts");

  assert.match(source, /\.list\(user\.id/);
  assert.match(source, /limit:\s*TAMANO_PAGINA/);
  assert.match(source, /offset/);
  assert.match(source, /bucket\.remove/);
  assert.match(source, /errorBorrado/);
  assert.ok(source.indexOf("bucket.remove") < source.indexOf("deleteUser"));
});

test("la renovación y los cambios de estado se autorizan solo en el servidor", () => {
  const card = read("components/AnuncioCard.tsx");
  const route = read("app/api/anuncios/[id]/estado/route.ts");
  const migration = read("supabase/migrations/0038_blindar_renovacion_anuncios.sql");

  assert.doesNotMatch(card, /from\("anuncios"\)[\s\S]{0,160}\.update\(/);
  assert.match(card, /\/api\/anuncios\/\$\{anuncio\.id\}\/estado/);
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /\.eq\("user_id", user\.id\)/);
  assert.match(route, /DIAS_ANTES_RENOVACION\s*=\s*5/);
  assert.match(route, /accion === "renovar" && !yaRenovable/);
  assert.match(migration, /revoke update \(activo, fecha_activacion, aviso_5_enviado, aviso_3_enviado\)/);
});

test("las altas simultáneas y el borrado directo de anuncios quedan bloqueados", () => {
  const route = read("app/api/anuncios/route.ts");
  const cron = read("app/api/cron/mantenimiento-anuncios/route.ts");
  const migration = read("supabase/migrations/0039_limitar_publicacion_y_borrado.sql");
  const schema = read("supabase/schema.sql");

  assert.equal((route.match(/esOrigenPermitido\(request\)/g) || []).length, 2);
  assert.match(route, /rpc\([\s\S]*"reservar_publicacion_anuncio"/);
  assert.match(route, /p_limite:\s*LIMITE_ANUNCIOS_POR_HORA/);
  assert.match(route, /\.update\(updatePayload\)[\s\S]*\.eq\("user_id", user\.id\)/);
  assert.match(migration, /revoke delete on public\.anuncios from authenticated/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /publicaciones_anuncios_user_fecha_idx/);
  assert.match(migration, /grant execute[\s\S]*to service_role/);
  assert.match(schema, /reservar_publicacion_anuncio[\s\S]*as \$\$/);
  assert.match(cron, /"publicaciones_anuncios"/);
});

test("los anuncios se validan y normalizan también en el servidor y la base de datos", () => {
  const route = read("app/api/anuncios/route.ts");
  const form = read("components/AnuncioForm.tsx");
  const migration = read("supabase/migrations/20260825082248_validar_datos_anuncios.sql");
  const schema = read("supabase/schema.sql");

  assert.match(route, /Number\.isFinite\(valor\)/);
  assert.match(route, /numeroEnRango\(payload\.precio, 0, PRECIO_MAXIMO\)/);
  assert.match(route, /numeroEnRango\(payload\.lat, -90, 90\)/);
  assert.match(route, /PROVINCIAS_VALIDAS\.has\(payload\.provincia\)/);
  assert.match(route, /listaIncluida\(payload\.caracteristicas, CARACTERISTICAS_INMUEBLE_VALIDAS\)/);
  assert.match(route, /listaIncluida\(payload\.idiomas_trabajo, IDIOMAS_TRABAJO_VALIDOS\)/);
  assert.match(route, /normalizarCamposPermitidos\(payload\)/);
  assert.match(route, /limpio\.sector_trabajo === "oficios"/);
  assert.match(route, /valor !== "incorporacion_inmediata"/);
  assert.match(route, /contieneContenidoProhibido\([\s\S]*camposLimpios\.titulo/);
  assert.match(route, /huellaDuplicado\(camposLimpios\)/);

  for (const limite of ['max="1000000000"', 'max="100"', 'max="10000000"']) {
    assert.match(form, new RegExp(limite));
  }

  for (const constraint of [
    "anuncios_numeros_en_rango",
    "anuncios_salario_coherente",
    "anuncios_coordenadas_completas",
    "anuncios_campos_inmobiliaria_coherentes",
    "anuncios_campos_trabajo_coherentes",
    "anuncios_ubicacion_categoria_coherente",
    "anuncios_caracteristicas_categoria_coherentes",
    "anuncios_listas_limitadas",
  ]) {
    assert.match(migration, new RegExp(`add constraint ${constraint}`));
    assert.match(migration, new RegExp(`validate constraint ${constraint}`));
    assert.match(schema, new RegExp(`add constraint ${constraint}`));
  }
});

test("los registros técnicos antiabuso tienen una retención máxima", () => {
  const source = read("app/api/cron/mantenimiento-anuncios/route.ts");
  assert.match(source, /HORAS_RETENCION_REGISTROS_TECNICOS\s*=\s*24/);
  for (const table of ["envios_contacto", "revelaciones_contacto", "subidas_fotos"]) {
    assert.match(source, new RegExp(`"${table}"`));
  }
  assert.match(source, /\.delete\(\{ count: "exact" \}\)/);
  assert.match(source, /\.lt\("created_at", limiteRegistrosTecnicos\)/);
});

test("la base temporal de CI nunca se conecta a producción", () => {
  const workflow = read(".github/workflows/database-ci.yml");
  const config = read("supabase/config.toml");

  assert.match(workflow, /supabase db start/);
  assert.match(workflow, /supabase db lint --local/);
  assert.match(workflow, /supabase test db --local/);
  assert.equal(workflow.includes("SUPABASE_ACCESS_TOKEN"), false);
  assert.equal(workflow.includes("mxixwpcqxwhbyzqikalr"), false);
  assert.match(config, /project_id\s*=\s*"particulares_directo_ci"/);
  assert.match(config, /major_version\s*=\s*17/);
});


