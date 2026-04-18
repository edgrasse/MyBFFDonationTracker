// sw.js — MyBFF Donation Tracker Service Worker
// Cache version matches BUILD_VERSION in the HTML file.
// Changing this string forces all clients to discard old cache
// and fetch fresh files — no hard refresh needed.
const CACHE_VERSION = "mybff-v5.2-DEV-Apr18-2026-1524";
const CACHE_NAME = `mybff-cache-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./MyBFF_Donation_Tracker_DEV.html",
  "./MyBFF_Donation_Tracker_v2.html"
];

// Install: cache key files
self.addEventListener("install", event => {
  self.skipWaiting(); // activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
});

// Activate: delete all old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML (ensures latest version),
// cache-first for everything else
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const isHtml = url.pathname.endsWith(".html") || url.pathname === "/";

  if (isHtml) {
    // Network first — fall back to cache if offline
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache first for assets (fonts, icons, etc.)
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
