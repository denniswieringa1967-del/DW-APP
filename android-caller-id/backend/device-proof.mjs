export async function verifyDeviceProof({owner,device,userId,time,nonce,signature,now=Date.now()}){
 if(!owner||!device||userId!==owner||!/^\d{13}$/.test(time)||Math.abs(now-Number(time))>30000||!/^[a-f0-9-]{36}$/i.test(nonce)||!signature||signature.length>1000)return false;
 try{const bytes=v=>Uint8Array.from(atob(v),c=>c.charCodeAt(0));const key=await crypto.subtle.importKey('spki',bytes(device),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(signature),new TextEncoder().encode('DW-CALLER-SYNC\n'+time+'\n'+nonce));}catch{return false;}
}
