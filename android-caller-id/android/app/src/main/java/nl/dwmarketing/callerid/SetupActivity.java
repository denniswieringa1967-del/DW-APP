package nl.dwmarketing.callerid;
import android.app.*;import android.app.role.*;import android.os.*;import android.Manifest;import android.content.*;import android.content.pm.PackageManager;import android.text.InputType;import android.view.*;import android.widget.*;
public final class SetupActivity extends Activity {
 private TextView status;private EditText email,password;
 @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,WindowManager.LayoutParams.FLAG_SECURE);LinearLayout box=new LinearLayout(this);box.setOrientation(LinearLayout.VERTICAL);box.setPadding(32,48,32,32);ScrollView scroll=new ScrollView(this);scroll.addView(box);setContentView(scroll);
  label(box,"DW Nummerherkenning · alleen Dennis");label(box,"Behoud Samsung Telefoon. Deze app toont uitsluitend herkenning uit je eigen DW Flow. Er wordt niet geblokkeerd of opgenomen. Geen externe caller-ID-dienst.");
  button(box,"1. Apparaat koppelen: openbare sleutel kopiëren",()->{try{String pub=PrivateStore.publicKey();getSystemService(ClipboardManager.class).setPrimaryClip(ClipData.newPlainText("DW openbare apparaatcode",pub));status.setText("Openbare apparaatcode gekopieerd. Laat uitsluitend dit apparaat aan de eigenaar koppelen voordat je synchroniseert.");}catch(Exception e){status.setText("Apparaatsleutel niet beschikbaar.");}});
  label(box,"Meld je aan met je bestaande DW-account. Alleen het gekoppelde eigenaarsaccount en apparaat kunnen synchroniseren.");email=new EditText(this);email.setHint("DW e-mailadres");email.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);box.addView(email);password=new EditText(this);password.setHint("Wachtwoord");password.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);box.addView(password);
  button(box,"2. Aanmelden en synchroniseren",()->{String mail=email.getText().toString().trim(),pw=password.getText().toString();password.setText("");work(()->{SyncClient.login(this,mail,pw);SyncJob.schedule(this);});});
  button(box,"3. DW als nummerherkenning kiezen",()->{RoleManager manager=getSystemService(RoleManager.class);if(!manager.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)){status.setText("Nummerherkenning niet beschikbaar op dit toestel.");return;}if(!manager.isRoleHeld(RoleManager.ROLE_CALL_SCREENING))startActivityForResult(manager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING),10);else status.setText("DW is al gekozen voor nummerherkenning.");});
  button(box,"4. Meldingen toestaan",()->{if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},11);else status.setText("Controleer dat meldingen voor DW aanstaan.");});
  label(box,"Optioneel: ook nummers herkennen die al in je telefooncontacten staan. Android vereist hiervoor contacttoegang. Onze code leest of uploadt je telefooncontacten niet.");
  button(box,"Herkennen binnen opgeslagen telefooncontacten",()->requestPermissions(new String[]{Manifest.permission.READ_CONTACTS},12));
  button(box,"Nu bijwerken",()->work(()->SyncClient.sync(this)));
  button(box,"Afmelden en lokale klantgegevens wissen",()->work(()->{SyncClient.logout(this);}));
  status=new TextView(this);status.setText("Nog niet geïnstalleerd/getest voor productie. Statusgegevens zijn een momentopname en verlopen na één uur.");box.addView(status);
 }
 interface Job {void run()throws Exception;}
 private void work(Job job){status.setText("Bezig…");new Thread(()->{try{job.run();runOnUiThread(()->status.setText("Gereed. Synchronisatie of afmelding bevestigd."));}catch(Exception e){runOnUiThread(()->status.setText("Niet bevestigd. Controleer koppeling, aanmelden en verbinding. Bestaande leads zijn niet gewijzigd."));}},"dw-setup").start();}
 private void label(LinearLayout box,String value){TextView t=new TextView(this);t.setText(value);t.setTextSize(17);t.setPadding(0,12,0,12);box.addView(t);}
 private void button(LinearLayout box,String value,Runnable action){Button b=new Button(this);b.setText(value);b.setMinHeight(56);b.setOnClickListener(v->action.run());box.addView(b);}
}
