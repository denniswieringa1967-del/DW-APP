// Prepared read-only native snapshot endpoint. No writes, service-role key or external caller-ID service.
import {buildSnapshot} from '../shared/caller-id-model.mjs';
import {verifyDeviceProof} from './device-proof.mjs';
const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const answer=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async req=>{
 try{
  if(req.method!=='POST')return answer(405,{error:'Method not allowed'});
  const base=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_ANON_KEY')||'',owner=Deno.env.get('CALLER_OWNER_USER_ID')||'',device=Deno.env.get('CALLER_DEVICE_PUBLIC_KEY_B64')||'';
  if(!base||!key||!owner||!device)return answer(503,{error:'Caller-ID is nog niet gekoppeld.'});
  const authorization=req.headers.get('Authorization')||'';if(!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization))return answer(401,{error:'Aanmelden vereist.'});
  const auth=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:authorization}});if(!auth.ok)return answer(401,{error:'Sessie niet geldig.'});const user=await auth.json();
  if(user.id!==owner)return answer(403,{error:'Alleen de eigenaar heeft toegang.'});
  const timestamp=req.headers.get('X-DW-Time')||'',nonce=req.headers.get('X-DW-Nonce')||'',sig=req.headers.get('X-DW-Signature')||'';
  if(!await verifyDeviceProof({owner,device,userId:user.id,time:timestamp,nonce,signature:sig}))return answer(403,{error:'Apparaat niet gekoppeld.'});
  const requestHeaders={apikey:key,Authorization:authorization};
  const profile=await fetch(base+'/rest/v1/field_users?select=user_id,is_active&user_id=eq.'+encodeURIComponent(owner),{headers:requestHeaders});if(!profile.ok)throw Error('Profile');const profiles=await profile.json();if(profiles.length!==1||profiles[0].is_active!==true)return answer(403,{error:'Account niet actief.'});
  async function read(table:string,select:string){const all=[];for(let offset=0;offset<10000;offset+=1000){const r=await fetch(base+'/rest/v1/'+table+'?select='+select+'&order='+(table==='leads'?'id':'lead_id')+'.asc&limit=1000&offset='+offset,{headers:requestHeaders});if(!r.ok)throw Error('Read');const page=await r.json();all.push(...page);if(page.length<1000)return all;}throw Error('Snapshot too large');}
  const [leads,meta]=await Promise.all([read('leads','id,phone,contact_name,company,status,source,scan_type'),read('lead_meta','lead_id,campaign,interests,field_ai:woningcheck_data->field_scans->ai->>visit_id')]);
  return answer(200,buildSnapshot(leads,Object.fromEntries(meta.map(m=>[m.lead_id,m]))));
 }catch{return answer(503,{error:'Synchronisatie niet bevestigd. Geen gegevens gewijzigd.'});}
});
