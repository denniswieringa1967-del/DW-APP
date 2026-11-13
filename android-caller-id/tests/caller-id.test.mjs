import test from 'node:test';import assert from 'node:assert/strict';import {normalizeNlPhone,buildSnapshot,matchCaller,primaryCategory,categoriesFor} from '../shared/caller-id-model.mjs';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const leads=[{id:id(1),phone:'0612345678',contact_name:'TEST AI',company:'TEST AI BV',scan_type:'AI Efficiency Scan',source:'DW Marketing',status:'Warme lead'},{id:id(2),phone:'+31623456789',contact_name:'TEST ZEB',company:'TEST Energie BV',scan_type:'Zakelijke Energiecheck',source:'Buitendienst',status:'In gesprek'},{id:id(3),phone:'0031634567890',contact_name:'TEST DW',company:'TEST Marketing',source:'DW Marketing',status:'Nieuwe lead'},{id:id(4),phone:'06 1234 5678',contact_name:'TEST AI',company:'TEST AI BV',scan_type:'Zakelijke Energiecheck',source:'Buitendienst',status:'Nog bellen'}];
const metadata={[id(2)]:{campaign:'Zakelijk Energie Besparen'},[id(4)]:{campaign:'Zakelijk Energie Besparen'}};
const now=1763035200000,s=buildSnapshot(leads,metadata,now);
for(const value of ['0612345678','+31612345678','0031612345678','(06) 1234-5678'])test('NL normalisatie '+value,()=>assert.equal(normalizeNlPhone(value),'+31612345678'));
for(const value of ['','0000000000','06123','+32612345678','0612345678 ext 9','0031(0)612345678','anonymous','+316123456789'])test('Geen onbetrouwbare match '+value,()=>assert.equal(normalizeNlPhone(value),null));
test('Bekend AI nummer en meerdere actieve trajecten',()=>{const x=matchCaller(s,'0612345678',now);assert.equal(x.matches.length,2);assert.deepEqual(x.categories,['AI','DW MARKETING','ENERGIE / ZEB']);assert.equal(x.ambiguous,true)});
test('Bekend ZEB nummer',()=>assert.equal(matchCaller(s,'0623456789',now).matches[0].campaign,'Zakelijk Energie Besparen'));
test('Bekend DW Marketing nummer',()=>assert.deepEqual(matchCaller(s,'0634567890',now).categories,['DW MARKETING']));
test('Onbekend nummer heeft geen match',()=>assert.equal(matchCaller(s,'0699999999',now),null));
test('Verouderde snapshot toont geen mogelijk onjuiste klant',()=>assert.equal(matchCaller(s,'0612345678',s.expires_at),null));
test('Match maakt of wijzigt geen records',()=>{const before=JSON.stringify({leads,metadata,s});matchCaller(s,'0612345678',now);assert.equal(JSON.stringify({leads,metadata,s}),before)});
test('Actieve trajecten hebben voorrang boven afgesloten',()=>{const x=structuredClone(s);x.records[0].active=false;assert.equal(matchCaller(x,'0612345678',now).matches.length,1)});
test('Categorieën alleen uit opdracht/bron, niet uit naam',()=>assert.equal(primaryCategory({contact_name:'AI ZEB KPN'},{}),'Nog indelen'));
test('KPN en partner expliciete bron',()=>{assert.equal(primaryCategory({source:'KPN'},{}),'KPN');assert.equal(primaryCategory({source:'Partner / leverancier'},{}),'PARTNER / LEVERANCIER')});

test('AI-scan binnen bestaand ZEB dossier toont beide categorieën',()=>{assert.deepEqual(categoriesFor({scan_type:'Zakelijke Energiecheck'},{campaign:'Zakelijk Energie Besparen',field_ai:'fictief-bezoek'}),['AI','ENERGIE / ZEB']);});
