const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(__dirname+'/../production-adapter.js','utf8'),code=s.slice(s.indexOf('  async function updateRepeatedVisit('),s.indexOf('  async function saveCampaignVisit('));
function fixture(callback='2026-12-01T09:00:00.000Z'){
 const calls=[],meta={lead_id:'lead-A',woningcheck_data:{field_visit:{visit_id:'visit-A'},business_energy:{stage:'Nieuwe lead'}},crm_followup:{version:'v1',callbackAt:callback}};
 const c={functions:{invoke:async(fn,{body})=>{calls.push(body);return {data:{lead_id:'lead-A',crm_followup:{version:'v2'}}}}}};
 const ctx={cfg:{campaignIntakeFunction:'dw-field-visit'},dw:()=>({listLeadMeta:async()=>({'lead-A':meta})}),client:()=>c,Object,Error};vm.createContext(ctx);vm.runInContext(code,ctx);return {calls,run:ctx.updateRepeatedVisit,meta};
}
test('Repeated field save amends same lead and accepts metadata confirmation',async()=>{const f=fixture();await f.run({id:'visit-A',production_lead_id:'lead-A'},{electricity_kwh:25000,gas_m3:4000,callback_at:f.meta.crm_followup.callbackAt},{duplicate:true,lead_id:'lead-A'});assert.equal(f.calls.length,1);assert.equal(f.calls[0].op,'amend');assert.equal(f.calls[0].fields.gas_m3,4000);assert(!('callback_at' in f.calls[0].fields));});
test('Changed callback uses returned optimistic version',async()=>{const f=fixture();await f.run({id:'visit-A',production_lead_id:'lead-A'},{callback_at:'2026-12-02T09:00:00.000Z'},{duplicate:true,lead_id:'lead-A'});assert.equal(f.calls[1].op,'followup');assert.equal(f.calls[1].input.previous_version,'v2');});
test('Wrong lead or visit cannot amend',async()=>{const f=fixture();await assert.rejects(f.run({id:'other',production_lead_id:'lead-A'},{},{duplicate:true,lead_id:'lead-A'}),/bezoek/);await assert.rejects(f.run({id:'visit-A',production_lead_id:'other'},{},{duplicate:true,lead_id:'lead-A'}),/koppeling/);assert.equal(f.calls.length,0);});
