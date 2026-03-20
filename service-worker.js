// "dev" = network-first (testing fast updates), "prod" = cache-first (better offline).
const SW_MODE = "dev";
const CACHE_VERSION = "v5";
const CACHE_NAME = `cubetto-${SW_MODE}-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/boks-apple-touch-icon.png",
  "./icons/favicon.png"
];

self.addEventListener("install", event => {
  if (SW_MODE === "prod") {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)));
  }
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  if (SW_MODE === "dev") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.status === 200 && request.url.startsWith(self.location.origin)) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  } catch (_err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      return caches.match("./index.html");
    }
    return Response.error();
  }
}

async function cacheFirst(request) {
  if (request.mode === "navigate") {
    try {
      const response = await fetch(request);
      return response;
    } catch (_err) {
      return caches.match("./index.html");
    }
  }

  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.status === 200 && request.url.startsWith(self.location.origin)) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
  }
  return response;
}
