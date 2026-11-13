const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function fixture({lookupError=false}={}){
 const writes=[],cfg={integrationMode:'live',sourceLabel:'Buitendienst'},w={DW_CONFIG:cfg};
 const client={rpc:async()=>({}),from(table){let select=false;return {select(){select=true;return this},eq(){return this},maybeSingle:async()=>table==='field_users'?{data:{role:'admin',is_active:true}}:{data:null,error:lookupError?Error('offline'):null},update(data){writes.push({table,data});return this},then(resolve){return Promise.resolve({error:null}).then(resolve)}}}};
 w.DW_DATA={client,getSession:async()=>({user:{id:'fixture-owner'}}),createLead:async(data)=>{writes.push({create:data});return{id:'new-lead'}},upsertLeadMeta:async(id,data)=>writes.push({meta:id,data}),updateLead:async(id,data)=>writes.push({lead:id,data})};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../production-adapter.js','utf8'),{window:w,navigator:{onLine:true},console,Date,Set,String,Number});
 return {w,writes};
}
const base=()=>({id:'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',route:'zakelijk',product:'ai',source:'Buitendienst',campaign:'Zakelijk Energie Besparen',visit_status:'Gesprek gevoerd',contact:{company:'TEST bedrijf',name:'TEST',phone:'0000000000',email:'test@example.invalid'},answers:{sector:'Horeca'},consent:{privacy:true},products:[]});
test('Extra AI-scan behoudt bestaande ZEB-lead, campagne, callback en documenten',async()=>{
 const {w,writes}=fixture(),v={...base(),production_lead_id:'zeb-lead-A',energy_campaign:true};
 assert.equal((await w.DW_PRODUCTION.saveVisit(v)).leadId,'zeb-lead-A');
 assert.equal(writes.filter(x=>x.create||x.meta||x.lead).length,0);
 assert.equal(writes[0].table,'lead_meta');assert.deepEqual(Object.keys(writes[0].data).sort(),['ai_scan_data','field_worker','updated_at']);assert.equal(writes[0].data.ai_scan_data.field_visit_id,v.id);
});
test('Opnieuw opslaan hergebruikt bevestigde lead-ID',async()=>{
 const {w,writes}=fixture(),v=base();const first=await w.DW_PRODUCTION.saveVisit(v);await w.DW_PRODUCTION.saveVisit(v);assert.equal(first.leadId,v.production_lead_id);assert.equal(writes.filter(x=>x.create).length,1);
});
test('Mislukte duplicaatcontrole maakt geen nieuwe lead',async()=>{const {w,writes}=fixture({lookupError:true});await assert.rejects(w.DW_PRODUCTION.saveVisit(base()),/geen nieuwe lead/);assert.equal(writes.length,0)});
test('Energiecheck-concept zonder opgeslagen centrale lead maakt geen AI-lead',async()=>{const{w,writes}=fixture();await assert.rejects(w.DW_PRODUCTION.saveVisit({...base(),energy_campaign:true}),/eerst de Energiecheck/);assert.equal(writes.length,0)});
test('Betaalde Energie & Compliance wordt niet ongemerkt geactiveerd',async()=>{const{w,writes}=fixture();await assert.rejects(w.DW_PRODUCTION.saveVisit({...base(),product:'energie'}),/Productiebeveiliging/);assert.equal(writes.length,0)});
test('Nieuwe beveiligde scanroute geeft hetzelfde lead- en bezoek-ID door',async()=>{const {w,writes}=fixture();w.DW_CONFIG.campaignIntakeFunction='dw-field-visit';w.DW_DATA.client.functions={invoke:async(fn,body)=>{writes.push({fn,...body});return{data:{ok:true}}}};const v={...base(),energy_campaign:true,production_lead_id:'existing-lead'};const r=await w.DW_PRODUCTION.saveVisit(v);assert.equal(r.leadId,'existing-lead');assert.equal(writes.length,1);assert.equal(writes[0].body.op,'save_scan');assert.equal(writes[0].body.input.visit_id,v.id);assert.equal(writes[0].body.input.lead_id,'existing-lead')});
test('Bestaand dossier gaat ter controle naar server zonder nieuwe clientlead',async()=>{const {w,writes}=fixture();w.DW_CONFIG.campaignIntakeFunction='dw-field-visit';vm.runInNewContext(fs.readFileSync(__dirname+'/../campaign-routing.js','utf8'),{window:w,Date,Intl,Error});w.DW_DATA.client.functions={invoke:async(fn,body)=>{writes.push({fn,...body});return{data:{ok:true,lead_id:'verified-existing'}}}};const v={...base(),campaign_key:'business_energy',existing_lead_candidate:'123e4567-e89b-42d3-a456-426614174001',answers:{sector:'Horeca',energy_type:'both',electricity_unknown:true,gas_unknown:true},consent:{privacy:true,contact:true}};const r=await w.DW_PRODUCTION.saveCampaignVisit(v);assert.equal(r.leadId,'verified-existing');assert.equal(writes.length,1);assert.equal(writes[0].body.input.existing_lead_id,v.existing_lead_candidate);assert.equal(writes[0].body.input.visit_context.note,'')});
