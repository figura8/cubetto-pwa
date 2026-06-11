const CACHE_VERSION = 'v35';
const SHELL_CACHE = `cubetto-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `cubetto-runtime-${CACHE_VERSION}`;
const FONTS_CACHE = `cubetto-fonts-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/app.css',
  './styles/character.css',
  './styles/tutorial.css',
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
  './js/tutorial/tutorial-data.js',
  './js/tutorial/tutorial-engine.js',
  './js/levels/level1.js',
  './data/editor-levels.json',
  './assets/animations/characters/registry.json',
  './assets/animations/characters/boks_green/manifest.js',
  './assets/animations/characters/boks_city/manifest.js',
  './assets/animations/characters/boks_yellow/manifest.js',
  './assets/animations/characters/boks_red/manifest.js',
  './assets/animations/characters/boks_blu/manifest.js',
  './assets/ui/brand/boks-logo.svg',
  './assets/ui/settings/tablet.svg',
  './assets/ui/settings/pinch.svg',
  './assets/audio/music/game_loop_main.mp3',
  './assets/audio/music/level_01_intro_main.ogg',
  './assets/audio/sfx/ui/block_detach.ogg',
  './assets/audio/sfx/ui/block_drop_success.mp3',
  './assets/audio/sfx/ui/slot_hover.mp3',
  './assets/audio/sfx/ui/play_press_main.mp3',
  './assets/audio/sfx/gameplay/boks_annoyed.ogg',
  './assets/audio/sfx/gameplay/decor_rubber_tap_01.ogg',
  './assets/audio/sfx/gameplay/decor_rubber_tap_02.ogg',
  './assets/audio/sfx/gameplay/step_move_02.mp3',
  './assets/audio/sfx/gameplay/effort.mp3',
  './assets/audio/sfx/gameplay/error_action.mp3',
  './assets/audio/sfx/gameplay/rotation_position.mp3',
  './assets/audio/sfx/gameplay/rotation_position_02.mp3',
  './assets/audio/sfx/gameplay/bubble_pop_main.ogg',
  './assets/audio/sfx/gameplay/goal_bubble_bounce.ogg',
  './assets/audio/sfx/gameplay/level_complete_main.mp3',
  './assets/audio/sfx/gameplay/entrance_boks.mp3',
  './assets/audio/sfx/gameplay/reveal_bubble_01.mp3',
  './assets/audio/sfx/gameplay/element_reveal.mp3',
  './assets/audio/sfx/gameplay/play_reveal.mp3',
  './assets/audio/sfx/gameplay/wellcome.mp3',
  './assets/audio/sfx/gameplay/01_but_if.mp3',
  './assets/audio/sfx/gameplay/01_hello_and_welcome.mp3',
  './assets/audio/sfx/gameplay/01_its_called_a_sequence.mp3',
  './assets/audio/sfx/gameplay/01_its_play.mp3',
  './assets/audio/sfx/gameplay/01_now_you_know.mp3',
  './assets/audio/sfx/gameplay/01_now.mp3',
  './assets/audio/sfx/gameplay/01_ok_now_boks.mp3',
  './assets/audio/sfx/gameplay/02_but_to_get.mp3',
  './assets/audio/sfx/gameplay/02_but.mp3',
  './assets/audio/sfx/gameplay/02_let_place.mp3',
  './assets/audio/sfx/gameplay/02_play_is_a_button.mp3',
  './assets/audio/sfx/gameplay/02_this_green_meadow_is_a.mp3',
  './assets/audio/sfx/gameplay/02_try_to_put_in_here.mp3',
  './assets/audio/sfx/gameplay/02_we_need_aother.mp3',
  './assets/audio/sfx/gameplay/03_a_function_is.mp3',
  './assets/audio/sfx/gameplay/03_and_the_little_bubble.mp3',
  './assets/audio/sfx/gameplay/03_come_on_click_on_play.mp3',
  './assets/audio/sfx/gameplay/03_here_you_are.mp3',
  './assets/audio/sfx/gameplay/03_narration.mp3',
  './assets/audio/sfx/gameplay/03_ok_try.mp3',
  './assets/audio/sfx/gameplay/03_we_need.mp3',
  './assets/audio/sfx/gameplay/04_cool.mp3',
  './assets/audio/sfx/gameplay/04_great.mp3',
  './assets/audio/sfx/gameplay/04_so_instead.mp3',
  './assets/audio/sfx/gameplay/04_this_little_green_piece.mp3',
  './assets/audio/sfx/gameplay/04_use_all_the_commands.mp3',
  './assets/audio/sfx/gameplay/04_we_put.mp3',
  './assets/audio/sfx/gameplay/05_first.mp3',
  './assets/audio/sfx/gameplay/05_now_lets_see_in_action.mp3',
  './assets/audio/sfx/gameplay/05_now_thanks_to_you.mp3',
  './assets/audio/sfx/gameplay/05_try_clicking.mp3',
  './assets/audio/sfx/gameplay/06_and_then.mp3',
  './assets/audio/sfx/gameplay/06_good.mp3',
  './assets/audio/sfx/gameplay/06_nope.mp3',
  './assets/audio/sfx/gameplay/07_lets_add_anothe_brick.mp3',
  './assets/audio/sfx/gameplay/07_ok_great.mp3',
  './assets/audio/sfx/gameplay/07_we_need.mp3',
  './assets/audio/sfx/gameplay/08_ok_here_it_sis.mp3',
  './assets/audio/sfx/gameplay/11_great.mp3',
  './assets/audio/sfx/gameplay/now_you_know_how.mp3',
  './assets/audio/sfx/gameplay/tutorial_21_But_do_we_see_in_action.mp3',
  './assets/audio/sfx/gameplay/tutorial_22_we_need_this.mp3',
  './assets/audio/sfx/gameplay/tutorial_32_great.mp3',
  './assets/audio/sfx/gameplay/tutorial_38_ok_click_play.mp3',
  './assets/fonts/LilitaOne-Regular.ttf',
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
      .filter(key => key !== SHELL_CACHE && key !== RUNTIME_CACHE && key !== FONTS_CACHE)
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

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirstCrossOrigin(request, FONTS_CACHE));
    return;
  }

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
    if (request.headers.has('range')) {
      event.respondWith(rangeAwareResponse(request, RUNTIME_CACHE));
      return;
    }
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }
});

// Audio/video elements (especially Chrome on Android) issue requests with a
// `Range:` header. A plain cached 200 response is rejected for a Range request,
// so offline media playback fails. When we already hold the full asset in the
// cache, slice out the requested byte range and answer with a 206 ourselves.
async function rangeAwareResponse(request, cacheName) {
  const cached = await matchCached(request);
  if (!cached) {
    // Not cached yet: go to the network and let the server handle the range.
    try {
      return await fetch(request);
    } catch (_err) {
      return staleWhileRevalidate(stripSearch(request), cacheName);
    }
  }

  const rangeHeader = request.headers.get('range') || '';
  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  const buffer = await cached.arrayBuffer();
  const total = buffer.byteLength;

  if (!match) {
    return new Response(buffer, {
      status: 200,
      headers: cached.headers
    });
  }

  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : total - 1;
  if (start >= total || start > end) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}` }
    });
  }

  const clampedEnd = Math.min(end, total - 1);
  const slice = buffer.slice(start, clampedEnd + 1);
  const headers = new Headers(cached.headers);
  headers.set('Content-Range', `bytes ${start}-${clampedEnd}/${total}`);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Length', String(slice.byteLength));

  return new Response(slice, { status: 206, statusText: 'Partial Content', headers });
}

function stripSearch(request) {
  const url = new URL(request.url);
  url.search = '';
  return new Request(url.toString(), { headers: request.headers });
}

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
  // Store under the search-stripped URL so the cache key matches the precache
  // entries (which have no `?v=build`) and we don't accumulate one duplicate
  // copy per build.
  const cacheKey = stripSearch(request);
  const fetchPromise = fetch(request)
    .then(response => {
      if (isCacheableResponse(response)) {
        cache.put(cacheKey, response.clone());
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

async function cacheFirstCrossOrigin(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    return Response.error();
  }
}
