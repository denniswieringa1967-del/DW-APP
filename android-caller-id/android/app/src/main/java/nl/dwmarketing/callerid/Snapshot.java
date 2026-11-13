package nl.dwmarketing.callerid;
import android.content.Context;import org.json.*;import java.util.*;
final class Snapshot {
 static JSONArray match(Context c,String raw)throws Exception{
  String phone=PhoneMatch.normalize(raw);JSONArray out=new JSONArray();if(phone==null)return out;JSONObject s=PrivateStore.get(c,"snapshot");if(s==null||s.optInt("version")!=1||s.optLong("expires_at")<=System.currentTimeMillis())return out;
  JSONArray rows=s.getJSONArray("records"),inactive=new JSONArray();for(int i=0;i<rows.length();i++){JSONObject r=rows.getJSONObject(i);if(phone.equals(r.optString("phone"))){if(r.optBoolean("active"))out.put(r);else inactive.put(r);}}
  return out.length()>0?out:inactive;
 }
 static String badges(JSONArray rows)throws JSONException{Set<String> values=new LinkedHashSet<>();for(int i=0;i<rows.length();i++){JSONArray a=rows.getJSONObject(i).optJSONArray("categories");if(a!=null)for(int j=0;j<a.length();j++)values.add(a.getString(j));}return String.join(" + ",values);}
}
