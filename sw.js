
const CACHE = 'sunclock-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/app-icon-192.png',
  './icons/app-icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(resp => {
      if (e.request.method === 'GET') {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, copy));
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
