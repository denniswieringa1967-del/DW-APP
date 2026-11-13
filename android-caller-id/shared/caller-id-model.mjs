export const CATEGORIES=Object.freeze(['AI','ENERGIE / ZEB','DW MARKETING','VERDUURZAMEN','KPN','PARTNER / LEVERANCIER']);
const clean=v=>String(v??'').trim();
export function normalizeNlPhone(value){
 let s=clean(value);if(!s||s.length>40||!/^\+?[\d\s().-]+$/.test(s))return null;
 s=s.replace(/[\s().-]/g,'');if(s.startsWith('0031'))s='+31'+s.slice(4);else if(/^0[1-9]\d{8}$/.test(s))s='+31'+s.slice(1);
 return /^\+31[1-9]\d{8}$/.test(s)?s:null;
}
export function categoriesFor(lead={},meta={}){
 // Explicit commercial fields only. Never infer category from a person's name or notes.
 const subject=[lead.scan_type,meta.campaign,meta.interests].map(clean).join(' ').toLowerCase(),source=clean(lead.source).toLowerCase(),out=[];
 if(/\bai\b|efficiency|hermes/.test(subject))out.push('AI');
 if(/zakelijk energie besparen|\bzeb\b|energiecheck|energie|compliance/.test(subject))out.push('ENERGIE / ZEB');
 if(/dw[ -]?marketing/.test(source)||/\bdw[ -]?marketing\b/.test(subject))out.push('DW MARKETING');
 if(/verduurzam|woningcheck|kozijn|isolatie|warmtepomp|thuisbatterij|zonnepanel|laadpaal|airco/.test(subject))out.push('VERDUURZAMEN');
 if(/\bkpn\b|\bkpn\b/.test(subject+' '+source))out.push('KPN');
 if(/\bpartner\b|\bleverancier\b/.test(subject+' '+source))out.push('PARTNER / LEVERANCIER');
 return out;
}
export function primaryCategory(lead,meta){const all=categoriesFor(lead,meta);return all[0]||'Nog indelen';}
export function buildSnapshot(leads,metadata,now=Date.now()){
 const records=[];
 for(const lead of leads){const phone=normalizeNlPhone(lead.phone);if(!phone||!/^[-a-f0-9]{36}$/i.test(lead.id))continue;const meta=metadata[lead.id]||{};records.push({lead_id:lead.id,phone,contact_name:clean(lead.contact_name).slice(0,160),company:clean(lead.company).slice(0,160),categories:categoriesFor(lead,meta),campaign:clean(meta.campaign).slice(0,180),status:clean(lead.status).slice(0,100),active:!['geen interesse','niet gekwalificeerd','afgesloten','verloren','geannuleerd','gearchiveerd'].includes(clean(lead.status).toLowerCase())});}
 return {version:1,synced_at:now,expires_at:now+3600000,records};
}
export function matchCaller(snapshot,value,now=Date.now()){
 const phone=normalizeNlPhone(value);if(!phone||!snapshot||snapshot.version!==1||!Number.isFinite(snapshot.expires_at)||snapshot.expires_at<=now)return null;
 const rows=snapshot.records.filter(r=>r.phone===phone);if(!rows.length)return null;
 const active=rows.filter(r=>r.active);const matches=active.length?active:rows;
 // Preserve each matching dossier, including different people sharing a company number.
 return {matches,categories:[...new Set(matches.flatMap(r=>r.categories))],ambiguous:matches.length>1,synced_at:snapshot.synced_at};
}
