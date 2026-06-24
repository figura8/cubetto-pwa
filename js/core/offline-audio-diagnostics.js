(() => {
  const ENABLED_KEY = 'boks-audio-debug';
  const SAMPLE_AUDIO = [
    'assets/audio/sfx/gameplay/01_hello_and_welcome.mp3',
    'assets/audio/sfx/gameplay/tutorial_21_but_do_we_see_in_action.mp3',
    'assets/audio/sfx/ui/play_press_main.mp3',
    'assets/audio/music/game_loop_main.mp3'
  ];

  function isEnabled() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('audioDebug') === '1') {
        localStorage.setItem(ENABLED_KEY, '1');
        return true;
      }
      if (url.searchParams.get('audioDebug') === '0') {
        localStorage.removeItem(ENABLED_KEY);
        return false;
      }
      return localStorage.getItem(ENABLED_KEY) === '1';
    } catch (_err) {
      return false;
    }
  }

  if (!isEnabled()) return;

  const state = {
    running: false,
    lastResult: null
  };

  function createPanel() {
    const existing = document.getElementById('offlineAudioDiagnostics');
    if (existing) return existing;

    const panel = document.createElement('section');
    panel.id = 'offlineAudioDiagnostics';
    panel.setAttribute('aria-label', 'Offline audio diagnostics');
    panel.innerHTML = `
      <div class="oad-head">
        <strong>Audio Offline</strong>
        <button id="oadCloseBtn" type="button" aria-label="Close audio diagnostics">x</button>
      </div>
      <label class="oad-row">
        <span>Sample</span>
        <select id="oadSampleSelect"></select>
      </label>
      <div class="oad-actions">
        <button id="oadRunBtn" type="button">Test audio</button>
        <button id="oadVerifyBtn" type="button">Verify cache</button>
      </div>
      <pre id="oadOutput">Ready. Switch airplane mode, then tap Test audio.</pre>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #offlineAudioDiagnostics {
        position: fixed;
        z-index: 99999;
        right: 10px;
        bottom: 10px;
        width: min(360px, calc(100vw - 20px));
        max-height: min(520px, calc(100vh - 20px));
        box-sizing: border-box;
        padding: 10px;
        border: 2px solid #111;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.96);
        color: #111;
        font: 12px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
      }
      #offlineAudioDiagnostics .oad-head,
      #offlineAudioDiagnostics .oad-row,
      #offlineAudioDiagnostics .oad-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      #offlineAudioDiagnostics .oad-head {
        justify-content: space-between;
      }
      #offlineAudioDiagnostics select,
      #offlineAudioDiagnostics button {
        min-height: 32px;
        border: 1px solid #111;
        border-radius: 6px;
        background: #fff;
        color: #111;
        font: inherit;
      }
      #offlineAudioDiagnostics select {
        min-width: 0;
        flex: 1;
      }
      #offlineAudioDiagnostics button {
        padding: 0 10px;
      }
      #offlineAudioDiagnostics pre {
        overflow: auto;
        max-height: 340px;
        margin: 0;
        padding: 8px;
        border-radius: 6px;
        background: #111;
        color: #dcfce7;
        white-space: pre-wrap;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);
    return panel;
  }

  function compactUrl(value = '') {
    const clean = String(value).split('?')[0];
    const parts = clean.split('/');
    return parts.slice(-2).join('/');
  }

  function setOutput(lines) {
    const output = document.getElementById('oadOutput');
    if (!output) return;
    output.textContent = Array.isArray(lines) ? lines.join('\n') : String(lines || '');
  }

  function appendLine(line) {
    const output = document.getElementById('oadOutput');
    if (!output) return;
    output.textContent = `${output.textContent || ''}\n${line}`;
    output.scrollTop = output.scrollHeight;
  }

  function getCacheStatus() {
    return window.BOKS_OFFLINE_CACHE?.getStatus?.() || window.BOKS_OFFLINE_STATUS || null;
  }

  function waitForOfflineStatus(timeoutMs = 4500) {
    return new Promise(resolve => {
      let done = false;
      const finish = value => {
        if (done) return;
        done = true;
        window.removeEventListener('boks-offline-status', onStatus);
        resolve(value || getCacheStatus());
      };
      const onStatus = event => finish(event.detail);
      window.addEventListener('boks-offline-status', onStatus);
      window.setTimeout(() => finish(getCacheStatus()), timeoutMs);
      if (!window.BOKS_OFFLINE_CACHE?.verify?.()) {
        window.setTimeout(() => finish(getCacheStatus()), 250);
      }
    });
  }

  async function findCachedResponse(pathname) {
    if (!('caches' in window)) return { found: false, cacheName: '', bytes: 0 };
    const names = await caches.keys();
    const absolute = new URL(pathname, window.location.href).toString();
    for (const cacheName of names) {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(absolute, { ignoreSearch: true })
        || await cache.match(pathname, { ignoreSearch: true })
        || await cache.match(`./${pathname}`, { ignoreSearch: true });
      if (cached) {
        const clone = cached.clone();
        const bytes = Number(clone.headers.get('Content-Length')) || (await clone.arrayBuffer()).byteLength;
        return { found: true, cacheName, bytes };
      }
    }
    return { found: false, cacheName: '', bytes: 0 };
  }

  async function fetchProbe(pathname, headers = {}) {
    const response = await fetch(`${pathname}?probe=${Date.now()}`, {
      headers,
      cache: 'no-store'
    });
    const buffer = await response.clone().arrayBuffer().catch(() => new ArrayBuffer(0));
    return {
      ok: response.ok,
      status: response.status,
      bytes: buffer.byteLength,
      contentRange: response.headers.get('Content-Range') || '',
      acceptRanges: response.headers.get('Accept-Ranges') || ''
    };
  }

  function playProbe(pathname) {
    const audio = new Audio(`${pathname}?probe=${Date.now()}`);
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.setAttribute?.('playsinline', '');
    audio.volume = 0.8;

    const played = new Promise(resolve => {
      let settled = false;
      const finish = result => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      };
      const cleanup = () => {
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('error', onError);
      };
      const onPlaying = () => finish({ ok: true, event: 'playing', currentTime: audio.currentTime });
      const onTimeUpdate = () => {
        if (audio.currentTime > 0) finish({ ok: true, event: 'timeupdate', currentTime: audio.currentTime });
      };
      const onError = () => finish({
        ok: false,
        event: 'error',
        error: audio.error ? `${audio.error.code}` : 'media error'
      });

      audio.addEventListener('playing', onPlaying);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('error', onError);
      window.setTimeout(() => finish({
        ok: !audio.paused && audio.readyState > 1,
        event: 'timeout',
        readyState: audio.readyState,
        currentTime: audio.currentTime
      }), 3500);
    });

    const playAttempt = audio.play();
    const promise = playAttempt?.then
      ? playAttempt.then(() => played).catch(err => ({
        ok: false,
        event: 'play-rejected',
        error: err?.name || err?.message || String(err)
      }))
      : played;

    promise.finally(() => {
      window.setTimeout(() => {
        try {
          audio.pause();
          audio.src = '';
        } catch (_err) {}
      }, 450);
    });
    return promise;
  }

  async function runDiagnostics(pathname) {
    if (state.running) return;
    state.running = true;
    setOutput([
      `Sample: ${compactUrl(pathname)}`,
      `Online: ${navigator.onLine ? 'yes' : 'no'}`,
      'Play: starting from this tap...'
    ]);

    const playPromise = playProbe(pathname);

    try {
      const [status, cached, fullFetch, rangeFetch, play] = await Promise.all([
        waitForOfflineStatus(),
        findCachedResponse(pathname),
        fetchProbe(pathname).catch(err => ({ ok: false, status: 0, error: err?.message || String(err) })),
        fetchProbe(pathname, { Range: 'bytes=0-1023' }).catch(err => ({ ok: false, status: 0, error: err?.message || String(err) })),
        playPromise
      ]);

      state.lastResult = { status, cached, fullFetch, rangeFetch, play };
      setOutput([
        `Sample: ${compactUrl(pathname)}`,
        `Online: ${navigator.onLine ? 'yes' : 'no'}`,
        `SW: ${navigator.serviceWorker?.controller ? 'controlled' : 'not controlled'}`,
        `Cache: ${status?.type || 'unknown'} ${status?.cached ?? 0}/${status?.expected ?? 0}`,
        `Failed assets: ${status?.failed ?? 0}`,
        `In Cache Storage: ${cached.found ? `yes (${cached.cacheName}, ${cached.bytes} bytes)` : 'no'}`,
        `Full fetch: ${fullFetch.ok ? 'ok' : 'fail'} status=${fullFetch.status} bytes=${fullFetch.bytes ?? 0}${fullFetch.error ? ` ${fullFetch.error}` : ''}`,
        `Range fetch: ${rangeFetch.status} bytes=${rangeFetch.bytes ?? 0} ${rangeFetch.contentRange || rangeFetch.error || ''}`,
        `Accept-Ranges: ${rangeFetch.acceptRanges || '-'}`,
        `Play: ${play.ok ? 'ok' : 'fail'} event=${play.event || '-'}${play.error ? ` error=${play.error}` : ''}`,
        `ReadyState: ${play.readyState ?? '-'} currentTime=${Math.round((play.currentTime || 0) * 100) / 100}`
      ]);
    } finally {
      state.running = false;
    }
  }

  function bindPanel(panel) {
    const select = panel.querySelector('#oadSampleSelect');
    const runBtn = panel.querySelector('#oadRunBtn');
    const verifyBtn = panel.querySelector('#oadVerifyBtn');
    const closeBtn = panel.querySelector('#oadCloseBtn');

    select.innerHTML = SAMPLE_AUDIO
      .map(pathname => `<option value="${pathname}">${compactUrl(pathname)}</option>`)
      .join('');

    runBtn.addEventListener('click', () => runDiagnostics(select.value || SAMPLE_AUDIO[0]));
    verifyBtn.addEventListener('click', async () => {
      setOutput('Verifying service worker cache...');
      const status = await waitForOfflineStatus();
      setOutput([
        `Cache: ${status?.type || 'unknown'} ${status?.cached ?? 0}/${status?.expected ?? 0}`,
        `Failed assets: ${status?.failed ?? 0}`,
        `Checked: ${status?.checkedAt || '-'}`
      ]);
    });
    closeBtn.addEventListener('click', () => {
      try { localStorage.removeItem(ENABLED_KEY); } catch (_err) {}
      panel.remove();
    });

    window.addEventListener('boks-offline-status', event => {
      if (state.running) return;
      const status = event.detail || {};
      appendLine(`Cache status: ${status.type || 'unknown'} ${status.cached ?? 0}/${status.expected ?? 0}`);
    });
  }

  const boot = () => bindPanel(createPanel());
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.BOKS_AUDIO_DIAGNOSTICS = {
    run: runDiagnostics,
    getLastResult: () => state.lastResult
  };
})();
