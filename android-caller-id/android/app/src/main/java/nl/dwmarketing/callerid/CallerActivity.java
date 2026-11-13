package nl.dwmarketing.callerid;
import android.app.*;import android.os.*;import android.content.*;import android.net.Uri;import android.view.*;import android.widget.*;import org.json.*;
public final class CallerActivity extends Activity {
 @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,WindowManager.LayoutParams.FLAG_SECURE);LinearLayout box=new LinearLayout(this);box.setOrientation(LinearLayout.VERTICAL);box.setPadding(32,48,32,32);ScrollView scroller=new ScrollView(this);scroller.addView(box);setContentView(scroller);
  try{JSONArray rows=Snapshot.match(this,getIntent().getStringExtra("phone"));if(rows.length()==0){text(box,"Geen actuele klantmatch. Synchroniseer DW Nummerherkenning.");return;}
   text(box,Snapshot.badges(rows));if(rows.length()>1)text(box,"Dit nummer hoort bij meerdere dossiers. Kies het juiste traject.");
   JSONObject snapshot=PrivateStore.get(this,"snapshot");text(box,"Status bijgewerkt: "+java.text.DateFormat.getDateTimeInstance().format(new java.util.Date(snapshot.getLong("synced_at"))));
   for(int i=0;i<rows.length();i++){JSONObject r=rows.getJSONObject(i);text(box,r.optString("contact_name")+"\n"+r.optString("company")+"\n"+r.optString("campaign")+"\n"+r.optString("status"));Button b=new Button(this);b.setMinHeight(56);b.setText("Open klant in DW APP");String id=r.getString("lead_id");b.setOnClickListener(v->open(id));box.addView(b);}
   text(box,"Een herkend nummer bewijst niet wie er belt. Controleer de identiteit voordat je gevoelige informatie bespreekt.");
  }catch(Exception e){text(box,"Klantinformatie niet beschikbaar.");}
 }
 private void open(String id){try{Uri root=Uri.parse(BuildConfig.DOSSIER_URL);if(!id.matches("[a-fA-F0-9-]{36}")||!"https".equals(root.getScheme())||!"dw-marketing.nl".equals(root.getHost())||root.getUserInfo()!=null)throw new Exception();Uri target=root.buildUpon().appendQueryParameter("lead",id).build();startActivity(new Intent(Intent.ACTION_VIEW,target));}catch(Exception e){Toast.makeText(this,"Beveiligde dossierlink moet nog worden aangesloten.",Toast.LENGTH_LONG).show();}}
 private void text(LinearLayout box,String value){TextView t=new TextView(this);t.setText(value);t.setTextSize(18);t.setPadding(0,12,0,12);box.addView(t);}
}
