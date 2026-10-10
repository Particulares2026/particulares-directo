const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const mod={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/precios-m2.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports:mod});
const a=(precio=100000,tamano=100,operacion='venta')=>({provincia:'Sevilla',precio,tamano,operacion});
test('media por anuncio y operación con mínimo de tres muestras',()=>{
  const [fila]=mod.resumirPrecios([a(),a(400000,200),a(300000,100),a(900,90,'alquiler')]);
  assert.equal(fila.venta.media,2000);assert.equal(fila.venta.cantidad,3);
  assert.equal(fila.alquiler.media,null);assert.equal(fila.alquiler.cantidad,1);
  assert.equal(mod.resumirPrecios([a(),a()])[0].venta.media,null);
});
test('excluye datos inválidos y separa provincias',()=>{
  const rows=mod.resumirPrecios([a(0),a(-1),a(NaN),a(Infinity),a(100,0),a(100,null),a(100,1,'otro'),{...a(),provincia:''},a(),{...a(),provincia:'Álava'}]);
  assert.equal(rows.length,2);assert.equal(rows[0].provincia,'Álava');assert.equal(rows[1].venta.cantidad,1);
});
test('carga anónima paginada y fallos sin estadísticas parciales',async()=>{
  const pageSource=ts.transpileModule(fs.readFileSync('app/precios-m2/page.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  async function run(fail){let page=0;let received;const calls=[];const q={};for(const name of ['select','eq','order','range'])q[name]=(...args)=>{calls.push([name,...args]);return q};q.then=resolve=>resolve(page++===0?{data:Array(500).fill(a()),error:null}:fail?{data:null,error:{message:'private'}}:{data:[a()],error:null});
    const out={};const jsx=(type,props)=>({type,props});vm.runInNewContext(pageSource,{exports:out,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'test',NEXT_PUBLIC_SUPABASE_ANON_KEY:'anon'}},require:name=>name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='@supabase/supabase-js'?{createClient:(url,key,options)=>{assert.equal(key,'anon');assert.equal(options.auth.persistSession,false);return {from:()=>q}}}:name==='@/lib/precios-m2'?{MINIMO_ANUNCIOS:3,resumirPrecios:rows=>{received=rows.length;return []}}:{}});
    const rendered=JSON.stringify(await out.default());return {received,rendered,calls};}
  const ok=await run(false);assert.equal(ok.received,501);assert.ok(ok.calls.some(c=>c[0]==='range'&&c[1]===500));
  const fail=await run(true);assert.equal(fail.received,undefined);assert.match(fail.rendered,/no podemos cargar/);assert.doesNotMatch(fail.rendered,/private/);
});
