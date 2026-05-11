const CACHE_VERSION = 'v25';
const SHELL_CACHE = `cubetto-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `cubetto-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/app.css',
  './styles/character.css',
  './js/core/app-loader.js',
  './js/core/sw-register.js',
  './js/core/debug-tools.js',
  './js/core/audio-manager.js',
  './js/core/settings-panel.js',
  './js/core/game.js',
  './js/core/character/character-renderer.js',
  './js/editor/solver.js',
  './js/editor/level-editor.js',
  './js/editor/level-storage.js',
  './js/levels/level1.js',
  './data/editor-levels.json',
  './assets/animations/characters/registry.json',
  './assets/animations/characters/boks_green/manifest.js',
  './assets/animations/characters/boks_city/manifest.js',
  './assets/animations/characters/boks_yellow/manifest.js',
  './assets/animations/characters/boks_red/manifest.js',
  './assets/animations/characters/boks_blu/manifest.js',
  './assets/ui/brand/boks-logo.svg',
  './assets/audio/music/game_loop_main.mp3',
  './assets/audio/music/level_01_intro_main.ogg',
  './assets/audio/sfx/gameplay/step_move_02.mp3',
  './assets/audio/sfx/gameplay/effort.mp3',
  './assets/audio/sfx/gameplay/error_action.mp3',
  './assets/audio/sfx/gameplay/rotation_position.mp3',
  './assets/audio/sfx/gameplay/rotation_position_02.mp3',
  './assets/audio/sfx/gameplay/bubble_pop_main.ogg',
  './assets/audio/sfx/gameplay/goal_bubble_bounce.ogg',
  './assets/audio/sfx/gameplay/level_complete_main.mp3',
  './assets/audio/sfx/gameplay/wellcome.mp3',
  './assets/ui/grids/grid_01.png',
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
    const cached = await matchCached(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await matchCached(fallbackUrl);
      if (fallback) return fallback;
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });
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

function matchCached(requestOrUrl) {
  return caches.match(requestOrUrl, { ignoreSearch: true });
}
