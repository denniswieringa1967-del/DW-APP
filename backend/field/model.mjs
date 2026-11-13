export const CAMPAIGN='Zakelijk Energie Besparen';
export const STAGES=['Nieuwe lead','Nog bellen','Niet bereikt','In gesprek','Verbruik controleren','Jaarafrekening gevraagd','Jaarafrekening ontvangen','Gekwalificeerd','Aanbieding/offerte','Follow-up','Deal','Niet gekwalificeerd','Geen interesse'];
const sectors=['Horeca','Bakkerij','Agrarisch / veehouderij','Productie / industrie','Koel- / vriesbedrijf','Tuinbouw / glastuinbouw','Overig zakelijk'];
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function normalize(raw,channel,reviewOnly=true){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!['online','field'].includes(channel))throw Error('Ongeldige aanvraag.');
 const text=(key,max=180,required=false)=>{let v=raw[key]??'';if(typeof v!=='string'||v.length>max)throw Error('Controleer '+key);v=v.trim();if(required&&!v)throw Error('Vul '+key+' in.');return v};
 const p={submission_id:text('submission_id',36,true),company_name:text('company_name',180,true),contact_name:text('contact_name',140,true),phone:text('phone',30,true),email:text('email',254,channel==='online').toLowerCase(),postal_code:text('postal_code',7,channel==='online').replace(/\s/g,'').toUpperCase(),city:text('city',100,channel==='online'),street:text('street'),house_number:text('house_number',20),sector:text('sector',60,true),energy_type:text('energy_type',20,true),supplier:text('supplier',120),contract_end_date:text('contract_end_date',10),contact_window:text('contact_window',120)||'In overleg',interest:text('interest',300)||'Zakelijke energiecontractcheck',annual_bill_available:text('annual_bill_available',10)||'Onbekend',callback_at:text('callback_at',40),channel,campaign:CAMPAIGN,customer_type:'zakelijk',review_only:reviewOnly};
 if(!uuid.test(p.submission_id)||!sectors.includes(p.sector)||!['gas','electricity','both'].includes(p.energy_type))throw Error('Controleer uw keuzes.');
 if(!/^\+?[\d\s().-]+$/.test(p.phone)||p.phone.replace(/\D/g,'').length<8||p.phone.replace(/\D/g,'').length>15)throw Error('Controleer het telefoonnummer.');
 if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))throw Error('Controleer het e-mailadres.');
 if(p.postal_code&&!/^[1-9][0-9]{3}[A-Z]{2}$/.test(p.postal_code))throw Error('Controleer de postcode.');
 if(!['Ja','Nee','Onbekend'].includes(p.annual_bill_available))throw Error('Controleer de jaarafrekeningkeuze.');
 if(p.contract_end_date&&(!/^\d{4}-\d{2}-\d{2}$/.test(p.contract_end_date)||!Number.isFinite(Date.parse(p.contract_end_date))||new Date(p.contract_end_date).toISOString().slice(0,10)!==p.contract_end_date))throw Error('Controleer de contractdatum.');
 if(p.callback_at&&(!Number.isFinite(Date.parse(p.callback_at))||Date.parse(p.callback_at)<Date.now()))throw Error('Kies een toekomstig terugbelmoment.');
 if(p.callback_at)p.callback_at=new Date(p.callback_at).toISOString();
 for(const [prefix,key,active]of [['electricity','electricity_kwh',p.energy_type!=='gas'],['gas','gas_m3',p.energy_type!=='electricity']]){const unknown=raw[prefix+'_unknown']===true,n=raw[key];if(active&&!unknown&&(typeof n!=='number'||!Number.isFinite(n)||n<0||n>1e12))throw Error('Vul het verbruik in of kies onbekend.');p[prefix+'_unknown']=active&&unknown;p[key]=active&&!unknown?n:null;}
 if(raw.contact_consent!==true||raw.privacy_acknowledged!==true||raw.website)throw Error('Contactverzoek en privacybevestiging zijn nodig.');
 p.contact_consent=true;p.privacy_acknowledged=true;p.partner_share_consent=false;p.consent_version='zeb-v2-20261111';
 const a=raw.attribution||{};if(typeof a!=='object'||Array.isArray(a))throw Error('Ongeldige bron.');p.attribution={};for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','adgroup','keyword'])if(typeof a[k]==='string')p.attribution[k]=a[k].slice(0,180);
 const src=(p.attribution.utm_source||'').toLowerCase(),medium=(p.attribution.utm_medium||'').toLowerCase();p.source=channel==='field'?'Buitendienst':/google/.test(src)&&/cpc|ppc|paid/.test(medium)?'Google Ads':/facebook|instagram|linkedin|tiktok|social|meta/.test(src)?'Social':'Website';
 // This deployed receiver is deliberately review-only. Real submissions cannot pass.
 if(reviewOnly&&(!/^TEST-ZEB-/i.test(p.company_name)||!/^TEST\b/i.test(p.contact_name)||(p.email&&!p.email.endsWith('.invalid'))))throw Error('Alleen fictieve TEST-ZEB-bedrijven en .invalid-testadressen toegestaan.');
 p.phone=phoneKey(p.phone);
 p.addition=text('addition',16);p.existing_lead_id=text('existing_lead_id',36);
 if(p.existing_lead_id&&!uuid.test(p.existing_lead_id))throw Error('Ongeldig bestaand dossier.');
 const context=raw.visit_context||{};
 if(typeof context!=='object'||Array.isArray(context))throw Error('Ongeldig bezoek.');
 p.visit_context={visit_id:p.submission_id,customer_type:'zakelijk',company_name:p.company_name,street:p.street,house_number:p.house_number,addition:p.addition,postal_code:p.postal_code,city:p.city,sector:p.sector,contact_name:p.contact_name,phone:p.phone,email:p.email,source:p.source,campaign:CAMPAIGN};
 for(const key of ['trade_name','website','note']){if(context[key]!==undefined){if(typeof context[key]!=='string'||context[key].length>(key==='note'?2000:254))throw Error('Ongeldige bezoekgegevens.');p.visit_context[key]=context[key].trim();}}
 return p;
}
export const sha=async(s)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',typeof s==='string'?new TextEncoder().encode(s):s))).map(x=>x.toString(16).padStart(2,'0')).join('');

export function phoneKey(raw){let p=String(raw||'').replace(/[^0-9]/g,'');if(/^0031[1-9][0-9]{8}$/.test(p))p=p.slice(2);else if(/^0[1-9][0-9]{8}$/.test(p))p='31'+p.slice(1);if(!/^[1-9][0-9]{7,14}$/.test(p))throw Error('Ongeldig telefoonnummer.');return '+'+p;}
