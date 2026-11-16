import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {normalize,sha} from './model.mjs';
const BUCKET='zeb-energy-private';

const baseHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};

Deno.serve(async(req)=>{
 const admin=createClient(Deno.env.get('SUPABASE_URL')||'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',{auth:{persistSession:false,autoRefreshToken:false}});
 const ctx={supabaseAdmin:admin};
 const json=(body,status=200)=>Response.json(body,{status,headers:{...baseHeaders,...(req.headers.get('Origin')?{'Access-Control-Allow-Origin':req.headers.get('Origin'),'Vary':'Origin'}:{})}});
 const origin=req.headers.get('Origin');const origins=[...new Set(['https://denniswieringa1967-del.github.io',...(Deno.env.get('DW_FIELD_ALLOWED_ORIGINS')||'').split(',').map(s=>s.trim()).filter(Boolean)])];
 if(origin&&!origins.includes(origin))return json({error:'Deze herkomst is niet toegestaan'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...baseHeaders,'Access-Control-Allow-Origin':origin||'null','Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Vary':'Origin'}});
 if(req.method!=='POST')return json({error:'POST vereist'},405);
 // The gateway requires a signed JWT. The private server additionally authenticates
 // with a 48-hour, hashed review key; ordinary UI users need the owner session.
 const key=req.headers.get('X-DW-Test')||req.headers.get('X-DW-Gateway')||'';let actor=null;
 if(!key){const auth=req.headers.get('Authorization');if(!auth?.startsWith('Bearer '))return json({error:'Geen toegang'},401);const {data,error}=await ctx.supabaseAdmin.auth.getUser(auth.slice(7));if(error||!data.user)return json({error:'Een geldige eigenaarsessie is nodig'},403);actor=data.user.id;}
 const rpc=async(op,p={})=>{const {data,error}=await ctx.supabaseAdmin.rpc('dw_field_api',{op,p,review_key:key,actor});if(error){const e=new Error(error.message);e.code=error.code;throw e;}return data;};
 try{
  const access=await rpc('ping');const OWNER=access.owner_id;
  const size=Number(req.headers.get('Content-Length')||0);if(size>12000000)return json({error:'Aanvraag te groot'},413);
  const raw=await req.text();if(raw.length>12000000)return json({error:'Aanvraag te groot'},413);
  const b=JSON.parse(raw),op=b.op;
  if(op==='ping')return json({ok:true,review_only:access.review_only,production_enabled:access.production_enabled});
  if(op==='ingest')return json(await rpc('ingest',normalize(b.input,b.channel,access.review_only)));
  if(op==='save_scan')return json(await rpc('save_scan',b.input));
  if(op==='list')return json(await rpc('list'));
  if(op==='followup')return json(await rpc('followup',b.input));
  if(op==='amend'){
   const all=await rpc('list');const existing=all.metadata[b.lead_id]?.woningcheck_data?.business_energy;if(!existing)throw Error('Dossier niet gevonden.');
   const allowed=['contact_name','email','street','house_number','addition','postal_code','city','sector','energy_type','electricity_kwh','electricity_unknown','gas_m3','gas_unknown','supplier','contract_end_date','contact_window'];
   if(!b.fields||Object.keys(b.fields).some(k=>!allowed.includes(k)))throw Error('Onbekende aanvulvelden.');
   const normalized=normalize({...existing,...b.fields,callback_at:''},existing.channel,access.review_only);
   return json(await rpc('amend',{lead_id:b.lead_id,previous_version:b.previous_version,normalized}));
  }
  if(op==='issue_upload'){
   const token=crypto.randomUUID()+crypto.randomUUID();const out=await rpc('issue_upload',{lead_id:b.lead_id,visit_id:b.visit_id,token_hash:await sha(token)});return json({...out,token,lead_id:b.lead_id});
  }
  if(op==='bootstrap_storage'){
   const {data:bucket,error:readError}=await ctx.supabaseAdmin.storage.getBucket(BUCKET);
   if(bucket?.public)throw Error('Documentbucket mag niet openbaar zijn.');
   if(!bucket){const {error}=await ctx.supabaseAdmin.storage.createBucket(BUCKET,{public:false,fileSizeLimit:8388608,allowedMimeTypes:['application/pdf']});if(error)throw error;}
   return json({ok:true,private:true});
  }
  if(op==='upload'){
   // Raw browser PDFs are never accepted: only the bounded server rasterizer may call this operation.
   const sanitizer=req.headers.get('X-DW-Sanitizer')||'';
   await rpc('authorize_sanitizer',{proof_hash:await sha(sanitizer)});
   if(b.consent!==true||typeof b.token!=='string'||b.token.length>100||typeof b.pdf_base64!=='string'||b.pdf_base64.length>11200000)return json({error:'Controleer aanleverlink, toestemming en bestand'},400);
   const bytes=Uint8Array.from(atob(b.pdf_base64),c=>c.charCodeAt(0));if(bytes.length>8388608||bytes.length<8||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return json({error:'Ongeldig bestand'},400);
   const original_filename=String(b.original_filename||'jaarafrekening.pdf').normalize('NFKC').split(/[\\/]/).pop().replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g,'').trim().slice(0,180)||'jaarafrekening.pdf';
   const digest=await sha(bytes),args={lead_id:b.lead_id,visit_id:b.visit_id,token_hash:await sha(b.token),digest};
   const checked=await rpc('validate_upload',args);if(checked.duplicate)return json({ok:true,duplicate:true,document_id:checked.document_id});
   // Only the authenticated review gateway sends flattened image-only PDFs.
   // No browser receives the backend key or writes directly to Storage.
   const document_id=crypto.randomUUID(),path=OWNER+'/'+b.lead_id+'/'+document_id+'.pdf';
   const {error}=await ctx.supabaseAdmin.storage.from(BUCKET).upload(path,bytes,{contentType:'application/pdf',upsert:false});if(error)throw error;
   try{const out=await rpc('register_document',{...args,document_id,object_path:path,content_type:'application/pdf',byte_size:bytes.length,original_filename});if(out.document_id!==document_id)await ctx.supabaseAdmin.storage.from(BUCKET).remove([path]);return json(out);}catch(e){await ctx.supabaseAdmin.storage.from(BUCKET).remove([path]);throw e;}
  }
  if(op==='document'){
   const d=await rpc('document',{lead_id:b.lead_id,visit_id:b.visit_id,document_id:b.document_id});
   const {data,error}=await ctx.supabaseAdmin.storage.from(BUCKET).download(d.object_path);if(error)throw error;
   return new Response(data,{headers:{...baseHeaders,'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="jaarafrekening.pdf"','Content-Security-Policy':"sandbox; default-src 'none'"}});
  }
  if(op==='cleanup'){
   if(!access.review_only)throw Error('Opruimen alleen in een afgeschermde fictieve test.');
   const paths=await rpc('cleanup_paths',{lead_id:b.lead_id});if(paths.length){const {error}=await ctx.supabaseAdmin.storage.from(BUCKET).remove(paths);if(error)throw error;}return json(await rpc('cleanup',{lead_id:b.lead_id}));
  }
  return json({error:'Onbekende actie'},400);
 }catch(e){const code=e?.code;return json({error:code==='42501'?'Geen toegang tot deze aanvraag of dit document':code==='23505'?'Aanvraag-ID bestaat met andere gegevens':code==='40001'?'Dossier gewijzigd; ververs eerst':e instanceof SyntaxError?'Ongeldige aanvraag':e.message||'Verwerking niet bevestigd'},code==='42501'?403:code==='23505'||code==='40001'?409:400);}
});
