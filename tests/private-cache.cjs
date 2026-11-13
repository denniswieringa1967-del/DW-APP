const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const handlers={};vm.runInNewContext(fs.readFileSync(__dirname+'/../service-worker.js','utf8'),{URL,Set,self:{registration:{scope:'https://example.invalid/DW-APP/'},location:{origin:'https://example.invalid'},addEventListener:(n,fn)=>handlers[n]=fn}});
function intercepted(path,authorization=false){let called=false;handlers.fetch({request:{url:new URL(path,'https://example.invalid/DW-APP/').href,method:'GET',headers:{has:()=>authorization}},respondWith:()=>{called=true}});return called}
for(const path of ['runtime-config.js','/api/flow/leads','/api/document','https://example.supabase.co/rest/v1/leads','https://example.supabase.co/storage/v1/object/private/bill.pdf'])test('Private/config response bypasses cache: '+path,()=>assert.equal(intercepted(path),false));
test('Authenticated static request bypasses cache',()=>assert.equal(intercepted('app.js',true),false));
