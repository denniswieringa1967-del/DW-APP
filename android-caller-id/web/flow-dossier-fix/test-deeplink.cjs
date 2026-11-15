const vm=require('node:vm'),assert=require('node:assert/strict'),fs=require('node:fs');
const baseline=fs.readFileSync(process.argv[2],'utf8'),fixed=fs.readFileSync(process.argv[3],'utf8');
function extract(s){return s.slice(s.indexOf('async function boot()'),s.indexOf('\nfunction openView(',s.indexOf('async function boot()')))+'\n'+s.slice(s.indexOf('boot();\n\n// V41:'),s.indexOf('// DW CRM pilot',s.indexOf('boot();\n\n// V41:')));}
async function run(s,{signedIn=true,query='?view=leads&lead=123e4567-e89b-42d3-a456-426614174000',afterLoad}={}){
 const events=[],location={search:query,href:'app.html'+query};
 const badge={classList:{add(){}},textContent:''};
 const context={location,window:{location,DW_DATA:{mode:'supabase',getSession:async()=>signedIn?{user:{}}:null}},document:{getElementById:()=>badge},URLSearchParams,setTimeout:fn=>fn(),loadLeads:async()=>{events.push('loaded');if(afterLoad)location.search=afterLoad;},openView:view=>{events.push('view:'+view);location.search='?view='+view;},openLeadDossier:async id=>events.push('dossier:'+id),startLiveDatabaseSync:()=>events.push('realtime'),showMessage:msg=>{throw Error(msg)}};
 vm.runInNewContext(extract(s),context);await new Promise(setImmediate);return {events,location};
}
(async()=>{
 const id='123e4567-e89b-42d3-a456-426614174000';
 const before=await run(baseline);assert(!before.events.includes('dossier:'+id));console.log('PASS reproduces original timer losing dossier');
 const after=await run(fixed);assert.equal(after.events.filter(x=>x==='dossier:'+id).length,1);assert(after.events.indexOf('loaded')<after.events.indexOf('dossier:'+id));assert.equal(after.events.filter(x=>x==='view:leads').length,1);console.log('PASS opens exact dossier once after data loads');
 const changed=await run(fixed,{afterLoad:'?view=dashboard'});assert(changed.events.includes('dossier:'+id));console.log('PASS entry dossier survives unrelated URL mutation during loading');
 const denied=await run(fixed,{signedIn:false});assert.equal(denied.location.href,'login.html');assert(!denied.events.includes('loaded'));assert(!denied.events.some(x=>x.startsWith('dossier:')));console.log('PASS logged-out visitor still requires login');
 const plain=await run(fixed,{query:'?view=reports'});assert(plain.events.includes('view:reports'));assert(!plain.events.some(x=>x.startsWith('dossier:')));console.log('PASS ordinary view link preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
