// Sun Clock Service Worker
// - Network-first for navigations (prevents stale app shell)
// - Cache-first for assets (offline + speed)

const CACHE_NAME = "sunclock-v2026-01-14b"; // bump on deploy

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sunclock-192.png",
  "./sunclock-512.png",
  "./sw.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith("sunclock-") && k !== CACHE_NAME)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// Optional but helpful: allow page to force-activate a waiting SW
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Network-first for navigations (HTML)
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);

        // Cache the actual navigation request URL
        cache.put(req, fresh.clone());

        // Also cache index.html as a fallback shell
        cache.put(new Request("./index.html", { cache: "reload" }), fresh.clone());

        return fresh;
      } catch (e) {
        // Try exact navigation URL first, then index.html
        const cachedNav = await caches.match(req);
        return cachedNav || (await caches.match("./index.html"));
      }
    })());
    return;
  }

  // Cache-first for same-origin assets
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      const res = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
      return res;
    })());
  }
});
