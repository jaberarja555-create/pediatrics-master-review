// Offline support: always try the network first (so updates show at once), fall back to the saved copy.
const CACHE = 'prr-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || /^\/(check|activate|sync|api\/|admin|audio\/)/.test(new URL(e.request.url).pathname)) return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});
