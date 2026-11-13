// Load after the existing DW Flow app.js. Display only; no storage mutation.
(async()=>{
 const {categoriesFor,primaryCategory}=await import('./caller-id-model.mjs');
 const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 if(typeof renderDossierBody!=='function'||typeof getLeadMeta!=='function')return;
 const original=renderDossierBody;
 renderDossierBody=function(...args){const content=original.apply(this,args);if(typeof selectedLead==='undefined'||!selectedLead)return content;const meta=getLeadMeta(selectedLead.id),all=categoriesFor(selectedLead,meta);return `<section class="dw-caller-category" aria-label="Primaire klantcategorie" style="padding:16px;border:1px solid #ccddec;border-radius:14px;margin-bottom:16px"><strong>Primaire klantcategorie / opdracht</strong><p>${safe(primaryCategory(selectedLead,meta))}</p><div>${all.map(c=>`<span style="display:inline-block;padding:7px 12px;border-radius:20px;background:#e8f1fa;margin:3px">${safe(c)}</span>`).join('')}</div><small>Gebaseerd op bestaande opdracht, bron en campagne. Gebruikt voor DW Nummerherkenning.</small></section>`+content;};
 if(typeof selectedLead!=='undefined'&&selectedLead&&typeof renderLeadDossier==='function')renderLeadDossier();
})().catch(()=>{/* Existing cockpit remains usable if this optional display cannot load. */});
