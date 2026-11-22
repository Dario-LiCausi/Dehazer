// App shell cache. Network first for the page so updates arrive; cache when offline.
const CACHE = 'dehazer-v0.2.0';
const SHELL = ['./', 'index.html', 'icon.svg', 'manifest.webmanifest', 'src/tokens.css', 'src/app.css', 'src/main.js',
  'src/ui.js', 'src/store.js', 'src/messages.js', 'src/markdown.js', 'src/backup.js', 'src/idb-backend.js',
  'src/paste.js', 'src/settings.js', 'src/whatsnew.js',
  'fonts/atkinson-hyperlegible-latin-400-normal.woff2', 'fonts/atkinson-hyperlegible-latin-700-normal.woff2'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request)));
});
