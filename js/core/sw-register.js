  if ('serviceWorker' in navigator) {
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLocalhost) {
      navigator.serviceWorker.getRegistrations()
        .then(regs => Promise.all(regs.map(reg => reg.unregister())))
        .catch(() => {});
      return;
    }

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
