// DW APP cache worker 2026-10-02 v5.13.10
const CACHE='dw-app-live-v5-13-12-private-cache';
const ASSETS=[
  './','./index.html','./styles.css','./config.js','./data-service.js',
  './business-lookup.js','./campaign-routing.js','./energy-documents.js','./field-document-client.js','./scans.js','./production-adapter.js','./app.js','./dw-logo.png','./dw-master-logo.jpg','./dw-app-icon.svg',
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
  const request=event.request,url=new URL(request.url);
  // Cache only exact public app assets. Never cache runtime config, authenticated API data or documents.
  const assets=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
  if(request.method!=='GET'||request.headers.has('Authorization')||url.origin!==self.location.origin||url.search||!assets.has(url.href))return;
  event.respondWith(
    fetch(event.request)
      .then(response=>{
        if(response.status===200&&!response.redirected&&response.type==='basic'&&!/no-store|private/i.test(response.headers.get('Cache-Control')||'')){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});

