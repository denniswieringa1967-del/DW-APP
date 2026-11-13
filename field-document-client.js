/* Authenticated owner upload through the same-origin server rasterizer, never directly to Storage. */
(function(root){'use strict';
 function gateway(){const configured=root.DW_CONFIG?.documentGatewayBase;if(!configured)return null;const u=new URL(configured,location.href);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||!u.pathname.startsWith('/api/')||(u.origin!==location.origin&&u.origin!=='https://dw-marketing.nl'))throw Error('Documentverwerker moet op de eigen beveiligde DW-host staan.');return u.href.replace(/\/$/,'');}
 async function session(){const {data,error}=await root.DW_DATA.client.auth.getSession();if(error||!data.session?.access_token)throw Error('Log eerst in om dit dossier te openen.');return data.session.access_token;}
 async function invoke(op,body){const {data,error}=await root.DW_DATA.client.functions.invoke(root.DW_CONFIG.campaignIntakeFunction,{body:{op,...body}});if(error||data?.error)throw Error(data?.error||error?.message||'Niet bevestigd.');return data;}
 async function upload({leadId,visitId,file,consent}){
  const path=gateway();if(!path)throw Error('De beveiligde documentverwerker is nog niet aangesloten.');
  if(!file||file.size<1||file.size>8388608||!['application/pdf','image/jpeg','image/png'].includes(file.type))throw Error('Kies PDF, JPG of PNG, maximaal 8 MB.');
  if(!consent)throw Error('Bevestig vrijwillige aanlevering.');
  const meta=(await root.DW_DATA.listLeadMeta())[leadId];if(!meta?.woningcheck_data?.business_energy)throw Error('Geen zakelijk Energiecheck-dossier.');
  if(meta.crm_followup?.contactConfirmed!==true)await invoke('followup',{input:{lead_id:leadId,previous_version:meta.crm_followup?.version,stage:'In gesprek',note:'Vrijwillige documentaanlevering bevestigd tijdens bedrijfsbezoek.'}});
  const cap=await invoke('issue_upload',{lead_id:leadId,visit_id:visitId});
  const form=new FormData();form.append('file',file);form.append('lead_id',leadId);form.append('visit_id',visitId);form.append('token',cap.token);form.append('consent','true');
  const r=await fetch(path,{method:'POST',credentials:'omit',headers:{Authorization:'Bearer '+await session()},body:form});const result=await r.json();if(!r.ok||!result.document_id)throw Error(result.error||'Ontvangst niet bevestigd.');return result;
 }
 root.DW_FIELD_DOCUMENTS=Object.freeze({gateway,upload});
})(window);
