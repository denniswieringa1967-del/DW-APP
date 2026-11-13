-- Additive, service-only extension. Existing campaigns, RLS and review settings stay unchanged.
create schema if not exists dw_field_private;
revoke all on schema dw_field_private from public,anon,authenticated;
grant usage on schema dw_field_private to service_role;
create table if not exists dw_field_private.settings(id boolean primary key default true check(id),owner_id uuid not null,enabled boolean not null default false,production_enabled boolean not null default false,key_hash text not null default '',sanitizer_hash text not null default '',gateway_hash text not null default '',expires_at timestamptz not null default now());
create table if not exists dw_field_private.identities(fingerprint text primary key,lead_id uuid not null references public.leads(id) on delete cascade,owner_id uuid not null);
create table if not exists dw_field_private.requests(external_id uuid primary key,lead_id uuid not null references public.leads(id) on delete cascade,payload jsonb not null,channel text not null check(channel in ('online','field')),created_at timestamptz not null default now());
create table if not exists dw_field_private.scans(visit_id uuid not null references dw_field_private.requests(external_id) on delete cascade,product text not null check(product in ('ai','energie')),payload jsonb not null,updated_at timestamptz not null default now(),primary key(visit_id,product));
create table if not exists dw_field_private.capabilities(token_hash text primary key references zeb_private.upload_tokens(digest) on delete cascade,visit_id uuid not null references dw_field_private.requests(external_id) on delete cascade);
create table if not exists dw_field_private.document_visits(document_id uuid not null references zeb_private.documents(id) on delete cascade,visit_id uuid not null references dw_field_private.requests(external_id) on delete cascade,primary key(document_id,visit_id));
alter table dw_field_private.settings enable row level security;
alter table dw_field_private.identities enable row level security;
alter table dw_field_private.requests enable row level security;
alter table dw_field_private.scans enable row level security;
alter table dw_field_private.capabilities enable row level security;
alter table dw_field_private.document_visits enable row level security;
grant select,insert,update,delete on all tables in schema dw_field_private to service_role;
create or replace function dw_field_private.phone_key(raw text) returns text language sql immutable set search_path='' as $$
select case when v ~ '^0031[1-9][0-9]{8}$' then substring(v from 3) when v ~ '^0[1-9][0-9]{8}$' then '31'||substring(v from 2) else v end from (select regexp_replace(coalesce(raw,''),'[^0-9]','','g') v) n;
$$;
revoke all on function dw_field_private.phone_key(text) from public,anon,authenticated;
grant execute on function dw_field_private.phone_key(text) to service_role;
CREATE OR REPLACE FUNCTION public.dw_field_api(op text, p jsonb, review_key text DEFAULT ''::text, actor uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare s dw_field_private.settings;lid uuid;old dw_field_private.requests;v_fingerprint text;req jsonb;meta public.lead_meta;crm jsonb;stamp timestamptz:=clock_timestamp();docs jsonb;d zeb_private.documents;t zeb_private.upload_tokens;stage text;event text;newversion uuid;review_session boolean;gateway_session boolean;visit uuid;existing public.leads;
begin
 if current_user <> 'service_role' then raise exception 'Geen toegang' using errcode='42501';end if;
 select * into s from dw_field_private.settings where id;
 if not found then raise exception 'Ontvanger nog niet geconfigureerd' using errcode='42501';end if;
 review_session:=coalesce(s.enabled and s.expires_at>stamp and s.key_hash<>'' and encode(extensions.digest(coalesce(review_key,''),'sha256'),'hex')=s.key_hash,false);
 gateway_session:=s.production_enabled and s.gateway_hash<>'' and encode(extensions.digest(coalesce(review_key,''),'sha256'),'hex')=s.gateway_hash;
 if not review_session and not gateway_session and not coalesce((s.production_enabled and actor=s.owner_id and exists(select 1 from public.field_users where user_id=actor and is_active=true and lower(role) in ('admin','beheerder'))),false) then raise exception 'Geen toegang tot deze buitendienstfunctie' using errcode='42501';end if;
 if gateway_session and op not in ('ping','ingest','authorize_sanitizer','validate_upload','register_document') then raise exception 'Gatewayactie niet toegestaan' using errcode='42501';end if;
 if op='ping' then return jsonb_build_object('review_only',review_session,'gateway',gateway_session,'production_enabled',s.production_enabled,'owner_id',s.owner_id);end if;
 if op='authorize_sanitizer' then
  if coalesce(p->>'proof_hash','')='' or s.sanitizer_hash='' or p->>'proof_hash'<>s.sanitizer_hash then raise exception 'Alleen de beveiligde documentverwerker' using errcode='42501';end if;
  return jsonb_build_object('ok',true);
 end if;
 if op='ingest' then
  req:=p;
  if coalesce(req->>'company_name','')='' or coalesce(req->>'phone','')='' or coalesce(req->>'contact_name','')='' then raise exception 'Contactgegevens ontbreken';end if;
  if req->>'campaign' is distinct from 'Zakelijk Energie Besparen' or req->>'customer_type' is distinct from 'zakelijk' or req->>'contact_consent' is distinct from 'true' or req->>'privacy_acknowledged' is distinct from 'true' or coalesce(req->>'source','') not in ('Buitendienst','Google Ads','Social','Website') then raise exception 'Ongeldige zakelijke aanvraag';end if;
  if review_session and (coalesce(req->>'company_name','') !~* '^TEST-ZEB-' or coalesce(req->>'contact_name','') !~* '^TEST' or (coalesce(req->>'email','')<>'' and req->>'email' !~* '\.invalid$')) then raise exception 'Alleen fictieve testaanvragen';end if;
  perform pg_advisory_xact_lock(hashtextextended(req->>'submission_id',114));
  select * into old from dw_field_private.requests where external_id=(req->>'submission_id')::uuid;
  if found then
   if lower(regexp_replace(old.payload->>'company_name','[^[:alnum:]]','','g'))<>lower(regexp_replace(req->>'company_name','[^[:alnum:]]','','g')) or old.payload->>'phone'<>req->>'phone' or old.payload->>'postal_code'<>req->>'postal_code' or old.payload->>'house_number'<>req->>'house_number' or coalesce(old.payload->>'addition','')<>coalesce(req->>'addition','') then raise exception 'Bezoek-ID hoort bij een andere bedrijfsidentiteit' using errcode='23505';end if;
   return jsonb_build_object('ok',true,'duplicate',true,'lead_id',old.lead_id,'reference','ZEB-'||upper(left(old.lead_id::text,8)));
  end if;
  v_fingerprint:=encode(extensions.digest(lower(regexp_replace(req->>'company_name','[^[:alnum:]]','','g'))||'|'||dw_field_private.phone_key(req->>'phone')||'|'||lower(regexp_replace(concat_ws(' ',req->>'street',req->>'house_number',req->>'addition',req->>'postal_code',req->>'city'),'[^[:alnum:]]','','g')),'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_fingerprint,115));
  select lead_id into lid from dw_field_private.identities where identities.fingerprint=v_fingerprint and owner_id=s.owner_id;
  if gateway_session and nullif(req->>'existing_lead_id','') is not null then raise exception 'Website mag geen bestaand dossier kiezen' using errcode='42501';end if;
  if nullif(req->>'existing_lead_id','') is not null then
   select * into existing from public.leads where id=(req->>'existing_lead_id')::uuid for update;
   if not found or (existing.owner_id is distinct from s.owner_id and not (existing.owner_id is null and existing.created_by=s.owner_id)) then raise exception 'Bestaand dossier niet van deze eigenaar' using errcode='42501';end if;
   if review_session and existing.company !~* '^TEST-ZEB-' then raise exception 'Test mag geen echt dossier wijzigen' using errcode='42501';end if;
   select * into meta from public.lead_meta where lead_id=existing.id;
   if dw_field_private.phone_key(existing.phone)<>dw_field_private.phone_key(req->>'phone') or lower(regexp_replace(existing.company,'[^[:alnum:]]','','g'))<>lower(regexp_replace(req->>'company_name','[^[:alnum:]]','','g')) or lower(regexp_replace(coalesce(meta.address,''),'[^[:alnum:]]','','g'))<>lower(regexp_replace(concat_ws(' ',req->>'street',req->>'house_number',req->>'addition',req->>'postal_code',req->>'city'),'[^[:alnum:]]','','g')) then raise exception 'Bedrijf, adres en telefoon moeten bij het geselecteerde dossier passen' using errcode='23505';end if;
   if lid is not null and lid<>existing.id then raise exception 'Bedrijfsidentiteit heeft al een ander dossier' using errcode='23505';end if;
   lid:=existing.id;
   insert into dw_field_private.identities values(v_fingerprint,lid,s.owner_id) on conflict(fingerprint) do nothing;
  end if;
  if lid is not null then
   select * into meta from public.lead_meta where lead_id=lid;
   if coalesce(meta.woningcheck_data->'business_energy'->>'postal_code','')<>'' and coalesce(req->>'postal_code','')<>'' and meta.woningcheck_data->'business_energy'->>'postal_code'<>req->>'postal_code' then raise exception 'Controle nodig: dit bedrijf/telefoon heeft een ander adres';end if;
   insert into dw_field_private.requests(external_id,lead_id,payload,channel) values((req->>'submission_id')::uuid,lid,req,req->>'channel');
   update public.lead_meta set woningcheck_data=coalesce(woningcheck_data,'{}'::jsonb)||jsonb_build_object('field_visit',req->'visit_context'),updated_at=stamp where lead_id=lid;
   insert into zeb_private.audit(lead_id,event,actor) values(lid,'duplicate_channel_linked',req->>'channel');
   return jsonb_build_object('ok',true,'duplicate',true,'lead_id',lid,'reference','ZEB-'||upper(left(lid::text,8)));
  end if;
  insert into public.leads(company,contact_name,email,phone,scan_type,status,source,owner_id,revenue,tally_submission_id,notes)
  values(req->>'company_name',req->>'contact_name',req->>'email',req->>'phone','Zakelijke Energiecheck','Nieuwe lead',req->>'source',s.owner_id,0,'dw-field:'||(req->>'submission_id'),case when review_session then '[TEST - niet opvolgen] Afgeschermde buitendienstketentest' else '' end) returning id into lid;
  -- Suppress only the outbox record just created for this fictional test lead.
  -- Queued notification workers cannot send it after this transaction commits.
  if review_session then update public.dw_lead_notification_outbox set status='failed',last_error='DW field isolated test: do not send' where lead_id=lid;end if;
  newversion:=gen_random_uuid();crm:=jsonb_build_object('version',newversion,'updatedAt',stamp,'callStatus','Nog bellen','appointmentState','Geen afspraak','callbackAt',coalesce(req->>'callback_at',''),'nextAction','Verbruik en contract verifiëren','history','[]'::jsonb);
  insert into public.lead_meta(lead_id,external_id,form_id,campaign,interests,platform,qualification,address,expected_commission,partner_share_consent,report_email_consent,report_status,appointment_status,crm_followup,woningcheck_data,utm_source,utm_medium,utm_campaign,utm_content,captured_at,updated_at)
  values(lid,'dw-field:'||(req->>'submission_id'),'zeb-energycheck-v2','Zakelijk Energie Besparen','Zakelijke energie',case when req->>'channel'='field' then 'DW APP' else 'ZakelijkEnergieBesparen.nl' end,'Verbruik controleren',concat_ws(' ',nullif(req->>'street',''),nullif(req->>'house_number',''),nullif(req->>'addition',''),nullif(req->>'postal_code',''),nullif(req->>'city','')),0,false,false,'Niet aangevraagd','Geen afspraak',crm,
  jsonb_build_object('customer_type','zakelijk','field_visit',req->'visit_context','acquisition',jsonb_build_object('channel',req->>'channel','external_id',req->>'submission_id'),'business_energy',req||jsonb_build_object('consent_at',stamp,'annual_bill_status','Nog niet ontvangen · vrijwillig','stage','Nieuwe lead','documents','[]'::jsonb)),req->'attribution'->>'utm_source',req->'attribution'->>'utm_medium',req->'attribution'->>'utm_campaign',req->'attribution'->>'utm_content',stamp,stamp);
  insert into dw_field_private.identities values(v_fingerprint,lid,s.owner_id);
  insert into dw_field_private.requests(external_id,lead_id,payload,channel) values((req->>'submission_id')::uuid,lid,req,req->>'channel');
  insert into zeb_private.audit(lead_id,event,actor) values(lid,'lead_received',req->>'channel');
  insert into zeb_private.conversions(lead_id,event) values(lid,'form_submit_success');
  return jsonb_build_object('ok',true,'duplicate',false,'lead_id',lid,'reference','ZEB-'||upper(left(lid::text,8)));
 end if;
 if op='list' then
  return jsonb_build_object('leads',coalesce((select jsonb_agg(to_jsonb(l) order by l.created_at) from public.leads l join dw_field_private.identities z on z.lead_id=l.id where z.owner_id=s.owner_id and (not review_session or l.company ~* '^TEST-ZEB-')),'[]'::jsonb),'metadata',coalesce((select jsonb_object_agg(m.lead_id,to_jsonb(m)) from public.lead_meta m join dw_field_private.identities z on z.lead_id=m.lead_id join public.leads l on l.id=m.lead_id where z.owner_id=s.owner_id and (not review_session or l.company ~* '^TEST-ZEB-')),'{}'::jsonb));
 end if;
 lid:=(p->>'lead_id')::uuid;
 if not exists(select 1 from dw_field_private.identities i join public.leads l on l.id=i.lead_id where i.lead_id=lid and i.owner_id=s.owner_id and l.owner_id=s.owner_id and (not review_session or l.company ~* '^TEST-ZEB-')) then raise exception 'Geen toegang tot deze campagnelead' using errcode='42501';end if;
 select * into meta from public.lead_meta where lead_id=lid for update;
 if op='save_scan' then
  visit:=(p->>'visit_id')::uuid;
  if not exists(select 1 from dw_field_private.requests where external_id=visit and lead_id=lid) or coalesce(p->>'product','') not in ('ai','energie') or jsonb_typeof(p->'data') is distinct from 'object' or length((p->'data')::text)>60000 then raise exception 'Scan hoort niet bij dit bezoek' using errcode='42501';end if;
  insert into dw_field_private.scans(visit_id,product,payload) values(visit,p->>'product',p->'data') on conflict(visit_id,product) do update set payload=excluded.payload,updated_at=stamp;
  update public.lead_meta set ai_scan_data=case when p->>'product'='ai' then p->'data' else ai_scan_data end,woningcheck_data=jsonb_set(coalesce(woningcheck_data,'{}'::jsonb),'{field_scans}',coalesce(woningcheck_data->'field_scans','{}'::jsonb)||jsonb_build_object(p->>'product',jsonb_build_object('visit_id',visit,'data',p->'data','updated_at',stamp))),updated_at=stamp where lead_id=lid;
  insert into zeb_private.audit(lead_id,event,actor) values(lid,'field_scan_saved',p->>'product');
  return jsonb_build_object('ok',true,'lead_id',lid,'visit_id',visit);
 end if;
 if op='followup' then
  if coalesce(meta.crm_followup->>'version','')<>coalesce(p->>'previous_version','') then raise exception 'Dossier gewijzigd; ververs eerst' using errcode='40001';end if;
  stage:=p->>'stage';if stage not in ('Nieuwe lead','Nog bellen','Niet bereikt','In gesprek','Verbruik controleren','Jaarafrekening gevraagd','Jaarafrekening ontvangen','Gekwalificeerd','Aanbieding/offerte','Follow-up','Deal','Niet gekwalificeerd','Geen interesse') then raise exception 'Ongeldige status';end if;
  if stage='Jaarafrekening ontvangen' and not exists(select 1 from zeb_private.documents where lead_id=lid) then raise exception 'Nog geen jaarafrekening ontvangen';end if;
  crm:=coalesce(meta.crm_followup,'{}'::jsonb)||jsonb_build_object('version',gen_random_uuid(),'updatedAt',stamp,'callStatus',case stage when 'Niet bereikt' then 'Niet bereikbaar' when 'Deal' then 'Verkocht' when 'Geen interesse' then 'Geen interesse' else case when coalesce(p->>'callback_at','')<>'' then 'Terugbellen' else stage end end,'nextAction',coalesce(nullif(p->>'next_action',''),stage));
  if p ? 'assignee' then
   if length(p->>'assignee')>160 then raise exception 'Behandelaar te lang';end if;
   crm:=crm||jsonb_build_object('assignee',p->>'assignee');
  end if;
  if p ? 'callback_at' then
   if coalesce(p->>'callback_at','')<>'' and (p->>'callback_at')::timestamptz<=stamp then raise exception 'Terugbelmoment ligt niet in de toekomst';end if;
   crm:=crm||jsonb_build_object('callbackAt',coalesce(p->>'callback_at',''));
  end if;
  if stage in ('Deal','Geen interesse','Niet gekwalificeerd') then crm:=crm||jsonb_build_object('callbackAt','');end if;
  if stage='In gesprek' then crm:=crm||jsonb_build_object('contactConfirmed',true);end if;
  if coalesce(p->>'appointment_at','')<>'' then
   if (p->>'appointment_at')::timestamptz<=stamp then raise exception 'Afspraak ligt niet in de toekomst';end if;
   crm:=crm||jsonb_build_object('appointmentState','Gepland','appointmentAt',p->>'appointment_at','callbackAt','');
  end if;
  if stage='Deal' then crm:=crm||jsonb_build_object('saleStatus','Verkocht');elsif stage='Aanbieding/offerte' then crm:=crm||jsonb_build_object('saleStatus','Offerte');end if;
  if length(coalesce(p->>'note',''))>2000 or length(coalesce(p->>'next_action',''))>300 then raise exception 'Notitie te lang';end if;
  crm:=crm||jsonb_build_object('history',coalesce(crm->'history','[]'::jsonb)||jsonb_build_array(jsonb_build_object('at',stamp,'type','Belgesprek','status',stage,'note',coalesce(p->>'note',''))));
  update public.lead_meta set crm_followup=crm,qualification=case when stage in ('Gekwalificeerd','Niet gekwalificeerd','Verbruik controleren') then stage else qualification end,sales_status=case when stage in ('Aanbieding/offerte','Deal') then stage else sales_status end,appointment_status=case when crm->>'appointmentState'='Gepland' then 'Afspraak gepland' else appointment_status end,appointment_date=case when coalesce(crm->>'appointmentAt','')<>'' then (crm->>'appointmentAt')::timestamptz else appointment_date end,woningcheck_data=jsonb_set(woningcheck_data,'{business_energy,stage}',to_jsonb(stage)),updated_at=stamp where lead_id=lid;
  update public.leads set status=stage where id=lid;
  event:=case when coalesce(p->>'appointment_at','')<>'' then 'appointment' when stage='Gekwalificeerd' then 'qualified_lead' when stage='Aanbieding/offerte' then 'quote' when stage='Deal' then 'deal' else null end;
  if event is not null then insert into zeb_private.conversions(lead_id,event) values(lid,event) on conflict do nothing;end if;
  insert into zeb_private.audit(lead_id,event,actor) values(lid,'followup_saved','owner');
 elsif op='amend' then
  if coalesce(meta.crm_followup->>'version','')<>coalesce(p->>'previous_version','') then raise exception 'Dossier gewijzigd; ververs eerst' using errcode='40001';end if;
  req:=p->'normalized';
  if req->>'postal_code' is distinct from meta.woningcheck_data->'business_energy'->>'postal_code' or req->>'house_number' is distinct from meta.woningcheck_data->'business_energy'->>'house_number' or coalesce(req->>'addition','') is distinct from coalesce(meta.woningcheck_data->'business_energy'->>'addition','') then raise exception 'Adresidentiteit wijzigen vereist aparte controle';end if;
  if req->>'company_name' is distinct from meta.woningcheck_data->'business_energy'->>'company_name' or req->>'phone' is distinct from meta.woningcheck_data->'business_energy'->>'phone' then raise exception 'Bedrijfsidentiteit wijzigen vereist aparte controle';end if;
  update public.leads set contact_name=req->>'contact_name',email=req->>'email' where id=lid;
  update public.lead_meta set address=concat_ws(' ',nullif(req->>'street',''),nullif(req->>'house_number',''),nullif(req->>'addition',''),nullif(req->>'postal_code',''),nullif(req->>'city','')),woningcheck_data=jsonb_set(woningcheck_data,'{business_energy}',(woningcheck_data->'business_energy')||(req - array['source','campaign','customer_type','channel','submission_id','attribution','contact_consent','privacy_acknowledged','consent_version','visit_context','existing_lead_id','callback_at','annual_bill_status','documents','stage'])),crm_followup=jsonb_set(crm_followup,'{version}',to_jsonb(gen_random_uuid())),updated_at=stamp where lead_id=lid;
  insert into zeb_private.audit(lead_id,event,actor) values(lid,'dossier_amended','owner');
 elsif op='issue_upload' then
  if meta.crm_followup->>'contactConfirmed' is distinct from 'true' then raise exception 'Bevestig eerst het klantcontact (In gesprek)';end if;
  update zeb_private.upload_tokens set expires_at=stamp where lead_id=lid and consumed_digest is null;
  visit:=coalesce(nullif(p->>'visit_id','')::uuid,(select external_id from dw_field_private.requests where lead_id=lid order by created_at limit 1));
  if not exists(select 1 from dw_field_private.requests where external_id=visit and lead_id=lid) then raise exception 'Verkeerd bezoek bij dossier' using errcode='42501';end if;
  insert into zeb_private.upload_tokens(digest,lead_id,expires_at) values(p->>'token_hash',lid,stamp+interval '24 hours');
  insert into dw_field_private.capabilities values(p->>'token_hash',visit);
  update public.lead_meta set woningcheck_data=jsonb_set(woningcheck_data,'{business_energy,annual_bill_status}',case when exists(select 1 from zeb_private.documents where lead_id=lid) then '"Jaarafrekening ontvangen"'::jsonb else '"Jaarafrekening gevraagd"'::jsonb end),updated_at=stamp where lead_id=lid;
  insert into zeb_private.audit(lead_id,event,actor) values(lid,'upload_link_issued','owner');
  return jsonb_build_object('ok',true,'expires_at',stamp+interval '24 hours');
 elsif op='validate_upload' then
  select * into t from zeb_private.upload_tokens where digest=p->>'token_hash' and lead_id=lid for update;
  if not found or t.expires_at<stamp or (t.consumed_digest is not null and t.consumed_digest<>p->>'digest') then raise exception 'Aanleverlink ongeldig, verlopen of gebruikt' using errcode='42501';end if;
  if not exists(select 1 from dw_field_private.capabilities c join dw_field_private.requests r on r.external_id=c.visit_id where c.token_hash=p->>'token_hash' and r.lead_id=lid and (nullif(p->>'visit_id','') is null or c.visit_id=(p->>'visit_id')::uuid)) then raise exception 'Verkeerd bezoek bij aanlevering' using errcode='42501';end if;
  select * into d from zeb_private.documents where lead_id=lid and digest=p->>'digest';
  return jsonb_build_object('ok',true,'duplicate',d.id is not null,'document_id',d.id);
 elsif op='register_document' then
  select * into t from zeb_private.upload_tokens where digest=p->>'token_hash' and lead_id=lid for update;
  if not found or t.expires_at<stamp or (t.consumed_digest is not null and t.consumed_digest<>p->>'digest') then raise exception 'Aanleverlink niet geldig' using errcode='42501';end if;
  if p->>'object_path' !~ ('^'||s.owner_id::text||'/'||lid::text||'/[a-f0-9-]{36}\.pdf$') or p->>'content_type'<>'application/pdf' then raise exception 'Ongeldig documentpad';end if;
  insert into zeb_private.documents(id,lead_id,object_path,digest,content_type,byte_size,original_filename) values((p->>'document_id')::uuid,lid,p->>'object_path',p->>'digest','application/pdf',(p->>'byte_size')::integer,left(coalesce(nullif(p->>'original_filename',''),'jaarafrekening.pdf'),180)) on conflict(lead_id,digest) do nothing;
  select visit_id into visit from dw_field_private.capabilities where token_hash=p->>'token_hash';
  if not exists(select 1 from dw_field_private.requests where external_id=visit and lead_id=lid) then raise exception 'Verkeerd bezoek bij document' using errcode='42501';end if;
  insert into dw_field_private.document_visits select id,visit from zeb_private.documents where lead_id=lid and digest=p->>'digest' on conflict do nothing;
  update zeb_private.upload_tokens set consumed_digest=p->>'digest' where digest=p->>'token_hash';
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'created_at',created_at,'content_type',content_type,'byte_size',byte_size,'original_filename',original_filename)),'[]'::jsonb) into docs from zeb_private.documents where lead_id=lid;
  update public.lead_meta set woningcheck_data=jsonb_set(jsonb_set(woningcheck_data,'{business_energy,documents}',docs),'{business_energy,annual_bill_status}','"Jaarafrekening ontvangen"'::jsonb),updated_at=stamp where lead_id=lid;
  insert into zeb_private.audit(lead_id,event,actor) values(lid,'document_received','capability');
  select * into d from zeb_private.documents where lead_id=lid and digest=p->>'digest';
  return jsonb_build_object('ok',true,'document_id',d.id);
 elsif op='document' then
  select * into d from zeb_private.documents where id=(p->>'document_id')::uuid and lead_id=lid;
  if not found or (nullif(p->>'visit_id','') is not null and not exists(select 1 from dw_field_private.document_visits where document_id=d.id and visit_id=(p->>'visit_id')::uuid)) then raise exception 'Document hoort niet bij dit dossier' using errcode='42501';end if;
  insert into zeb_private.audit(lead_id,event,actor) values(lid,'document_opened','owner');return to_jsonb(d);
 elsif op='cleanup_paths' then
  return coalesce((select jsonb_agg(object_path) from zeb_private.documents where lead_id=lid),'[]'::jsonb);
 elsif op='cleanup' then
  if not review_session or not exists(select 1 from public.leads where id=lid and company ~* '^TEST-ZEB-') then raise exception 'Alleen fictieve testdata opruimen' using errcode='42501';end if;
  delete from public.dw_lead_notification_outbox where lead_id=lid;
  delete from public.leads where id=lid;
  return jsonb_build_object('ok',true,'deleted_lead_id',lid);
 else raise exception 'Onbekende actie';end if;
 select * into meta from public.lead_meta where lead_id=lid;return to_jsonb(meta);
end;$function$;


revoke all on function public.dw_field_api(text,jsonb,text,uuid) from public,anon,authenticated;
grant execute on function public.dw_field_api(text,jsonb,text,uuid) to service_role;
