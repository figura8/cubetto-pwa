(() => {
  const body = document.body;
  const build = body?.dataset.build || 'dev';
  const badge = document.getElementById('buildBadge');
  const editorEnabled = body?.dataset.editorEnabled !== 'false';
  const debugToolsEnabled = body?.dataset.debugToolsEnabled !== 'false';
  const buildBadgeEnabled = body?.dataset.buildBadgeEnabled !== 'false';
  const perfNow = () => window.performance?.now?.() || Date.now();
  const perfEntries = [];
  const perfMarks = new Map();

  function recordPerf(name, durationMs, detail = {}) {
    const entry = {
      name,
      durationMs: Math.round((Number(durationMs) || 0) * 100) / 100,
      at: Date.now(),
      ...detail
    };
    perfEntries.push(entry);
    if (perfEntries.length > 80) perfEntries.shift();
    return entry;
  }

  function markPerfStart(name) {
    perfMarks.set(name, perfNow());
  }

  function markPerfEnd(name, detail = {}) {
    const startedAt = perfMarks.get(name);
    if (!Number.isFinite(startedAt)) return null;
    perfMarks.delete(name);
    return recordPerf(name, perfNow() - startedAt, detail);
  }

  window.BOKS_RUNTIME_CONFIG = {
    releaseChannel: body?.dataset.releaseChannel || 'main',
    build,
    editorEnabled,
    debugToolsEnabled,
    buildBadgeEnabled,
    lightweightCharacterMode: body?.dataset.lightweightCharacterMode !== 'false',
    perf: {
      entries: perfEntries,
      markStart: markPerfStart,
      markEnd: markPerfEnd,
      record: recordPerf
    }
  };

  body?.classList.toggle('editor-enabled', editorEnabled);
  body?.classList.toggle('editor-disabled', !editorEnabled);
  body?.classList.toggle('debug-tools-enabled', debugToolsEnabled);
  body?.classList.toggle('debug-tools-disabled', !debugToolsEnabled);
  body?.classList.toggle('build-badge-enabled', buildBadgeEnabled);
  body?.classList.toggle('build-badge-disabled', !buildBadgeEnabled);

  function formatBuildStamp(value) {
    const match = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(value);
    if (!match) return null;
    const [, year, month, day, hour, minute, second] = match;
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }

  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('_build') !== build) {
      window.sessionStorage?.setItem('boks-hard-refresh-notice', build);
      url.searchParams.set('_build', build);
      window.location.replace(url.toString());
      return;
    }
  } catch (_err) {
    // ignore URL normalization issues
  }

  const lastSeenBuildKey = 'boks-last-seen-build';
  let buildJustChanged = false;
  try {
    const lastSeenBuild = window.sessionStorage?.getItem(lastSeenBuildKey) || '';
    buildJustChanged = !!lastSeenBuild && lastSeenBuild !== build;
    window.sessionStorage?.setItem(lastSeenBuildKey, build);
  } catch (_err) {
    buildJustChanged = false;
  }

  if (badge && buildBadgeEnabled) {
    const formattedStamp = formatBuildStamp(build);
    badge.innerHTML = formattedStamp
      ? `<strong>BUILD</strong>${build}\n${formattedStamp}\n${window.BOKS_RUNTIME_CONFIG.releaseChannel}`
      : `<strong>BUILD</strong>${build}`;
    badge.classList.toggle('build-fresh', buildJustChanged);
  } else if (badge) {
    badge.textContent = '';
  }

  console.info(`[BOKS] build ${build} (${window.BOKS_RUNTIME_CONFIG.releaseChannel})`);

  const DEFAULT_CHARACTER_MANIFESTS = [
    'assets/animations/characters/boks_green/manifest.js'
  ];
  const CHARACTER_MANIFEST_REGISTRY = 'assets/animations/characters/registry.json';
  const OPTIONAL_LOTTIE_SCRIPT = 'js/vendor/lottie.min.js';
  const LOTTIE_CDN_FALLBACKS = [
    'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js',
    'https://unpkg.com/lottie-web@5.12.2/build/player/lottie.min.js'
  ];
  const EDITOR_SUPPORT_SCRIPTS = [
    'js/editor/solver.js',
    'js/editor/level-editor.js'
  ];
  const CORE_STARTUP_SCRIPTS = [
    'js/core/character/character-renderer.js',
    'js/levels/level1.js',
    'js/editor/level-storage.js',
    'js/core/game.js'
  ];
  let lottieLoadPromise = null;
  let editorSupportPromise = null;

  markPerfStart('bootstrap-total');

  async function loadScript(src) {
    const perfLabel = /^https?:\/\//i.test(src) ? src : src.split('/').slice(-2).join('/');
    markPerfStart(`script:${perfLabel}`);
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const isAbsolute = /^https?:\/\//i.test(src);
      script.src = isAbsolute ? src : `${src}?v=${encodeURIComponent(build)}`;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
    markPerfEnd(`script:${perfLabel}`, { type: 'script', src });
  }

  async function resolveCharacterManifestFiles() {
    try {
      const response = await fetch(`${CHARACTER_MANIFEST_REGISTRY}?v=${encodeURIComponent(build)}`, { cache: 'no-store' });
      if (!response.ok) return DEFAULT_CHARACTER_MANIFESTS;
      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : payload?.manifests;
      if (!Array.isArray(list) || !list.length) return DEFAULT_CHARACTER_MANIFESTS;
      const normalized = list
        .filter(entry => typeof entry === 'string')
        .map(entry => entry.trim())
        .filter(Boolean);
      return normalized.length ? normalized : DEFAULT_CHARACTER_MANIFESTS;
    } catch (_err) {
      return DEFAULT_CHARACTER_MANIFESTS;
    }
  }

  async function loadOptionalLottieRuntime() {
    if (window.BOKS_RUNTIME_CONFIG?.lightweightCharacterMode) return false;
    if (window.lottie) return true;
    if (lottieLoadPromise) return lottieLoadPromise;

    lottieLoadPromise = (async () => {
      markPerfStart('lottie-runtime');
      try {
        await loadScript(OPTIONAL_LOTTIE_SCRIPT);
        if (window.lottie) return true;
      } catch (_err) {
        // continue with CDN fallbacks
      }

      for (const cdnUrl of LOTTIE_CDN_FALLBACKS) {
        try {
          if (window.lottie) return true;
          await loadScript(cdnUrl);
          if (window.lottie) return true;
        } catch (_err) {
          // try next CDN
        }
      }
      return !!window.lottie;
    })()
      .finally(() => {
        window.BOKS_RUNTIME_CONFIG.lottieAvailable = !!window.lottie;
        markPerfEnd('lottie-runtime', { type: 'runtime' });
      });

    return lottieLoadPromise;
  }

  async function ensureEditorSupport() {
    if (!editorEnabled) return false;
    if (editorSupportPromise) return editorSupportPromise;
    editorSupportPromise = (async () => {
      markPerfStart('editor-support');
      for (const file of EDITOR_SUPPORT_SCRIPTS) {
        await loadScript(file);
      }
      markPerfEnd('editor-support', { type: 'editor' });
      return true;
    })();
    return editorSupportPromise;
  }

  async function loadCharacterManifests() {
    markPerfStart('character-manifests');
    const requested = await resolveCharacterManifestFiles();
    const loaded = new Set();

    for (const file of requested) {
      try {
        await loadScript(file);
        loaded.add(file);
      } catch (err) {
        console.warn(`[BOKS] Character manifest failed: ${file}`, err);
      }
    }

    if (loaded.size > 0) return;

    for (const fallbackFile of DEFAULT_CHARACTER_MANIFESTS) {
      if (loaded.has(fallbackFile)) continue;
      try {
        await loadScript(fallbackFile);
        loaded.add(fallbackFile);
      } catch (err) {
        console.warn(`[BOKS] Character fallback manifest failed: ${fallbackFile}`, err);
      }
    }
    markPerfEnd('character-manifests', { type: 'characters', loaded: loaded.size });
  }

  function scheduleDeferredScript(src, delayMs = 0) {
    const run = () => {
      loadScript(src).catch(err => {
        console.warn(`[BOKS] Deferred script failed: ${src}`, err);
      });
    };
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => run(), { timeout: Math.max(1200, delayMs + 400) });
      return;
    }
    window.setTimeout(run, delayMs);
  }

  window.BOKS_RUNTIME_CONFIG.ensureLottieRuntime = loadOptionalLottieRuntime;
  window.BOKS_RUNTIME_CONFIG.ensureEditorSupport = ensureEditorSupport;

  (async () => {
    window.BOKS_RUNTIME_CONFIG.lottieAvailable = !!window.lottie;
    await loadCharacterManifests();
    for (const file of CORE_STARTUP_SCRIPTS) {
      await loadScript(file);
    }
    scheduleDeferredScript('js/core/sw-register.js', 1200);
    markPerfEnd('bootstrap-total', { type: 'bootstrap' });
  })().catch(err => {
    console.error('App bootstrap failed:', err);
  });
})();
