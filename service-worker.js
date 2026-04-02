const CACHE_VERSION = 'v8';
const SHELL_CACHE = `cubetto-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `cubetto-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/boks-apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE, './index.html'));
    return;
  }

  if (url.pathname.endsWith('/data/editor-levels.json')) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  if (isStaticAssetRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }
});

function isStaticAssetRequest(url) {
  return (
    url.pathname.startsWith('/assets/')
    || url.pathname.startsWith('/icons/')
    || url.pathname.startsWith('/js/')
    || url.pathname.startsWith('/styles/')
    || url.pathname.endsWith('.json')
    || url.pathname.endsWith('.svg')
    || url.pathname.endsWith('.png')
    || url.pathname.endsWith('.jpg')
    || url.pathname.endsWith('.jpeg')
    || url.pathname.endsWith('.webp')
    || url.pathname.endsWith('.mp3')
    || url.pathname.endsWith('.ogg')
    || url.pathname.endsWith('.ttf')
    || url.pathname.endsWith('.woff2')
  );
}

async function networkFirst(request, cacheName, fallbackUrl = '') {
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(response => {
      if (isCacheableResponse(response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    fetchPromise.catch(() => null);
    return cached;
  }

  const fresh = await fetchPromise;
  return fresh || Response.error();
}

function isCacheableResponse(response) {
  return !!(response && response.ok && response.type !== 'opaque');
}
