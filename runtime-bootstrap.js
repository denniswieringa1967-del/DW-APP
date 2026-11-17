/* Reuse the existing owned public browser configuration at runtime; no keys in Git. */
(()=>{
 const current=window.DW_CONFIG||{};let valid=false;
 try{const key=current.supabaseAnonKey||'';valid=current.supabaseUrl==='https://bsqfobdjzszompyvgxxk.supabase.co'&&(/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)||JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon');}catch{}
 window.DW_RUNTIME_CONFIG=Object.freeze({integrationMode:valid?'live':'check',supabaseUrl:valid?current.supabaseUrl:'',supabasePublishableKey:valid?current.supabaseAnonKey:'',campaignIntakeFunction:valid?'dw-field-visit':'',documentGatewayBase:valid?'https://dw-marketing.nl/api/dw-field-document-upload-v2.php':''});
})();
