/* PWA Snake service worker (offline-first) */
const VERSION = 'snake-v1.0.0';
const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/game.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('app-shell-' + VERSION).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => { if (!k.endsWith(VERSION)) return caches.delete(k); }));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // nav requests -> network first
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open('pages-'+VERSION);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open('pages-'+VERSION);
        return (await cache.match(req)) || (await caches.match('/index.html'));
      }
    })());
    return;
  }
  // cache-first for shell
  if (APP_SHELL.includes(new URL(req.url).pathname)) {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
    return;
  }
  // fallback: try cache then network
  event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
