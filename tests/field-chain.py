"""Protected hosted-chain test. Credentials only from ignored local files. Always cleans created fictional leads."""
import json,urllib.request,urllib.error,uuid,concurrent.futures,subprocess,sys,base64
from pathlib import Path
from datetime import datetime,timedelta,timezone
ROOT=Path(__file__).resolve().parents[1];LOCAL=ROOT/'.local'
keys=json.loads((LOCAL/'field-test-access.json').read_text());jwt=json.loads((LOCAL/'field-jwt.json').read_text())['jwt']
import os
url=os.environ['DW_SUPABASE_URL'].rstrip('/')+'/functions/v1/dw-field-visit'
created=set();passed=[]
def call(op,expect=200,**kw):
 headers={'Authorization':'Bearer '+jwt,'apikey':jwt,'X-DW-Test':keys['test'],'X-DW-Sanitizer':keys['sanitizer'],'Content-Type':'application/json'}
 req=urllib.request.Request(url,data=json.dumps({'op':op,**kw}).encode(),headers=headers)
 try:
  with urllib.request.urlopen(req,timeout=45) as r:status,data=r.status,r.read()
 except urllib.error.HTTPError as e:status,data=e.code,e.read()
 if status!=expect:raise AssertionError(f'{op}: expected {expect}, got {status}: {data[:350]!r}')
 if op=='document' and status==200:return data
 return json.loads(data)
def check(name,condition):
 assert condition,name
 passed.append(name);print('PASS',name,flush=True)
def raw(name,channel):
 return {'submission_id':str(uuid.uuid4()),'company_name':'TEST-ZEB-'+name,'contact_name':'TEST Contact','phone':'0612345678','email':name.lower()+'@example.invalid','postal_code':'1234AB','city':'Teststad','street':'Teststraat','house_number':'1','addition':'A','sector':'Overig zakelijk','energy_type':'both','electricity_unknown':True,'gas_unknown':True,'contact_consent':True,'privacy_acknowledged':True,'callback_at':(datetime.now(timezone.utc)+timedelta(days=3)).isoformat(),'attribution':{'utm_source':'google' if channel=='online' else 'buitendienst','utm_medium':'cpc' if channel=='online' else 'fysieke-acquisitie','utm_campaign':'zeb-test','adgroup':'algemeen','keyword':'zakelijke energie'}}
def ingest(p,channel):
 r=call('ingest',input=p,channel=channel);created.add(r['lead_id']);(LOCAL/'field-created-leads.json').write_text(json.dumps(sorted(created)));return r
try:
 a=raw('CHAIN-A','online');ra=ingest(a,'online');aid=ra['lead_id']
 b=raw('CHAIN-B','field');b['phone']='0612345679';rb=ingest(b,'field');bid=rb['lead_id']
 check('Online and field have separate correct leads',aid!=bid)
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:repeats=list(pool.map(lambda _:ingest(a,'online'),range(4)))
 check('Concurrent repeat same visit creates no duplicate',all(r['lead_id']==aid and r['duplicate'] for r in repeats))
 alias={**b,'submission_id':str(uuid.uuid4()),'phone':'0031612345679','existing_lead_id':bid}
 same=ingest(alias,'field');check('Existing lead links to new visit with normalized phone',same['lead_id']==bid and same['duplicate'])
 for phone in ['+31612345679','0612345679']:
  again=ingest({**b,'submission_id':str(uuid.uuid4()),'phone':phone},'field');check('Canonical phone dedup '+phone,again['lead_id']==bid)
 wrong={**a,'company_name':'TEST-ZEB-WRONG'};call('ingest',expect=409,input=wrong,channel='online');check('Reused visit with wrong company rejected',True)
 all=call('list');ma=all['metadata'][aid];mb=all['metadata'][bid]
 check('Online source Google Ads',next(l['source'] for l in all['leads'] if l['id']==aid)=='Google Ads')
 check('Field source Buitendienst',next(l['source'] for l in all['leads'] if l['id']==bid)=='Buitendienst')
 check('Both campaign and customer type preserved',all['metadata'][aid]['campaign']==mb['campaign']=='Zakelijk Energie Besparen' and ma['woningcheck_data']['customer_type']==mb['woningcheck_data']['customer_type']=='zakelijk')
 check('All UTM adgroup keyword retained',all['metadata'][aid]['woningcheck_data']['business_energy']['attribution']==a['attribution'])
 callback=mb['crm_followup']['callbackAt']
 call('save_scan',input={'lead_id':bid,'visit_id':b['submission_id'],'product':'ai','data':{'opportunity':'TEST proces','interest':'Ja'}})
 call('save_scan',expect=403,input={'lead_id':aid,'visit_id':b['submission_id'],'product':'ai','data':{}});check('Other lead cannot attach scan to wrong visit',True)
 ma=call('followup',input={'lead_id':aid,'previous_version':ma['crm_followup']['version'],'stage':'In gesprek','note':'TEST vrijwillig document besproken'})
 cap=call('issue_upload',lead_id=aid,visit_id=a['submission_id'])
 # Generate tiny fictive PNG, use the EXISTING isolated rasterizer; do not send arbitrary raw PDFs.
 from PIL import Image
 import io
 im=Image.new('RGB',(200,200),'white');buf=io.BytesIO();im.save(buf,format='PNG')
 safe=subprocess.run([sys.executable,str(ROOT.parent/'zakelijk-energie/sanitize_document.py'),'image/png'],input=buf.getvalue(),stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=20,check=True).stdout
 up={'lead_id':aid,'visit_id':a['submission_id'],'token':cap['token'],'consent':True,'pdf_base64':base64.b64encode(safe).decode(),'original_filename':'TEST-jaarafrekening.png'}
 doc=call('upload',**up);did=doc['document_id'];check('Private bill upload received',bool(did))
 repeated=call('upload',**up);check('Repeated upload dedup',repeated['document_id']==did and repeated['duplicate'])
 received=call('document',lead_id=aid,visit_id=a['submission_id'],document_id=did);check('Correct dossier opens stored PDF',received==safe)
 call('document',expect=403,lead_id=bid,document_id=did);check('Wrong dossier denied document A',True)
 call('document',expect=403,lead_id=aid,visit_id=b['submission_id'],document_id=did);check('Wrong visit denied document A',True)
 call('upload',expect=403,**{**up,'lead_id':bid,'visit_id':b['submission_id']});check('Wrong lead denied upload capability A',True)
 call('upload',expect=403,**{**up,'visit_id':b['submission_id']});check('Wrong visit denied upload capability A',True)
 fresh=call('list');mb=fresh['metadata'][bid];call('amend',lead_id=bid,previous_version=mb['crm_followup']['version'],fields={'contact_name':'TEST Contact Aangevuld','email':'aanvulling@example.invalid','supplier':'TEST leverancier','electricity_unknown':False,'electricity_kwh':24000})
 fresh=call('list');mb=fresh['metadata'][bid];ma=fresh['metadata'][aid]
 check('Short dossier can be completed',mb['woningcheck_data']['business_energy']['electricity_kwh']==24000)
 check('Additional scan remains same dossier',mb['ai_scan_data']['interest']=='Ja' and mb['woningcheck_data']['field_scans']['ai']['visit_id']==b['submission_id'])
 check('Callback preserved after scan and amendment',mb['crm_followup']['callbackAt']==callback)
 check('Document only at correct lead with filename and time',ma['woningcheck_data']['business_energy']['annual_bill_status']=='Jaarafrekening ontvangen' and ma['woningcheck_data']['business_energy']['documents'][0]['original_filename']=='TEST-jaarafrekening.png' and bool(ma['woningcheck_data']['business_energy']['documents'][0]['created_at']) and not mb['woningcheck_data']['business_energy'].get('documents'))
finally:
 errors=[]
 for lid in created:
  try:call('cleanup',lead_id=lid)
  except Exception as e:errors.append(str(e))
 if errors:raise RuntimeError('Cleanup failed: '+str(errors))
 (LOCAL/'field-created-leads.json').unlink(missing_ok=True)
 print('CLEANUP completed',len(created),'fictional leads')
 (ROOT/'tests/field-chain-result.json').write_text(json.dumps({'passed':passed,'cleanup':not errors},indent=2))
