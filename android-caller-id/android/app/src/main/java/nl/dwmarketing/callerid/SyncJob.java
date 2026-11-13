package nl.dwmarketing.callerid;
import android.app.job.*;import android.content.*;
public final class SyncJob extends JobService {
 static final int ID=421;
 static void schedule(Context c){c.getSystemService(JobScheduler.class).schedule(new JobInfo.Builder(ID,new ComponentName(c,SyncJob.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPersisted(true).setPeriodic(15*60*1000).build());}
 @Override public boolean onStartJob(JobParameters p){new Thread(()->{try{SyncClient.sync(this);}catch(Exception ignored){}finally{jobFinished(p,false);}},"dw-private-sync").start();return true;}
 @Override public boolean onStopJob(JobParameters p){return true;}
}
