import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.SMOKE_BASE_URL?.replace(/\/+$/, "");

test("las páginas públicas principales responden correctamente", { skip: !baseUrl }, async (t) => {
  for (const route of [
    "/",
    "/categoria/inmobiliaria",
    "/categoria/trabajo",
    "/login",
    "/registro",
    "/olvide-password",
    "/aviso-legal",
    "/terminos",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    await t.test(route, async () => {
      const response = await fetch(`${baseUrl}${route}`, {
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      });
      assert.equal(response.ok, true, `${route} respondió con ${response.status}`);
    });
  }
});

test("la página pública envía cabeceras de seguridad", { skip: !baseUrl }, async () => {
  const response = await fetch(baseUrl, { signal: AbortSignal.timeout(15_000) });

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.match(response.headers.get("strict-transport-security") || "", /max-age=/);
  assert.match(response.headers.get("content-security-policy") || "", /default-src 'self'/);
});
