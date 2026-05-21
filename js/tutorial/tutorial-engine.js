(() => {
  const DEFAULT_BEAT_MS = 3200;
  const MIN_BEAT_MS = 1800;
  const MAX_BEAT_MS = 6200;
  let unlockedAudio = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function estimateDuration(text) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return clamp(1400 + words * 230, MIN_BEAT_MS, MAX_BEAT_MS);
  }

  function sleep(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  function resolveAudioSrc(src) {
    if (!src) return '';
    if (/^(https?:|blob:|data:)/i.test(src)) return src;
    return new URL(String(src).replace(/^\//, ''), `${window.location.origin}/`).toString();
  }

  async function unlockAudio(sequence = {}) {
    const beats = Array.isArray(sequence.beats) ? sequence.beats : [];
    const firstAudio = beats.find(beat => beat?.type === 'narration' && beat.audio)?.audio;
    if (!firstAudio) return false;
    try {
      unlockedAudio = unlockedAudio || new Audio();
      unlockedAudio.src = resolveAudioSrc(firstAudio);
      unlockedAudio.preload = 'auto';
      unlockedAudio.volume = 0.001;
      unlockedAudio.muted = false;
      await unlockedAudio.play();
      unlockedAudio.pause();
      unlockedAudio.currentTime = 0;
      unlockedAudio.volume = 1;
      return true;
    } catch (_err) {
      return false;
    }
  }

  function ensureRoot() {
    let root = document.getElementById('tutorialNarrator');
    if (root) return root;

    root = document.createElement('div');
    root.id = 'tutorialNarrator';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-atomic', 'true');
    root.innerHTML = `
      <div class="tutorial-caption">
        <p class="tutorial-caption__text"></p>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  function setCaption(root, text) {
    const caption = root.querySelector('.tutorial-caption__text');
    if (caption) caption.textContent = text || '';
    root.classList.toggle('is-visible', !!text);
  }

  async function playOptionalAudio(src) {
    if (!src) return false;
    try {
      const audio = unlockedAudio || new Audio();
      audio.pause();
      audio.src = resolveAudioSrc(src);
      audio.preload = 'auto';
      audio.currentTime = 0;
      audio.volume = 1;
      audio.muted = false;
      await audio.play();
      await new Promise(resolve => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        audio.addEventListener('ended', finish, { once: true });
        audio.addEventListener('error', finish, { once: true });
        window.setTimeout(finish, MAX_BEAT_MS + 2400);
      });
      return true;
    } catch (_err) {
      return false;
    }
  }

  async function runBeat(root, beat) {
    if (!beat) return;
    if (beat.type === 'pause') {
      await sleep(Number(beat.durationMs) || DEFAULT_BEAT_MS);
      return;
    }
    if (beat.type === 'call') {
      await window.BOKS_TUTORIAL_STAGE?.[beat.action]?.(beat.target, beat);
      return;
    }
    if (beat.type === 'waitFor') {
      await window.BOKS_TUTORIAL_STAGE?.waitFor?.(beat.event, beat.count);
      return;
    }
    if (beat.type !== 'narration') return;
    setCaption(root, beat.text);
    const audioPlayed = await playOptionalAudio(beat.audio);
    if (!audioPlayed) {
      await sleep(Number(beat.durationMs) || estimateDuration(beat.text) || DEFAULT_BEAT_MS);
    }
    setCaption(root, '');
    await sleep(Number(beat.pauseAfterMs) || 360);
  }

  function createTutorialEngine() {
    let runToken = 0;

    async function start(sequence = {}) {
      const beats = Array.isArray(sequence.beats) ? sequence.beats : [];
      const token = ++runToken;
      const root = ensureRoot();
      document.body.classList.add('tutorial-mode');

      for (const beat of beats) {
        if (token !== runToken) return false;
        await runBeat(root, beat);
      }

      if (token === runToken) {
        document.body.classList.remove('tutorial-mode');
        setCaption(root, '');
      }
      return true;
    }

    function stop() {
      runToken += 1;
      const root = document.getElementById('tutorialNarrator');
      if (root) setCaption(root, '');
      document.body.classList.remove('tutorial-mode');
    }

    return { start, stop };
  }

  window.BOKS_TUTORIAL_ENGINE = {
    create: createTutorialEngine,
    unlockAudio
  };
})();
