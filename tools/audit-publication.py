from pathlib import Path
import re,sys,json
root=Path(sys.argv[1] if len(sys.argv)>1 else '.');issues=[]
patterns={'api_value':r'sb_(?:publishable|secret)_[A-Za-z0-9_-]{12,}','jwt_value':r'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}','private_key':r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----','private_email':r'\b[A-Za-z0-9._%+-]+@(?!example\.|bedrijf\.nl|localhost|test\.invalid)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'}
for p in root.rglob('*'):
 if not p.is_file() or '.git' in p.parts:continue
 if p.suffix.lower() in {'.jks','.keystore','.apk','.aab'}:issues.append({'file':str(p.relative_to(root)),'type':'forbidden_binary'});continue
 if p.suffix.lower() not in {'.js','.mjs','.ts','.html','.java','.xml','.gradle','.py','.md','.json','.sql','.cjs'}:continue
 text=p.read_text();text=re.sub(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+','<static-image>',text)
 if 'test' not in str(p.relative_to(root)).lower() and p.name!='audit-publication.py':
  for m in re.finditer(r"['\"][a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}['\"]",text):issues.append({'file':str(p.relative_to(root)),'type':'hardcoded_uuid'})
 if p.name=='audit-publication.py':continue
 for label,pattern in patterns.items():
  for m in re.finditer(pattern,text):issues.append({'file':str(p.relative_to(root)),'line':text[:m.start()].count('\n')+1,'type':label})
print(json.dumps({'passed':not issues,'issues':issues},indent=2));sys.exit(bool(issues))
