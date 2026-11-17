do $migration$
declare definition text;
begin
 definition:=pg_get_functiondef('public.dw_field_api(text,jsonb,text,uuid)'::regprocedure);
 if position('elsif op=''check_upload'' then' in definition)>0 then raise exception 'Preflight already exists; inspect first';end if;
 if position(' elsif op=''validate_upload'' then' in definition)=0 then raise exception 'Expected upload guard missing';end if;
 definition:=replace(definition,' elsif op=''validate_upload'' then',$preflight$ elsif op='check_upload' then
  select * into t from zeb_private.upload_tokens where digest=p->>'token_hash' and lead_id=lid;
  if not found or t.expires_at<stamp then raise exception 'Aanleverlink ongeldig of verlopen' using errcode='42501';end if;
  if nullif(p->>'visit_id','') is null or not exists(select 1 from dw_field_private.capabilities c join dw_field_private.requests r on r.external_id=c.visit_id where c.token_hash=p->>'token_hash' and r.lead_id=lid and c.visit_id=(p->>'visit_id')::uuid) then raise exception 'Verkeerd bezoek bij aanlevering' using errcode='42501';end if;
  return jsonb_build_object('ok',true);
 elsif op='validate_upload' then$preflight$);
 execute definition;
end;
$migration$;

