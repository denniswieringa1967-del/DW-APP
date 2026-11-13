package nl.dwmarketing.callerid;
import android.telecom.*;import android.app.*;import android.content.*;import android.Manifest;import android.content.pm.PackageManager;import android.os.Build;import org.json.*;
public final class DwScreeningService extends CallScreeningService {
 static final String CHANNEL="dw-caller-private";static final int NOTICE=412;
 @Override public void onScreenCall(Call.Details details){
  if(details.getCallDirection()!=Call.Details.DIRECTION_INCOMING)return;
  // Always allow immediately, even if cache/decryption/UI fails. Never intercept audio or record calls.
  respondToCall(details,new CallResponse.Builder().setDisallowCall(false).setRejectCall(false).setSilenceCall(false).setSkipCallLog(false).setSkipNotification(false).build());
  NotificationManager manager=getSystemService(NotificationManager.class);manager.cancel(NOTICE);
  try{
   if(details.getHandle()==null||!"tel".equals(details.getHandle().getScheme()))return;
   String phone=PhoneMatch.normalize(details.getHandle().getSchemeSpecificPart());if(phone==null)return;
   JSONArray matches=Snapshot.match(this,phone);if(matches.length()==0)return;
   if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
   NotificationChannel channel=new NotificationChannel(CHANNEL,"DW klant bij inkomende oproep",NotificationManager.IMPORTANCE_HIGH);channel.setLockscreenVisibility(Notification.VISIBILITY_SECRET);channel.setSound(null,null);manager.createNotificationChannel(channel);
   JSONObject first=matches.getJSONObject(0);String title=matches.length()>1?"Meerdere DW trajecten bij dit nummer":first.optString("contact_name")+" · "+first.optString("company");
   String text=Snapshot.badges(matches)+(matches.length()>1?" · Kies het juiste dossier":" · "+first.optString("status"));
   Intent detail=new Intent(this,CallerActivity.class).putExtra("phone",phone);
   PendingIntent open=PendingIntent.getActivity(this,NOTICE,detail,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
   manager.notify(NOTICE,new Notification.Builder(this,CHANNEL).setSmallIcon(android.R.drawable.sym_call_incoming).setContentTitle(title).setContentText(text).setStyle(new Notification.BigTextStyle().bigText(text)).setVisibility(Notification.VISIBILITY_SECRET).setContentIntent(open).setAutoCancel(true).setTimeoutAfter(600000).addAction(new Notification.Action.Builder(null,"Open klant in DW APP",open).build()).build());
  }catch(Exception ignored){ /* No phone numbers or contact data in logs. */ }
 }
}
