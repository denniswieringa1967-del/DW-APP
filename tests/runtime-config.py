import unittest,importlib.util,base64,json
from pathlib import Path
spec=importlib.util.spec_from_file_location('runtime',Path(__file__).parents[1]/'tools/build-runtime.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def legacy(role):return '.'.join(['test',base64.urlsafe_b64encode(json.dumps({'role':role}).encode()).decode().rstrip('='),'test'])
class Runtime(unittest.TestCase):
 def env(self,**kw):return {'DW_SUPABASE_URL':'https://example.supabase.co','DW_SUPABASE_PUBLISHABLE_KEY':legacy('anon'),**kw}
 def test_default_no_writes(self):self.assertEqual(m.configuration(self.env())['integrationMode'],'check')
 def test_server_role_rejected(self):
  with self.assertRaises(ValueError):m.configuration(self.env(DW_SUPABASE_PUBLISHABLE_KEY=legacy('service_role')))
 def test_secret_key_rejected(self):
  with self.assertRaises(ValueError):m.configuration(self.env(DW_SUPABASE_PUBLISHABLE_KEY='TEST-secret-value'))
 def test_extra_environment_not_exposed(self):self.assertNotIn('SERVICE_ROLE_KEY',m.configuration(self.env(SERVICE_ROLE_KEY='TEST-private-value')))
 def test_live_requires_gateway(self):
  with self.assertRaises(ValueError):m.configuration(self.env(DW_INTEGRATION_MODE='live'))
 def test_untrusted_gateway_rejected(self):
  with self.assertRaises(ValueError):m.configuration(self.env(DW_DOCUMENT_GATEWAY='https://other.invalid/api/upload'))
 def test_owned_gateway_allowed(self):self.assertEqual(m.configuration(self.env(DW_DOCUMENT_GATEWAY='https://dw-marketing.nl/api/field-document-upload'))['documentGatewayBase'],'https://dw-marketing.nl/api/field-document-upload')
if __name__=='__main__':unittest.main()
