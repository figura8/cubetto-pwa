  window.addEventListener('appinstalled', () => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = 'App installed — works offline!';
    el.className = 'show';
    el.style.top = '';
    el.style.bottom = '70px';
    el.style.left = '50%';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = ''; }, 3000);
  });

  if ('serviceWorker' in navigator) {
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLocalhost) {
      navigator.serviceWorker.getRegistrations()
        .then(regs => Promise.all(regs.map(reg => reg.unregister())))
        .catch(() => {});
    } else {

    window.BOKS_OFFLINE_STATUS = window.BOKS_OFFLINE_STATUS || {
      type: 'OFFLINE_UNKNOWN',
      cacheVersion: '',
      cacheName: '',
      expected: 0,
      cached: 0,
      failed: 0,
      failedUrls: [],
      checkedAt: ''
    };

    function updateOfflineStatus(message = {}) {
      if (!message || typeof message.type !== 'string' || !message.type.startsWith('OFFLINE_')) return;
      window.BOKS_OFFLINE_STATUS = {
        ...window.BOKS_OFFLINE_STATUS,
        ...message
      };
      window.dispatchEvent(new CustomEvent('boks-offline-status', {
        detail: window.BOKS_OFFLINE_STATUS
      }));
      if (message.failed > 0) {
        console.warn('[BOKS offline]', window.BOKS_OFFLINE_STATUS);
      } else {
        console.info('[BOKS offline]', window.BOKS_OFFLINE_STATUS);
      }
    }

    function verifyOfflineCache() {
      const controller = navigator.serviceWorker.controller;
      if (!controller) return false;
      controller.postMessage({ type: 'VERIFY_OFFLINE_CACHE' });
      return true;
    }

    window.BOKS_OFFLINE_CACHE = {
      getStatus: () => window.BOKS_OFFLINE_STATUS,
      verify: verifyOfflineCache
    };

    navigator.serviceWorker.addEventListener('message', event => {
      updateOfflineStatus(event.data);
    });

    let lastUpdateCheckAt = 0;
    function maybeUpdateRegistration(registration, minIntervalMs = 5 * 60 * 1000) {
      const now = Date.now();
      if (!registration || (now - lastUpdateCheckAt) < minIntervalMs) return;
      lastUpdateCheckAt = now;
      registration.update().catch(() => {});
    }

    function scheduleRegistration(task) {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(task, { timeout: 2500 });
        return;
      }
      window.setTimeout(task, 1200);
    }

    window.addEventListener('load', () => {
      scheduleRegistration(async () => {
      try {
        const reg = await navigator.serviceWorker.register('service-worker.js', {
          updateViaCache: 'none'
        });

        maybeUpdateRegistration(reg, 0);

        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            maybeUpdateRegistration(reg);
          }
        });
      } catch (err) {
        console.error('Service worker registration failed:', err);
      }
      });
    });
    }
  }
