"""Generate public browser config from deployment environment, never server secrets. No deployment."""
import os,json,base64,re,argparse
from urllib.parse import urlsplit
from pathlib import Path

def configuration(env):
 url=env.get('DW_SUPABASE_URL','').rstrip('/');key=env.get('DW_SUPABASE_PUBLISHABLE_KEY','')
 u=urlsplit(url)
 if u.scheme!='https' or not re.fullmatch(r'[a-z0-9]+\.supabase\.co',u.netloc) or u.path or u.query or u.fragment:raise ValueError('Valid Supabase HTTPS project URL required.')
 if not re.fullmatch(r'sb_publishable_[A-Za-z0-9_-]{12,}',key):
  try:
   parts=key.split('.');claims=json.loads(base64.urlsafe_b64decode(parts[1]+'='*(-len(parts[1])%4)))
   if len(parts)!=3 or claims.get('role')!='anon':raise ValueError()
  except Exception:raise ValueError('Only a publishable key or legacy anon JWT may be sent to a browser.') from None
 mode=env.get('DW_INTEGRATION_MODE','check')
 if mode not in ('check','pilot','live'):raise ValueError('Invalid integration mode.')
 gateway=env.get('DW_DOCUMENT_GATEWAY','')
 if gateway:
  g=urlsplit(gateway)
  if g.scheme!='https' or g.netloc!='dw-marketing.nl' or not g.path.startswith('/api/') or g.query or g.fragment:raise ValueError('Only the owned DW HTTPS document endpoint is permitted.')
 if mode in ('pilot','live') and not gateway:raise ValueError('Protected document gateway required before enabling server writes.')
 return {'integrationMode':mode,'supabaseUrl':url,'supabasePublishableKey':key,'campaignIntakeFunction':'dw-field-visit','documentGatewayBase':gateway}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
 try:config=configuration(os.environ)
 except ValueError as e:parser.exit(2,str(e)+'\n')
 out=Path(args.output)
 if out.name!='runtime-config.js':parser.exit(2,'Output must be runtime-config.js (ignored by Git).\n')
 out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text('// Public browser configuration; generated outside source control.\nwindow.DW_RUNTIME_CONFIG='+json.dumps(config,ensure_ascii=True).replace('<','\\u003c')+';\n')
 print('Runtime configuration generated; no values logged. Nothing deployed.')
