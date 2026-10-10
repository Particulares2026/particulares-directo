import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(pages){const calls=[];const q={};for(const name of ['select','eq','order','range'])q[name]=(...args)=>{calls.push([name,...args]);return q;};q.then=resolve=>resolve(pages.shift());const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/sitemap.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'anon'}},require:n=>n==='@supabase/supabase-js'?{createClient:(url,key)=>{assert.equal(key,'anon');return{from:t=>{assert.equal(t,'anuncios');return q;}};}}:{CATEGORIAS_DESTACADAS:[{slug:'trabajo'}]}});return{fn:exports.default,calls};}
test('sitemap usa acceso anónimo, pagina y conserva páginas públicas sin fechas artificiales',async()=>{const id='00000000-0000-0000-0000-000000000001';const s=load([{data:Array.from({length:500},()=>({id})),error:null},{data:[{id:'invalid'},{id}],error:null}]);const items=await s.fn();assert.equal(items.filter(i=>i.url.includes('/anuncio/')).length,501);assert.ok(items.some(i=>i.url.endsWith('/registro')));assert.ok(items.every(i=>!i.lastModified));assert.equal(s.calls.filter(c=>c[0]==='range').length,2);assert.ok(s.calls.some(c=>c[0]==='eq'&&c[1]==='activo'&&c[2]===true));});
test('sitemap no oculta fallos de consulta como éxito vacío',async()=>{await assert.rejects(load([{data:null,error:{message:'failed'}}]).fn(),/No se pudo generar/);});

test('sitemap omite categorías vacías y conserva las que tienen anuncios',async()=>{const id='00000000-0000-0000-0000-000000000001';const empty=await load([{data:[],error:null}]).fn();assert.ok(!empty.some(x=>x.url.includes('/categoria/')));const full=await load([{data:[{id,categoria:'trabajo'}],error:null}]).fn();assert.ok(full.some(x=>x.url.endsWith('/categoria/trabajo')));});
