// Sun Clock Service Worker
// Strategy:
// - Network-first for navigation/HTML (prevents old versions sticking)
// - Cache-first for static assets (fast + offline-friendly)

const CACHE_VERSION = "v2026-01-14a"; // <-- bump this anytime you deploy
const CACHE_NAME = `sunclock-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "./",               // site root (for GH Pages subpath)
  "./index.html",
  "./manifest.json",
  "./icons/sunclock-192.png",
  "./icons/sunclock-512.png",
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("sunclock-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Network-first for navigations (HTML shell)
  // This is the most important fix to stop "old build comes back"
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Update cached index on successful load
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return res;
        })
        .catch(() =>
          caches.match("./index.html").then((cached) => cached || caches.match("./"))
        )
    );
    return;
  }

  // For same-origin static assets: cache-first, then network fallback
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req).then((res) => {
          // Cache successful responses (basic/opaque are fine for same-origin)
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
  }
});
