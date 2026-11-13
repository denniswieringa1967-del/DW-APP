'use strict';
window.DW_ENERGY_DOCUMENTS=(()=>{
 const running=new Set();
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function json(path,body){const r=await fetch(path,body?{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-ZEB-Form':'energycheck-v1'},body:JSON.stringify(body)}:{credentials:'same-origin'});const out=await r.json();if(!r.ok)throw Error(out.error||'Dossier niet bevestigd.');return out;}
 function mount(host,{leadId,company}){
  if(!leadId||window.DW_PRODUCTION.mode()!=='review')return;
  const prefix='/api/flow/'+encodeURIComponent(leadId);
  host.innerHTML=`<section class="energy-document-card"><h3>Jaarafrekening veilig toevoegen</h3><p><strong>${escape(company)}</strong><br><small>Dossier ${escape(leadId)}</small></p><p>Vrijwillig. PDF, JPG of PNG, maximaal 8 MB. Er wordt een veilige PDF-kopie opgeslagen.</p><label>Jaarafrekening kiezen<input class="energy-document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"></label><label class="consent-card"><input class="energy-document-consent" type="checkbox">Ik heb de ondernemer gesproken en deze jaarafrekening mag bij dit dossier worden opgeslagen.</label><button type="button" class="primary energy-document-upload">Jaarafrekening veilig uploaden</button><p class="energy-document-status" role="status" aria-live="polite"></p></section>`;
  const fileInput=host.querySelector('.energy-document-file'),consent=host.querySelector('.energy-document-consent'),button=host.querySelector('.energy-document-upload'),status=host.querySelector('.energy-document-status');
  button.onclick=async()=>{
   const file=fileInput.files[0];if(running.has(leadId))return;
   try{
    window.ZEB_DOCUMENTS.validate(file);if(!consent.checked)throw Error('Bevestig het klantcontact en de vrijwillige documentupload.');
    running.add(leadId);button.disabled=true;fileInput.disabled=true;consent.disabled=true;status.textContent='Dossier en documenttoegang controleren…';
    const flow=await json('/api/flow/leads');const meta=flow.metadata[leadId],data=meta?.woningcheck_data;
    if(meta?.campaign!=='Zakelijk Energie Besparen'||data?.customer_type!=='zakelijk'||data?.business_energy?.channel!=='field')throw Error('Geen toegang tot dit zakelijke buitendienstdossier.');
    if(meta.crm_followup?.contactConfirmed!==true)await json(prefix+'/followup',{stage:'In gesprek',previous_version:meta.crm_followup.version,next_action:meta.crm_followup.nextAction||'Jaarafrekening beoordelen',note:'Klantcontact en vrijwillige documentupload bevestigd tijdens bedrijfsbezoek.'});
    const cap=await json(prefix+'/issue-upload',{});
    status.textContent='Jaarafrekening veilig verwerken en opslaan…';
    const result=await window.ZEB_DOCUMENTS.upload({leadId,token:cap.token,file,consent:true});
    const verified=await json('/api/flow/leads'),energy=verified.metadata[leadId]?.woningcheck_data?.business_energy;
    if(energy?.annual_bill_status!=='Jaarafrekening ontvangen'||!energy.documents.some(x=>x.id===result.document_id))throw Error('Ontvangst niet bevestigd. Controleer het dossier voordat u opnieuw probeert.');
    status.textContent=(result.duplicate?'Al ontvangen bij dit dossier. ':'Jaarafrekening ontvangen. ')+file.name;
    fileInput.value='';const link=document.createElement('a');link.href='/flow-review.html?lead='+encodeURIComponent(leadId);link.textContent='Open dit zakelijke dossier';status.append(document.createElement('br'),link);
   }catch(e){status.textContent=e.message}finally{running.delete(leadId);button.disabled=false;fileInput.disabled=false;consent.disabled=false}
  };
 }
 return Object.freeze({mount});
})();
