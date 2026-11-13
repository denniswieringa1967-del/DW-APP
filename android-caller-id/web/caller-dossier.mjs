import {categoriesFor,primaryCategory} from './caller-id-model.mjs';
const id=new URLSearchParams(location.search).get('lead')||'',status=document.getElementById('status'),host=document.getElementById('customer');
const text=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;host.append(n);};
try{
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))throw Error('Ongeldig dossiernummer.');
 const gate=await window.DW_PRODUCTION.bootstrap({redirect:false});if(!gate.ready){sessionStorage.setItem('dw_caller_pending_lead',id);status.textContent='Meld je eerst aan bij DW App. De dossierkeuze blijft op dit apparaat bewaard.';const login=document.createElement('a');login.href='field-login.html';login.textContent='Aanmelden bij DW App';status.append(login);}
 else{
  const c=window.DW_DATA.client;if(!c)throw Error('Geen beveiligde gegevensverbinding.');
  const [{data:lead,error},{data:meta,error:metaError}]=await Promise.all([c.from('leads').select('id,contact_name,company,phone,status,scan_type,source').eq('id',id).maybeSingle(),c.from('lead_meta').select('lead_id,campaign,interests').eq('lead_id',id).maybeSingle()]);
  if(error||metaError||!lead)throw Error('Dossier niet beschikbaar of geen toegang.');
  host.hidden=false;status.textContent='Bestaand dossier geopend. Er zijn geen gegevens gewijzigd.';text('h2',lead.contact_name||lead.company);text('p',lead.company||'');text('strong',categoriesFor(lead,meta||{}).join(' + ')||primaryCategory(lead,meta||{}));text('p',[meta?.campaign,lead.status].filter(Boolean).join(' · '));
  const flow=new URL('https://dw-marketing.nl/flow/app.html');flow.searchParams.set('view','leads');flow.searchParams.set('lead',id);
  const open=document.createElement('a');open.href=flow.href;open.textContent='Open opvolging: notitie, terugbellen, afspraak of status';host.append(open);
  text('small','Gebruik de bestaande acties in het dossier. Er is geen nieuw klantrecord aangemaakt. Het openen van een scan binnen hetzelfde bezoek gebruikt de centrale bezoekroute; een nieuwe scan wordt hier niet automatisch aangemaakt.');
  const back=document.createElement('a');back.href='index.html';back.textContent='Terug naar DW App';host.append(back);sessionStorage.removeItem('dw_caller_pending_lead');
 }
}catch(e){status.textContent=e.message;host.hidden=true;}
