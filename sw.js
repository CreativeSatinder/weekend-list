// Offline support: cache the app shell, serve it cache-first, refresh in the background.
// Bump VERSION whenever you change any file so phones pick up the update.
const VERSION = 'weekend-v5';
const SHELL = [
  './',
  'index.html',
  'styles.css',
  'config.js',
  'app.js',
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];
// Firebase SDK files are cached too, so family sharing starts up with no signal.
const CACHEABLE_HOSTS = [location.host, 'www.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Leave live traffic (Firestore, sign-in) alone.
  if (!CACHEABLE_HOSTS.includes(new URL(e.request.url).host)) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
