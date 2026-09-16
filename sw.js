/**
 * Pure Pazaak service worker — network-first, update on every open.
 * Online: always prefer the live site. Offline: last successful response if any.
 */
const BUILD_ID = "__PURE_PAZAAK_BUILD_ID__";
const CACHE = `pure-pazaak-shell-${BUILD_ID}`;
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./fonts/Orbitron-latin.woff2",
  "./fonts/StarJedi-latin.woff2",
  "./fonts/ScienceGothic-latin.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("pure-pazaak-") && k !== CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation=req.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname.endsWith('.webmanifest');
  const isStatic=url.pathname.includes('/fonts/')||url.pathname.includes('/icons/');
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(isStatic){
      const cached=await cache.match(req);if(cached)return cached;
    }
    try{
      const fresh=await fetch(req,{cache:'no-store'});
      if(fresh&&fresh.ok&&(isNavigation||isStatic)){
        const key=isNavigation&&req.mode==='navigate'?new URL('./index.html',self.location).href:req;
        cache.put(key,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(_){
      const cached=await cache.match(req);if(cached)return cached;
      if(req.mode==='navigate'){const shell=await cache.match('./index.html');if(shell)return shell;}
      return Response.error();
    }
  })());
});
