package nl.dwmarketing.callerid;
public class DossierLinkProbe {
 public static void main(String[] args)throws Exception{
  String id="123e4567-e89b-42d3-a456-426614174000",root="https://dw-marketing.nl/flow/app.html";
  String result=DossierLink.build(root,id);
  if(!result.equals(root+"?view=leads&lead="+id))throw new AssertionError(result);
  String fresh=DossierLink.fresh(root,id,123456789L);
  if(!fresh.equals(result+"&caller=android-04&open=123456789"))throw new AssertionError(fresh);
  if(fresh.equals(DossierLink.fresh(root,id,123456790L)))throw new AssertionError("Address reused");
  try{DossierLink.fresh(root,id,0);throw new AssertionError("Invalid time accepted");}catch(IllegalArgumentException expected){}
  for(String bad:new String[]{"https://other.invalid/flow/app.html","http://dw-marketing.nl/flow/app.html","https://dw-marketing.nl.evil.invalid/flow/app.html","https://user@dw-marketing.nl/flow/app.html","https://dw-marketing.nl/flow/app.html?token=TEST","https://dw-marketing.nl/flow/app.html#TEST","https://dw-marketing.nl:444/flow/app.html","https://dw-marketing.nl/flow/login.html"}){
   try{DossierLink.build(bad,id);throw new AssertionError(bad);}catch(IllegalArgumentException expected){}
  }
  for(String bad:new String[]{"",null,"---","123e4567-e89b-42d3-a456-426614174000&lead=other"}){
   try{DossierLink.build(root,bad);throw new AssertionError("ID accepted");}catch(IllegalArgumentException expected){}
  }
  System.out.println("16 dossier-link checks passed");
 }
}
