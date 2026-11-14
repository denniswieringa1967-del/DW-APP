package nl.dwmarketing.callerid;
import java.net.URI;
final class DossierLink {
 static String build(String configured,String id)throws Exception{
  if(id==null||!id.matches("[a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}"))throw new IllegalArgumentException("Ongeldig dossier");
  URI root=new URI(configured);
  if(!"https".equals(root.getScheme())||!"dw-marketing.nl".equals(root.getHost())||root.getPort()!=-1||root.getUserInfo()!=null||!"/flow/app.html".equals(root.getPath())||root.getRawQuery()!=null||root.getRawFragment()!=null)throw new IllegalArgumentException("Dossierroute niet bevestigd");
  return new URI("https","dw-marketing.nl","/flow/app.html","view=leads&lead="+id,null).toASCIIString();
 }
}
