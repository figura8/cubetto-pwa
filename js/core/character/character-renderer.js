(() => {
  const build = document.body?.dataset.build || 'dev';
  const DEFAULT_CHARACTER_ID = 'boks_base';
  const DEFAULT_ACTION = 'idle';
  const DEFAULT_DIRECTION = 'right';
  const lottieInstances = new WeakMap();
  const prefetchedLottieSrc = new Set();
  const preloadedCharacterIds = new Set();

  function normalizeDirection(direction) {
    return ['right', 'left', 'up', 'down'].includes(direction) ? direction : DEFAULT_DIRECTION;
  }

  function normalizeAction(action) {
    return ['idle', 'move', 'turn'].includes(action) ? action : DEFAULT_ACTION;
  }

  function normalizeState(input = {}) {
    if (typeof input === 'string') {
      return {
        direction: normalizeDirection(input),
        action: DEFAULT_ACTION
      };
    }
    return {
      direction: normalizeDirection(input.direction),
      action: normalizeAction(input.action)
    };
  }

  function getCharacterManifest(characterId) {
    const defs = window.BOKS_CHARACTER_DEFS || {};
    return defs[characterId] || defs[DEFAULT_CHARACTER_ID] || null;
  }

  function getStateKey(action, direction) {
    return `${action}:${direction}`;
  }

  function escapeAttr(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function withBuildQuery(src = '') {
    const trimmed = String(src || '').trim();
    if (!trimmed) return '';
    const glue = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${glue}v=${encodeURIComponent(build)}`;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function buildFitStyle(state) {
    const scale = Number(state?.fit?.scale);
    const offsetX = Number(state?.fit?.offsetX);
    const offsetY = Number(state?.fit?.offsetY);
    const parts = [];
    if (Number.isFinite(scale) && scale > 0) {
      parts.push(`--hero-fit-scale:${scale}`);
    }
    if (Number.isFinite(offsetX)) {
      parts.push(`--hero-fit-offset-x:${offsetX}px`);
    }
    if (Number.isFinite(offsetY)) {
      parts.push(`--hero-fit-offset-y:${offsetY}px`);
    }
    return parts.join('; ');
  }

  function resolveState(characterId, stateInput = {}) {
    const manifest = getCharacterManifest(characterId);
    if (!manifest) return null;

    const state = normalizeState(stateInput);
    const fallbackAction = manifest.defaultAction || DEFAULT_ACTION;
    const fallbackDirection = manifest.defaultDirection || DEFAULT_DIRECTION;
    const fallbackKey = getStateKey(fallbackAction, fallbackDirection);
    const desiredKey = getStateKey(state.action, state.direction);
    const directState = manifest.states?.[desiredKey];
    if (directState) {
      return {
        manifest,
        key: desiredKey,
        state: directState,
        usesFallback: false
      };
    }

    const fallbackState = manifest.states?.[fallbackKey];
    if (!fallbackState) return null;

    return {
      manifest,
      key: fallbackKey,
      state: fallbackState,
      usesFallback: true
    };
  }

  function isLottieState(state = {}) {
    return typeof state?.lottieSrc === 'string' && state.lottieSrc.trim().length > 0;
  }

  function prefetchLottieSource(src = '') {
    const url = withBuildQuery(src);
    if (!url || prefetchedLottieSrc.has(url)) return;
    prefetchedLottieSrc.add(url);
    fetch(url, { cache: 'force-cache' }).catch(() => {
      // Non blocchiamo il rendering: il preload e solo best-effort.
    });
  }

  function preloadCharacterAssets(characterId) {
    const manifest = getCharacterManifest(characterId);
    if (!manifest?.states) return;
    if (preloadedCharacterIds.has(characterId)) return;
    Object.values(manifest.states).forEach(state => {
      if (!isLottieState(state)) return;
      prefetchLottieSource(state.lottieSrc);
    });
    preloadedCharacterIds.add(characterId);
  }

  function buildLottieMarkup(state) {
    const lottieSrc = withBuildQuery(state.lottieSrc);
    const renderer = state.lottieRenderer === 'canvas' ? 'canvas' : 'svg';
    const loop = state.lottieLoop !== false ? 'true' : 'false';
    const autoplay = state.lottieAutoplay !== false ? 'true' : 'false';
    const previewSrc = withBuildQuery(state.previewSrc || state.fallbackSrc || state.src || '');
    const previewMarkup = previewSrc
      ? `<img class="boks-hero__img boks-hero__img--fallback" src="${escapeAttr(previewSrc)}" alt=""/>`
      : '';

    return `
      <span class="boks-hero__lottie-wrap" data-lottie-src="${escapeAttr(lottieSrc)}" data-lottie-renderer="${escapeAttr(renderer)}" data-lottie-loop="${escapeAttr(loop)}" data-lottie-autoplay="${escapeAttr(autoplay)}">
        <span class="boks-hero__lottie" aria-hidden="true"></span>
        ${previewMarkup}
      </span>
    `;
  }

  function buildImageMarkup(state) {
    if (typeof state?.svgMarkup === 'string' && state.svgMarkup.trim()) {
      return `<span class="boks-hero__inline-svg">${state.svgMarkup}</span>`;
    }
    if (!state?.src) return '';
    const src = withBuildQuery(state.src);
    return `<img class="boks-hero__img" src="${escapeAttr(src)}" alt=""/>`;
  }

  function isLottieAvailable() {
    return !!(window.lottie && typeof window.lottie.loadAnimation === 'function');
  }

  function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
  }

  function getPlaybackBounds(instance) {
    if (!instance || typeof instance.getDuration !== 'function') return null;
    const totalFrames = Number(instance.getDuration(true));
    if (!Number.isFinite(totalFrames) || totalFrames <= 0) return null;
    const firstFrameRaw = Number(instance.firstFrame);
    const firstFrame = Number.isFinite(firstFrameRaw) ? firstFrameRaw : 0;
    const lastFrame = firstFrame + totalFrames - 0.01;
    return { firstFrame, totalFrames, lastFrame };
  }

  function collectKeyframeTimes(value, out) {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(item => collectKeyframeTimes(item, out));
      return;
    }
    if (typeof value !== 'object') return;
    if (value.a === 1 && Array.isArray(value.k)) {
      value.k.forEach(kf => {
        const t = Number(kf?.t);
        if (Number.isFinite(t)) out.push(t);
      });
    }
    Object.values(value).forEach(child => collectKeyframeTimes(child, out));
  }

  function getPlaybackSegment(instance) {
    const bounds = getPlaybackBounds(instance);
    if (!bounds) return null;
    const times = [];
    collectKeyframeTimes(instance?.animationData?.layers, times);
    const uniq = [...new Set(times.map(t => Number(t)).filter(Number.isFinite))].sort((a, b) => a - b);
    if (uniq.length < 2) {
      return { startFrame: bounds.firstFrame, endFrame: bounds.lastFrame, fromKeyframes: false };
    }

    const eps = 0.5;
    const desiredStart = bounds.firstFrame;
    const desiredEnd = bounds.lastFrame;
    const beforeStart = uniq.filter(t => t <= desiredStart + eps);
    const afterEnd = uniq.filter(t => t >= desiredEnd - eps);
    let startFrame = beforeStart.length ? beforeStart[beforeStart.length - 1] : desiredStart;
    let endFrame = afterEnd.length ? afterEnd[0] : desiredEnd;

    if (!Number.isFinite(startFrame) || !Number.isFinite(endFrame) || endFrame <= startFrame + 0.2) {
      startFrame = uniq[0];
      endFrame = uniq[uniq.length - 1];
    }
    if (!Number.isFinite(startFrame) || !Number.isFinite(endFrame) || endFrame <= startFrame + 0.2) {
      startFrame = bounds.firstFrame;
      endFrame = bounds.lastFrame;
      return { startFrame, endFrame, fromKeyframes: false };
    }
    return { startFrame, endFrame, fromKeyframes: true };
  }

  function getExplicitSegment(options = {}) {
    const startFrame = Number(options?.segmentStartFrame ?? options?.segmentStart);
    const endFrame = Number(options?.segmentEndFrame ?? options?.segmentEnd);
    if (!Number.isFinite(startFrame) || !Number.isFinite(endFrame)) return null;
    if (Math.abs(endFrame - startFrame) < 0.2) return null;
    return {
      startFrame,
      endFrame,
      fromKeyframes: false
    };
  }

  function getPlaybackSnapshot(root) {
    if (!root) return null;
    const wrap = root.querySelector?.('.boks-hero__lottie-wrap');
    if (!wrap) return null;
    const instance = lottieInstances.get(wrap);
    const bounds = getPlaybackBounds(instance);
    if (!bounds) return null;
    const currentFrame = Number(instance.currentFrame);
    const frame = Number.isFinite(currentFrame) ? currentFrame : bounds.firstFrame;
    const relative = frame - bounds.firstFrame;
    const normalized = ((relative % bounds.totalFrames) + bounds.totalFrames) % bounds.totalFrames;
    return {
      progress: clamp01(normalized / bounds.totalFrames),
      paused: instance.isPaused === true
    };
  }

  function applyPlaybackSnapshot(root, snapshot) {
    if (!root || !snapshot || !Number.isFinite(snapshot.progress)) return;
    const wraps = root.querySelectorAll?.('.boks-hero__lottie-wrap') || [];
    wraps.forEach(wrap => {
      wrap.dataset.lottieSeekRatio = String(clamp01(snapshot.progress));
      wrap.dataset.lottieSeekPaused = snapshot.paused ? 'true' : 'false';
    });
  }

  function destroyIn(root) {
    if (!root) return;
    const wraps = root.querySelectorAll?.('.boks-hero__lottie-wrap') || [];
    wraps.forEach(wrap => {
      const instance = lottieInstances.get(wrap);
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
      lottieInstances.delete(wrap);
      wrap.classList.remove('is-ready', 'is-failed', 'is-unavailable');
      wrap.dataset.lottieMounted = 'false';
      wrap.dataset.lottieReady = 'false';
    });
  }

  async function waitForLottieReady(wrap, instance, timeoutMs = 0) {
    if (!wrap || !instance) return false;
    const deadline = Math.max(220, Math.min(2200, Number(timeoutMs) || 1000));
    const startedAt = Date.now();
    while ((Date.now() - startedAt) < deadline) {
      const readyByDataset = wrap.dataset.lottieReady === 'true';
      const readyByClass = wrap.classList.contains('is-ready');
      const readyByInstance = instance.isLoaded === true;
      if (readyByDataset || readyByClass || readyByInstance) {
        wrap.dataset.lottieReady = 'true';
        return true;
      }
      await wait(16);
    }
    return false;
  }

  function mountIn(root) {
    if (!root) return;
    const wraps = root.querySelectorAll?.('.boks-hero__lottie-wrap') || [];
    if (!wraps.length) return;

    if (!isLottieAvailable()) {
      wraps.forEach(wrap => {
        wrap.classList.add('is-unavailable');
      });
      return;
    }

    wraps.forEach(wrap => {
      if (lottieInstances.has(wrap)) return;
      const container = wrap.querySelector('.boks-hero__lottie');
      const path = wrap.dataset.lottieSrc || '';
      if (!container || !path) {
        wrap.classList.add('is-failed');
        return;
      }

      try {
        const shouldAutoplay = wrap.dataset.lottieAutoplay !== 'false';
        const animation = window.lottie.loadAnimation({
          container,
          renderer: wrap.dataset.lottieRenderer === 'canvas' ? 'canvas' : 'svg',
          loop: wrap.dataset.lottieLoop !== 'false',
          // Avviamo manualmente dopo eventuale seek per evitare flash sul frame iniziale.
          autoplay: false,
          path
        });

        animation.addEventListener?.('DOMLoaded', () => {
          const seekRatio = Number(wrap.dataset.lottieSeekRatio);
          const hasSeek = Number.isFinite(seekRatio);
          const bounds = getPlaybackBounds(animation);
          if (hasSeek) {
            if (bounds) {
              const frame = bounds.firstFrame + (clamp01(seekRatio) * bounds.totalFrames);
              animation.goToAndStop(frame, true);
            }
          } else {
            animation.goToAndStop(bounds?.firstFrame || 0, true);
          }
          if (shouldAutoplay && wrap.dataset.lottieSeekPaused !== 'true') {
            animation.play();
          }
          delete wrap.dataset.lottieSeekRatio;
          delete wrap.dataset.lottieSeekPaused;
          wrap.dataset.lottieReady = 'true';
          requestAnimationFrame(() => {
            wrap.classList.add('is-ready');
            wrap.classList.remove('is-failed', 'is-unavailable');
          });
        });
        animation.addEventListener?.('data_failed', () => {
          wrap.classList.add('is-failed');
          wrap.classList.remove('is-ready');
          wrap.dataset.lottieReady = 'false';
        });

        wrap.dataset.lottieMounted = 'true';
        lottieInstances.set(wrap, animation);
      } catch (_err) {
        wrap.classList.add('is-failed');
        wrap.dataset.lottieMounted = 'false';
        wrap.dataset.lottieReady = 'false';
      }
    });
  }

  async function waitForAnimationCompletionIn(root, timeoutMs = 0) {
    if (!root) return false;
    const wrap = root.querySelector?.('.boks-hero__lottie-wrap');
    if (!wrap) return false;
    if (wrap.dataset.lottieLoop !== 'false') return false;

    const startedAt = Date.now();
    const mountDeadline = Math.max(200, Math.min(2000, Number(timeoutMs) || 1000));
    let instance = lottieInstances.get(wrap) || null;
    while (!instance && (Date.now() - startedAt) < mountDeadline) {
      await wait(16);
      instance = lottieInstances.get(wrap) || null;
    }
    if (!instance) return false;
    await waitForLottieReady(wrap, instance, timeoutMs);

    let effectiveTimeout = Number(timeoutMs);
    if (!Number.isFinite(effectiveTimeout) || effectiveTimeout <= 0) {
      const bounds = getPlaybackBounds(instance);
      const frames = bounds?.totalFrames || 0;
      const fps = Number(instance.frameRate || 0);
      if (Number.isFinite(frames) && frames > 0 && Number.isFinite(fps) && fps > 0) {
        effectiveTimeout = Math.ceil((frames / fps) * 1000) + 400;
      } else {
        effectiveTimeout = 2400;
      }
    } else {
      effectiveTimeout += 500;
    }

    return new Promise(resolve => {
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        try {
          instance.removeEventListener?.('complete', onComplete);
        } catch (_err) {}
        clearTimeout(timer);
        resolve(Boolean(ok));
      };
      const onComplete = () => finish(true);
      const timer = setTimeout(() => finish(false), effectiveTimeout);
      instance.addEventListener?.('complete', onComplete);
    });
  }

  async function playAnimationOnceIn(root, timeoutMs = 0, options = {}) {
    if (!root) return false;
    const wrap = root.querySelector?.('.boks-hero__lottie-wrap');
    if (!wrap) return false;
    if (wrap.dataset.lottieLoop !== 'false') return false;

    const startedAt = Date.now();
    const mountDeadline = Math.max(250, Math.min(2200, Number(timeoutMs) || 1200));
    let instance = lottieInstances.get(wrap) || null;
    while (!instance && (Date.now() - startedAt) < mountDeadline) {
      await wait(16);
      instance = lottieInstances.get(wrap) || null;
    }
    if (!instance) return false;
    const ready = await waitForLottieReady(wrap, instance, timeoutMs);
    if (!ready) return false;

    const segment = getExplicitSegment(options) || getPlaybackSegment(instance);
    if (!segment) return false;
    const reversePlayback = options?.reversePlayback === true;
    let effectiveTimeout = Number(timeoutMs);
    const fps = Number(instance.frameRate || 0);
    const segmentFrames = Math.max(1, Math.abs(segment.endFrame - segment.startFrame));
    const segmentMs = Number.isFinite(fps) && fps > 0
      ? Math.ceil((segmentFrames / fps) * 1000)
      : 0;
    if (!Number.isFinite(effectiveTimeout) || effectiveTimeout <= 0) {
      if (segmentMs > 0) {
        effectiveTimeout = segmentMs + 450;
      } else {
        effectiveTimeout = 2400;
      }
    } else {
      effectiveTimeout = Math.max(effectiveTimeout + 500, segmentMs > 0 ? segmentMs + 450 : 0);
    }

    const completed = await new Promise(resolve => {
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        try {
          instance.removeEventListener?.('complete', onComplete);
        } catch (_err) {}
        clearTimeout(timer);
        resolve(Boolean(ok));
      };
      const onComplete = () => finish(true);
      const timer = setTimeout(() => finish(false), effectiveTimeout);

      try {
        instance.addEventListener?.('complete', onComplete);
        if (typeof instance.setDirection === 'function') {
          instance.setDirection(reversePlayback ? -1 : 1);
        }
        instance.pause?.();
        const fromFrame = reversePlayback ? segment.endFrame : segment.startFrame;
        instance.goToAndStop?.(fromFrame, true);
        if (typeof instance.playSegments === 'function') {
          instance.playSegments([segment.startFrame, segment.endFrame], true);
        } else {
          instance.play?.();
        }
      } catch (_err) {
        finish(false);
      }
    });

    if (!completed) return false;
    try {
      instance.goToAndStop(reversePlayback ? segment.startFrame : segment.endFrame, true);
      if (typeof instance.setDirection === 'function') {
        instance.setDirection(1);
      }
    } catch (_err) {}
    return true;
  }

  function resolveRender(input = {}) {
    const characterId = input.characterId || DEFAULT_CHARACTER_ID;
    const state = normalizeState(input);
    const resolved = resolveState(characterId, state);
    if (!resolved?.state) return null;
    const requestedKey = getStateKey(state.action, state.direction);
    const resolvedKey = resolved.key;
    const fitStyle = buildFitStyle(resolved.state);
    return {
      characterId,
      state,
      resolved,
      requestedKey,
      resolvedKey,
      fitStyle
    };
  }

  function getRenderToken(input = {}) {
    const info = resolveRender(input);
    if (!info) return '';
    const state = info.resolved.state || {};
    const assetRef = isLottieState(state)
      ? withBuildQuery(state.lottieSrc)
      : withBuildQuery(state.src);
    const mode = isLottieState(state) ? 'lottie' : 'image';
    const renderer = state.lottieRenderer === 'canvas' ? 'canvas' : 'svg';
    const loop = state.lottieLoop !== false ? '1' : '0';
    const autoplay = state.lottieAutoplay !== false ? '1' : '0';
    return [
      info.characterId,
      info.requestedKey,
      info.resolvedKey,
      mode,
      renderer,
      loop,
      autoplay,
      state.transformFallback || 'none',
      info.fitStyle,
      assetRef
    ].join('|');
  }

  function render(input = {}) {
    const info = resolveRender(input);
    if (!info) return '';
    const { characterId, state, resolved, requestedKey, resolvedKey, fitStyle } = info;
    if (!resolved?.state) return '';
    const contentMarkup = isLottieState(resolved.state)
      ? buildLottieMarkup(resolved.state)
      : buildImageMarkup(resolved.state);
    if (!contentMarkup) return '';

    return `
      <div class="boks-hero" data-character="${characterId}" data-direction="${state.direction}" data-action="${state.action}" data-state="${requestedKey}" data-resolved-state="${resolvedKey}" data-transform-fallback="${resolved.state.transformFallback || 'none'}" data-fallback="${resolved.usesFallback ? 'true' : 'false'}">
        <span class="boks-hero__art" aria-hidden="true">
          <span class="boks-hero__fit" style="${fitStyle}">
            ${contentMarkup}
          </span>
        </span>
      </div>
    `;
  }

  window.BOKS_CHARACTER_RENDERER = {
    render,
    getRenderToken,
    resolveConfig: resolveRender,
    normalizeState,
    preloadCharacterAssets,
    mountIn,
    destroyIn,
    getPlaybackSnapshot,
    applyPlaybackSnapshot,
    waitForAnimationCompletionIn,
    playAnimationOnceIn,
    isLottieAvailable
  };
})();
