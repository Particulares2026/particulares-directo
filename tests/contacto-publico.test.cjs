const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const exportsModule = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/moderacion.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsModule });
// Execute the actual selection of public fields used by the publication route.
const route = fs.readFileSync('app/api/anuncios/route.ts', 'utf8');
const selection = route.match(/const contactoPublico = contieneContactoPublico\([\s\S]*?\);/)[0];
function validate(payload) {
  return vm.runInNewContext(ts.transpileModule(`${selection}\ncontactoPublico`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { payload, contieneContactoPublico: exportsModule.contieneContactoPublico });
}

test('el nombre público rechaza teléfonos, correos y enlaces', () => {
  for (const nombre of ['Persona +34 600 000 000', 'persona@example.com', 'www.example.com']) {
    assert.equal(validate({ titulo: 'Anuncio de prueba', nombre_contacto: nombre }).encontrado, true);
  }
});

test('un nombre normal permite los contactos en sus campos protegidos', () => {
  assert.equal(validate({ titulo: 'Anuncio de prueba', nombre_contacto: 'María García',
    telefono_contacto: '+34 600000000', email_contacto: 'persona@example.com' }).encontrado, false);
});
