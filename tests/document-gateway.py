import importlib.util,io,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('gateway',Path(__file__).parents[1]/'backend/field/document_gateway.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Gateway(unittest.TestCase):
 def env(self,**kw):
  return {'REQUEST_METHOD':'POST','wsgi.url_scheme':'https','HTTP_ORIGIN':'https://example.invalid','HTTP_HOST':'example.invalid','HTTP_AUTHORIZATION':'Bearer owner-session','CONTENT_LENGTH':'1','CONTENT_TYPE':'multipart/form-data; boundary=test','wsgi.input':io.BytesIO(b'x'),**kw}
 def runapp(self,e):
  status=[];body=b''.join(m.application(e,lambda s,h:status.append(s)));return status[0],body
 def test_configured_pages_preflight(self):
  with patch.dict(m.os.environ,{'DW_APP_ORIGIN':'https://example.github.io'}):
   status=[];headers=[]
   body=m.application(self.env(REQUEST_METHOD='OPTIONS',HTTP_ORIGIN='https://example.github.io',HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',HTTP_ACCESS_CONTROL_REQUEST_HEADERS='authorization,content-type'),lambda s,h:(status.append(s),headers.extend(h)))
   self.assertEqual(status,['204 No Content']);self.assertIn(('Access-Control-Allow-Origin','https://example.github.io'),headers);self.assertEqual(body,[b''])
 def test_unconfigured_origin_preflight_denied(self):self.assertEqual(self.runapp(self.env(REQUEST_METHOD='OPTIONS',HTTP_ORIGIN='https://other.github.io',HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST'))[0],'403 Forbidden')
 def test_unknown_preflight_header_denied(self):self.assertEqual(self.runapp(self.env(REQUEST_METHOD='OPTIONS',HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',HTTP_ACCESS_CONTROL_REQUEST_HEADERS='x-secret'))[0],'403 Forbidden')
 def test_cross_origin(self):self.assertEqual(self.runapp(self.env(HTTP_ORIGIN='https://other.invalid'))[0],'403 Forbidden')
 def test_https(self):self.assertEqual(self.runapp(self.env(**{'wsgi.url_scheme':'http'}))[0],'403 Forbidden')
 def test_auth_required(self):self.assertEqual(self.runapp(self.env(HTTP_AUTHORIZATION=''))[0],'403 Forbidden')
 def test_oversized_request(self):
  with patch.object(m,'backend',return_value={'ok':True}):self.assertEqual(self.runapp(self.env(CONTENT_LENGTH=str(10*1024*1024)))[0],'400 Bad Request')
 def test_owner_verified_before_parsing(self):
  with patch.object(m,'backend',side_effect=PermissionError('Denied')):self.assertEqual(self.runapp(self.env())[0],'403 Forbidden')
 def test_independent_owner_and_capability(self):
  # Both values use distinct arguments; neither is written into a source file or stored by the gateway.
  with patch.dict(m.os.environ,{'DW_SUPABASE_URL':'https://example.invalid','DW_DOCUMENT_SANITIZER_SECRET':'TEST-protection'}),patch.object(m.urllib.request,'urlopen') as u:
   u.return_value.__enter__.return_value.read.return_value=b'{"ok":true}'
   self.assertTrue(m.backend('upload','TEST-owner',token='TEST-capability')['ok'])
   req=u.call_args[0][0];self.assertEqual(req.headers['Authorization'],'Bearer TEST-owner');self.assertIn(b'TEST-capability',req.data)
if __name__=='__main__':unittest.main()
