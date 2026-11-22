/* NEXORA Rebuild v2 — versioned PWA cache */
const CACHE = "nexora-rebuild-v2.1-flow-20261122";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/nexora.css",
  "./assets/nexora.js",
  "./icon-192.png",
  "./icon-512.png",
  "./nexora-home-scene.jpg",
  "./nexora-home-scene.png",
  "./nexora-discipline-scene.png",
  "./nexora-study-scene.png",
  "./nexora-mindful-scene.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .catch(error => console.warn("NEXORA core cache could not be fully populated:", error))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("nexora-") && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  const isDocument = request.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/");
  if (isDocument) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
