// Deliberately minimal — just enough to satisfy PWA installability (a
// registered service worker with a fetch handler) and give navigation a
// graceful offline fallback, without caching app JS/CSS/data. This app
// deploys frequently; aggressively caching build assets risks serving a
// stale build after a deploy (the same "stuck in an old state with no
// visible indicator" problem the reverted light-mode toggle caused — see
// CLAUDE.md). Network-first, cache only the one static offline page.
const CACHE_NAME = "tiera-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});
