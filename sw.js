// Simple cache-first service worker for Sun Clock

const CACHE_NAME = "sunclock-v1";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./Sun clock.html",
  "./manifest.json",
  "./icons/sunclock-192.png",
  "./icons/sunclock-512.png"
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[sw] Cache addAll error:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, then network fallback
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        // Optionally put a clone in cache
        const respClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, respClone);
        });
        return response;
      }).catch(() => {
        // Optional: return a fallback page or nothing
        return new Response("Offline", {
          status: 503,
          statusText: "Offline"
        });
      });
    })
  );
});
