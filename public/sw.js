const CACHE='heart-connect-shell-v10';
const SHELL=['/','/manifest.webmanifest','/hc-icon.svg','/robots.txt','/sitemap.xml','/llms.txt'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key.startsWith('heart-connect-shell-')).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);

  if(request.method!=='GET'||url.origin!==location.origin)return;

  // Never cache or serve secure/admin/API traffic through the public PWA shell.
  if(url.pathname.startsWith('/admin')||url.pathname.startsWith('/api/')||url.pathname.includes('__appdeploy'))return;

  // Only the public root navigation is kept as an offline shell.
  if(request.mode==='navigate'){
    if(url.pathname!=='/')return;
    event.respondWith(
      fetch(request)
        .then(response=>{
          if(response.ok){
            const copy=response.clone();
            caches.open(CACHE).then(cache=>cache.put('/',copy));
          }
          return response;
        })
        .catch(()=>caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok&&['script','style','image','font'].includes(request.destination)){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
      }
      return response;
    }))
  );
});
