// sw.js — MyBFF Donation Tracker Service Worker
// v5.3-DEV — iOS-optimized: HTML always network-first, never cached
// Changing CACHE_VERSION forces all clients to drop old caches.
const CACHE_VERSION = "mybff-v5.3-DEV-Apr18-2026-1714";
const CACHE_NAME = `mybff-cache-${CACHE_VERSION}`;

// Install: activate immediately
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(() => {}));
});

// Activate: delete ALL old caches immediately, then claim all clients
// Critical for iOS — old SW caches are purged synchronously
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// HTML → ALWAYS network, never cache (iOS fix for stale PWA pages)
// Other → cache-first with network fallback
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const isHTML = url.pathname.endsWith(".html") || url.pathname === "/";
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return;

  if (isHTML) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
