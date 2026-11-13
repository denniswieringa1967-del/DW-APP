/* Shared, explicit campaign routing. No networking or production activation. */
(function(root){
 'use strict';
 const campaigns={kozijnen:{customerType:'particulier',campaign:'Kunststof Kozijnen Pilot',product:'Kunststof kozijnen',scanType:'Kunststof kozijnen',formId:'dw-field-kozijnen-v1'},business_energy:{customerType:'zakelijk',campaign:'Zakelijk Energie Besparen',product:'Zakelijke energie',scanType:'Zakelijke Energiecheck',formId:'dw-field-energycheck-v1'}};
 function normalize(v){
  const cfg=campaigns[v.campaign_key];if(!cfg)throw Error('Onbekende campagne.');
  if(v.route!==cfg.customerType)throw Error('Campagne en klanttype komen niet overeen.');
  const c=v.contact||{},text=(x,max=180)=>{if(typeof x!=='string'||x.trim().length>max)throw Error('Controleer de contactgegevens.');return x.trim()};
  const name=text(c.name),company=cfg.customerType==='zakelijk'?text(c.company):'Particulier',phone=text(c.phone,30),email=text(c.email||'',254).toLowerCase();
  if(!name||!company||!/^\+?[\d ().-]{8,30}$/.test(phone)||phone.replace(/\D/g,'').length<8||phone.replace(/\D/g,'').length>15)throw Error('Naam, bedrijfsnaam en geldig telefoonnummer zijn nodig.');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Controleer het e-mailadres.');
  if(v.consent?.contact!==true||v.consent?.privacy!==true)throw Error('Contactverzoek en privacybevestiging ontbreken.');
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v.id||''))throw Error('Ongeldige bezoek-ID.');
  const postcode=text(c.postcode||'',7).replace(/\s/g,'').toUpperCase();if((cfg.customerType==='particulier'||postcode)&&!/^[1-9][0-9]{3}[A-Z]{2}$/.test(postcode))throw Error('Controleer de postcode.');
  const address=[text(c.street||''),text(c.house_number||'',20),postcode,text(c.city||'',100)].filter(Boolean).join(' ');
  let energy=null;
  if(cfg.customerType==='zakelijk'){
   const a=v.answers||{};if(!['electricity','gas','both'].includes(a.energy_type))throw Error('Kies stroom, gas of beide.');
   energy={sector:text(a.sector||'',60),energy_type:a.energy_type,supplier:text(a.supplier||'',120),contract_end_date:text(a.contract_end_date||'',10),contact_window:text(a.contact_window||'In overleg',60),contact_consent:true,consent_at:v.consent.captured_at||null,consent_version:'dw-field-energycheck-v1',annual_bill_status:'Nog niet ontvangen · vrijwillig',annual_bill_requested:a.annual_bill_requested===true,annual_bill_available:a.annual_bill_available||'Onbekend'};
   if(!['Horeca','Bakkerij','Agrarisch / veehouderij','Productie / industrie','Koel- / vriesbedrijf','Tuinbouw / glastuinbouw','Overig zakelijk'].includes(energy.sector))throw Error('Kies een branche.');
   if(energy.contract_end_date&&(!/^\d{4}-\d{2}-\d{2}$/.test(energy.contract_end_date)||!Number.isFinite(Date.parse(energy.contract_end_date))||new Date(energy.contract_end_date).toISOString().slice(0,10)!==energy.contract_end_date))throw Error('Controleer de contracteinddatum.');
   for(const [prefix,key,active]of [['electricity','electricity_kwh',a.energy_type!=='gas'],['gas','gas_m3',a.energy_type!=='electricity']]){
    const unknown=a[prefix+'_unknown']===true,number=a[key];
    if(active&&!unknown&&(typeof number!=='number'||!Number.isFinite(number)||number<0||number>1e12))throw Error('Vul jaarverbruik in of kies onbekend.');
    energy[prefix+'_unknown']=active&&unknown;energy[key]=active&&!unknown?number:null;
   }
  }else if(!text(c.street||'')||!text(c.house_number||'',20))throw Error('Straat en huisnummer zijn nodig voor het woningbezoek.');
  const data={customer_type:cfg.customerType,acquisition:{channel:'fysieke acquisitie',platform:'DW APP',visit_id:v.id,contact_requested_at:v.consent.captured_at||null,consent_version:cfg.formId}};
  if(energy)data.business_energy=energy;else data.field_kozijnen={product:cfg.product,reason:text(v.answers?.reason||'',500),timing:text(v.answers?.timing||'',100)};
  return {external_lead_id:v.id,lead:{company,contact_name:name,email,phone,scan_type:cfg.scanType,status:'Nieuwe lead',source:'Buitendienst',revenue:0},metadata:{external_id:'dw-field:'+v.id,form_id:cfg.formId,campaign:cfg.campaign,interests:cfg.product,platform:'DW APP',address,qualification:'Nog beoordelen',expected_commission:0,partner_share_consent:false,report_email_consent:false,appointment_status:'Geen afspraak',utm_source:'buitendienst',utm_medium:'fysieke-acquisitie',utm_campaign:cfg.campaign,woningcheck_data:data,crm_followup:{callStatus:'Nog bellen',nextAction:energy?'Verbruik en contract verifiëren':'Kozijnenwens bespreken',history:[]}}};
 }
 function toEnergyInput(v){
  const normalized=normalize(v);if(v.campaign_key!=='business_energy')throw Error('Dit is geen zakelijke Energiecheck.');
  const c=v.contact,a=v.answers;
  return {submission_id:v.id,company_name:c.company,contact_name:c.name,phone:c.phone,email:c.email||'',postal_code:c.postcode||'',city:c.city||'',street:c.street||'',house_number:c.house_number||'',addition:c.addition||'',existing_lead_id:(typeof v.existing_lead_candidate==='string'?v.existing_lead_candidate:'')||v.production_lead_id||'',visit_context:{trade_name:c.trade_name||'',website:c.website||'',note:v.notes||''},sector:a.sector,energy_type:a.energy_type,electricity_kwh:a.electricity_kwh??null,electricity_unknown:a.electricity_unknown===true,gas_m3:a.gas_m3??null,gas_unknown:a.gas_unknown===true,supplier:a.supplier||'',contract_end_date:a.contract_end_date||'',contact_window:a.contact_window||'In overleg',interest:a.interest||'Zakelijke energiecontractcheck',annual_bill_available:a.annual_bill_available||'Onbekend',callback_at:a.callback_at||'',contact_consent:v.consent.contact===true,privacy_acknowledged:v.consent.privacy===true,website:'',attribution:{utm_source:'buitendienst',utm_medium:'fysieke-acquisitie',utm_campaign:'Zakelijk Energie Besparen'}};
 }
 function amsterdamLocal(value){if(!value)return '';const parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value));return parts.replace(' ','T')}
 function amsterdamToIso(value){if(!value)return '';if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Controleer datum en tijd.');const target=Date.parse(value+'Z');let stamp=target;for(let i=0;i<3;i++)stamp+=target-Date.parse(amsterdamLocal(stamp)+'Z');if(amsterdamLocal(stamp)!==value)throw Error('Deze tijd bestaat niet door de overgang naar zomertijd.');return new Date(stamp).toISOString()}
 root.DW_CAMPAIGN_ROUTING={campaigns,normalize,toEnergyInput,amsterdamLocal,amsterdamToIso};
})(typeof window==='object'?window:globalThis);
