import nl.dwmarketing.callerid.PhoneMatch;
public final class PhoneMatchProbe {
 public static void main(String[] args){int n=0;for(String v:new String[]{"0612345678","+31612345678","0031612345678","(06) 1234-5678"}){if(!"+31612345678".equals(PhoneMatch.normalize(v)))throw new AssertionError(v);n++;}for(String v:new String[]{"","0000000000","06123","+32612345678","0612345678 ext 9","anonymous","+316123456789","0031(0)612345678"}){if(PhoneMatch.normalize(v)!=null)throw new AssertionError(v);n++;}System.out.println(n+" native Java normalisatiecontroles geslaagd");}
}
