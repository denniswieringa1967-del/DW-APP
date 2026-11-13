package nl.dwmarketing.callerid;
import java.util.*;
public final class PhoneMatch {
 private PhoneMatch(){}
 public static String normalize(String input){
  if(input==null)return null;String s=input.trim();if(s.length()>40||!s.matches("\\+?[\\d\\s().-]+"))return null;
  s=s.replaceAll("[\\s().-]","");if(s.startsWith("0031"))s="+31"+s.substring(4);else if(s.matches("0[1-9]\\d{8}"))s="+31"+s.substring(1);
  return s.matches("\\+31[1-9]\\d{8}")?s:null;
 }
}
