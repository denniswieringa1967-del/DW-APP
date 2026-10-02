// DW APP cache worker 2026-10-02 v5.13.9
const CACHE='dw-app-live-v5-13-9';
const ASSETS=[
  './','./index.html','./styles.css','./config.js','./data-service.js',
  './scans.js','./production-adapter.js','./app.js','./dw-logo.png','./dw-master-logo.jpg','./dw-app-icon.svg',
  './manifest.webmanifest','./dw-app-icon.svg','./field-login.html','./medewerker-login.html',
  './beheer-login.html','./field-activate.html','./quick-lead.html'
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
