// CoachMe — Muay Thai service worker
// Bump CACHE_VERSION whenever index.html (or any cached asset) changes
// so returning users get the update instead of a stale cached copy.
const CACHE_VERSION = 'coachme-v2';
const ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './screenshots/home.png',
  './screenshots/timer.png',
  './screenshots/combos.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first, falling back to network, with a background refresh.
// If both cache and network fail, serve offline.html for navigation requests.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
          return new Response('Offline', { status: 503 });
        });
      return cached || networkFetch;
    })
  );
});
