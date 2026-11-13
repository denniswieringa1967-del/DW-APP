"""WSGI endpoint for /api/field-document-upload on the existing authenticated HTTPS host.
No credentials, customer files or tokens are stored. Production stays disabled until host configuration.
"""
import os,json,base64,subprocess,sys,urllib.request,urllib.error,re
from pathlib import Path
from email.parser import BytesParser
from email.policy import default

def backend(op,access_token,**payload):
 url=os.environ.get('DW_SUPABASE_URL','').rstrip('/')
 if not url.startswith('https://') or not os.environ.get('DW_DOCUMENT_SANITIZER_SECRET'):raise ValueError('Documentverwerker nog niet geconfigureerd.')
 req=urllib.request.Request(url+'/functions/v1/dw-field-visit',data=json.dumps({'op':op,**payload}).encode(),headers={'Content-Type':'application/json','Authorization':'Bearer '+access_token,'apikey':os.environ.get('DW_SUPABASE_PUBLISHABLE_KEY',''),'X-DW-Sanitizer':os.environ['DW_DOCUMENT_SANITIZER_SECRET']})
 try:
  with urllib.request.urlopen(req,timeout=40) as r:return json.loads(r.read())
 except urllib.error.HTTPError as e:
  if e.code in (401,403):raise PermissionError('Geen toegang tot dit dossier of deze aanlevering.')
  raise ValueError('Documentontvangst niet bevestigd.')

def application(env,start_response):
 status='400 Bad Request';out={'error':'Ongeldige documentaanlevering.'};cors=[]
 try:
  if env.get('wsgi.url_scheme')!='https':raise PermissionError('HTTPS vereist.')
  origin=env.get('HTTP_ORIGIN','');host=env.get('HTTP_HOST','')
  allowed=os.environ.get('DW_APP_ORIGIN','')
  if origin!='https://'+host and (not allowed or origin!=allowed):raise PermissionError('Aanlevering alleen vanaf de geconfigureerde DW APP.')
  cors=[('Access-Control-Allow-Origin',origin),('Vary','Origin')]
  if env.get('REQUEST_METHOD')=='OPTIONS':
   if env.get('HTTP_ACCESS_CONTROL_REQUEST_METHOD')!='POST':raise PermissionError('Alleen POST toegestaan.')
   requested={x.strip().lower() for x in env.get('HTTP_ACCESS_CONTROL_REQUEST_HEADERS','').split(',') if x.strip()}
   if not requested.issubset({'authorization','content-type'}):raise PermissionError('Onbekende requestheaders.')
   start_response('204 No Content',cors+[('Access-Control-Allow-Methods','POST'),('Access-Control-Allow-Headers','authorization,content-type'),('Cache-Control','no-store')]);return [b'']
  if env.get('REQUEST_METHOD')!='POST':raise ValueError('POST vereist.')
  auth=env.get('HTTP_AUTHORIZATION','')
  if not auth.startswith('Bearer ') or len(auth)>10000:raise PermissionError('Log eerst in.')
  token=auth[7:];backend('ping',token) # Server verifies the real owner JWT before parsing documents.
  length=int(env.get('CONTENT_LENGTH') or 0)
  if not 1<=length<=9*1024*1024:raise ValueError('Maximaal 8 MB bestand.')
  kind=env.get('CONTENT_TYPE','')
  if not kind.startswith('multipart/form-data;') or len(kind)>250:raise ValueError('Ongeldige bestandsaanlevering.')
  data=env['wsgi.input'].read(length+1)
  if len(data)!=length:raise ValueError('Onvolledige aanlevering.')
  message=BytesParser(policy=default).parsebytes(('Content-Type: '+kind+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+data)
  fields={};file=None;filename='';typ=''
  for part in message.iter_parts():
   key=part.get_param('name',header='content-disposition')
   if key in fields or (key=='file' and file is not None):raise ValueError('Dubbel veld.')
   if key=='file':file=part.get_payload(decode=True);filename=part.get_filename() or 'jaarafrekening.pdf';typ=part.get_content_type()
   elif key in ('lead_id','visit_id','token','consent'):fields[key]=part.get_content()
   else:raise ValueError('Onbekend veld.')
  if fields.get('consent')!='true' or not file or len(file)>8388608 or typ not in ('application/pdf','image/jpeg','image/png'):raise ValueError('Controleer toestemming en PDF/JPG/PNG.')
  for key in ('lead_id','visit_id'):
   if not re.fullmatch(r'[a-fA-F0-9-]{36}',fields.get(key,'')):raise ValueError('Ongeldig dossier/bezoek.')
  if len(fields.get('token',''))>100:raise ValueError('Ongeldige aanlevering.')
  safe=subprocess.run([sys.executable,str(Path(__file__).with_name('sanitize_document.py')),typ],input=file,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=18,check=True).stdout
  out=backend('upload',token,lead_id=fields['lead_id'],visit_id=fields['visit_id'],token=fields['token'],consent=True,pdf_base64=base64.b64encode(safe).decode(),original_filename=filename);status='200 OK'
 except PermissionError as e:status='403 Forbidden';out={'error':str(e)}
 except (ValueError,KeyError,subprocess.SubprocessError):pass
 except Exception:status='503 Service Unavailable';out={'error':'Documentverwerker tijdelijk niet beschikbaar.'}
 body=json.dumps(out).encode();start_response(status,[('Content-Type','application/json'),('Cache-Control','no-store'),('X-Content-Type-Options','nosniff'),('Content-Length',str(len(body)))]+cors);return [body]
