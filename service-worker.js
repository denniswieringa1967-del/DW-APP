const CACHE='dw-app-live-v1';
const ASSETS=['./','./index.html','./styles.css','./config.js','./data-service.js','./scans.js','./production-adapter.js','./app.js','./dw-logo.png','./manifest.webmanifest','./field-login.html','./medewerker-login.html','./beheer-login.html','./field-activate.html'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
