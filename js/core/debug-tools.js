(() => {
  function createDebugTools({
    enabled = true,
    debugVisible = true,
    animationDebugVisible = false,
    isSceneVisible = () => document.visibilityState === 'visible',
    getDebugText = () => '',
    getAnimationState = () => null,
    onStepJump = () => {}
  } = {}) {
    const runtimePerf = window.BOKS_RUNTIME_CONFIG?.perf || null;
    let fpsProbeRaf = 0;
    let debugBadgeVisible = enabled && debugVisible;
    let animationBadgeVisible = enabled && animationDebugVisible;

    function ensureDebugBadge() {
      let badge = document.getElementById('debugBadge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'debugBadge';
      }
      const editorLeft = document.getElementById('editorLeft');
      const levelsPanel = document.getElementById('customLevelsPanel');
      const editorActive = document.body.classList.contains('editor-mode');
      if (editorActive && editorLeft) {
        editorLeft.insertBefore(badge, levelsPanel || null);
      } else if (badge.parentElement !== document.body) {
        document.body.appendChild(badge);
      }
      return badge;
    }

    function ensureAnimationDebugBadge() {
      let badge = document.getElementById('animationDebugBadge');
      if (badge) return badge;
      badge = document.createElement('div');
      badge.id = 'animationDebugBadge';
      document.body.appendChild(badge);
      return badge;
    }

    function syncBodyState() {
      document.body?.classList.toggle('debug-visible', enabled && debugBadgeVisible);
      document.body?.classList.toggle('animation-debug-visible', enabled && animationBadgeVisible);
    }

    function recordPerfMetric(name, durationMs, detail = {}) {
      return runtimePerf?.record?.(name, durationMs, detail) || null;
    }

    function markPerfMetricStart(name) {
      runtimePerf?.markStart?.(name);
    }

    function markPerfMetricEnd(name, detail = {}) {
      return runtimePerf?.markEnd?.(name, detail) || null;
    }

    function startFpsProbe(label = 'scene', sampleMs = 2200) {
      if (!isSceneVisible() || fpsProbeRaf) return;
      const startedAt = window.performance?.now?.() || Date.now();
      let lastAt = startedAt;
      let frames = 0;
      let worstFrameMs = 0;

      const step = now => {
        frames += 1;
        const delta = now - lastAt;
        lastAt = now;
        if (delta > worstFrameMs) worstFrameMs = delta;
        if ((now - startedAt) >= sampleMs) {
          fpsProbeRaf = 0;
          const elapsed = Math.max(1, now - startedAt);
          recordPerfMetric('fps-probe', 0, {
            label,
            frames,
            avgFps: Math.round((frames * 1000) / elapsed),
            worstFrameMs: Math.round(worstFrameMs * 100) / 100
          });
          return;
        }
        fpsProbeRaf = requestAnimationFrame(step);
      };

      fpsProbeRaf = requestAnimationFrame(step);
    }

    function stopFpsProbe() {
      if (!fpsProbeRaf) return;
      cancelAnimationFrame(fpsProbeRaf);
      fpsProbeRaf = 0;
    }

    function trimBuildQuery(src = '') {
      const clean = String(src || '').trim();
      if (!clean) return '';
      return clean.split('?')[0];
    }

    function compactAssetLabel(src = '') {
      const clean = trimBuildQuery(src);
      if (!clean) return '-';
      const parts = clean.split('/');
      if (parts.length <= 3) return clean;
      return `${parts[parts.length - 3]}/${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }

    function updateDebugBadge() {
      if (!enabled) return;
      ensureDebugBadge().textContent = getDebugText() || '';
    }

    function updateAnimationDebugBadge(extra = '') {
      if (!enabled || !animationBadgeVisible) return;
      const info = getAnimationState() || {};
      const lines = [
        `Anim now  : ${info.resolved || '-'}`,
        `Requested : ${info.requested || '-'}`,
        `Char/pose : ${info.character || '-'} | ${info.action || '-'}:${info.direction || '-'} | visual:${info.visualDirection || '-'}`,
        `Mode      : ${info.mode || '-'} | loop:${info.loop || '-'} | mounted:${info.mounted || '-'} | ready:${info.ready ?? '-'} | fallback:${info.fallback ?? '-'}`,
        `Asset     : ${info.asset || '-'}`
      ];
      if (extra) lines.push(`Note      : ${extra}`);
      ensureAnimationDebugBadge().textContent = lines.join('\n');
    }

    function toggleDebugBadge() {
      if (!enabled) return;
      debugBadgeVisible = !debugBadgeVisible;
      syncBodyState();
      if (debugBadgeVisible) updateDebugBadge();
    }

    function toggleAnimationDebugBadge(force = null) {
      if (!enabled) {
        animationBadgeVisible = false;
        syncBodyState();
        return;
      }
      animationBadgeVisible = typeof force === 'boolean' ? force : !animationBadgeVisible;
      syncBodyState();
      if (animationBadgeVisible) updateAnimationDebugBadge();
    }

    function debugStepJump(delta) {
      if (!enabled) return;
      onStepJump(delta);
    }

    syncBodyState();
    if (animationBadgeVisible) {
      requestAnimationFrame(() => updateAnimationDebugBadge());
    }

    return {
      compactAssetLabel,
      debugStepJump,
      markPerfMetricEnd,
      markPerfMetricStart,
      recordPerfMetric,
      startFpsProbe,
      stopFpsProbe,
      toggleAnimationDebugBadge,
      toggleDebugBadge,
      updateAnimationDebugBadge,
      updateDebugBadge
    };
  }

  window.BOKS_DEBUG_TOOLS = {
    create: createDebugTools
  };
})();
