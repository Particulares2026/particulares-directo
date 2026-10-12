const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const actual = { id: id(1), categoria: 'trabajo', tipo: 'ofrezco', activo: true };
function loader(rows, error = null) {
  const calls = [];
  const q = {};
  for (const name of ['select', 'eq', 'neq', 'order', 'limit', 'abortSignal']) q[name] = (...args) => { calls.push([name, ...args]); return q; };
  q.then = resolve => resolve({ data: rows, error });
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/anuncios-relacionados.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, AbortSignal, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon' } },
    require: name => name === './categorias' ? { esCategoriaValida: value => value === 'trabajo' } : { createClient: (url, key, options) => {
      assert.equal(key, 'anon'); assert.equal(options.auth.persistSession, false); assert.equal(options.auth.autoRefreshToken, false);
      calls.push(['client']); return { from: () => q };
    } },
  });
  return { run: exports.anunciosRelacionados, calls };
}
test('only anonymous, active, same-category and same-type related ads; no contacts', async () => {
  const row = n => ({ ...actual, id: id(n), titulo: `Ad ${n}` });
  const l = loader([actual, row(2), row(2), { ...row(3), activo: false }, { ...row(4), tipo: 'busco' }, { ...row(5), categoria: 'coches' }, row(6), row(7), row(8)]);
  const result = await l.run(actual);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), [2, 6, 7].map(n => ({ id: id(n), titulo: `Ad ${n}` })));
  assert.ok(l.calls.some(c => c[0] === 'eq' && c[1] === 'activo' && c[2] === true));
  assert.equal(l.calls.find(c => c[0] === 'select')[1], 'id,titulo,categoria,tipo,activo');
  assert.ok(l.calls.some(c => c[0] === 'abortSignal'));
});
test('inactive or invalid detail never queries recommendations', async () => {
  const l = loader([]);
  for (const a of [{ ...actual, activo: false }, { ...actual, id: '../admin' }, { ...actual, categoria: 'unknown' }]) assert.equal((await l.run(a)).length, 0);
  assert.equal(l.calls.length, 0);
});
test('recommendation failure leaves the main ad usable', async () => {
  assert.equal((await loader(null, { message: 'internal' }).run(actual)).length, 0);
});
test('detail distinguishes a database failure from a missing or invalid ad', async () => {
  let reads = 0;
  let response = { data: null, error: { message: 'private database diagnostic' } };
  const q = { select: () => q, eq: () => q, maybeSingle: async () => { reads++; return response; } };
  const mocks = { react: { cache: f => f }, '@/lib/supabase/server': { createClient: async () => ({ from: () => q }) }, '@/lib/anuncios': { CAMPOS_PUBLICOS_ANUNCIO: 'id,titulo' } };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/anuncio/[id]/page.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => mocks[name] });
  const metadata = value => exports.generateMetadata({ params: Promise.resolve({ id: value }) });
  await assert.rejects(metadata(id(1)), error => error.message === 'No se pudo cargar el anuncio. Inténtalo de nuevo.');
  response = { data: null, error: null };
  assert.equal((await metadata(id(1))).robots.index, false);
  assert.equal((await metadata('../invalid')).robots.index, false);
  assert.equal(reads, 2);
});
