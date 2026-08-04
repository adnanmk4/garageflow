const CACHE_NAME = "garageflow-shell-v1";
const SHELL_ASSETS = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {
      // Best-effort: if a shell asset is briefly unreachable at install time,
      // don't block installation — the offline fallback simply won't be
      // pre-warmed until the next successful install.
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Deliberately narrow scope: only intercept full-page navigations to show
// an offline fallback when the network is down. Everything else (API
// calls, RSC data, static assets) goes straight to the network — this app
// deals in live financial data, so silently serving a cached/stale
// response for anything dynamic is worse than a visible network error.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match("/offline").then((res) => res || Response.error()))
  );
});
