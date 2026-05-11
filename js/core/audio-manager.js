(() => {
  const BACKGROUND_MUSIC_STORAGE_KEY = 'boks-bgm-enabled';
  const BACKGROUND_MUSIC_VOLUME_STORAGE_KEY = 'boks-bgm-volume';
  const SOUND_EFFECTS_STORAGE_KEY = 'boks-sfx-enabled';
  const PROGRESS_STORAGE_KEY = 'boks-progress-v1';
  const BACKGROUND_MUSIC_VOLUME = 0.18;
  const LEVEL_ONE_INTRO_VOLUME = 0.72;
  const AUDIO_PATHS = Object.freeze({
    music: {
      gameLoop: 'assets/audio/music/game_loop_main.mp3',
      level01Intro: 'assets/audio/music/level_01_intro_main.ogg'
    },
    sfx: {
      ui: {
        blockDetach: 'assets/audio/sfx/ui/block_detach.ogg',
        blockDropSuccess: 'assets/audio/sfx/ui/block_drop_success.mp3',
        slotHover: 'assets/audio/sfx/ui/slot_hover.mp3',
        playPress: 'assets/audio/sfx/ui/play_press_main.mp3'
      },
      gameplay: {
        stepMove: 'assets/audio/sfx/gameplay/step_move_02.mp3',
        effort: 'assets/audio/sfx/gameplay/effort.mp3',
        errorAction: 'assets/audio/sfx/gameplay/error_action.mp3',
        boksAnnoyed: 'assets/audio/sfx/gameplay/boks_annoyed.ogg',
        welcome: 'assets/audio/sfx/gameplay/wellcome.mp3',
        decorRubberTap: [
          'assets/audio/sfx/gameplay/decor_rubber_tap_01.ogg',
          'assets/audio/sfx/gameplay/decor_rubber_tap_02.ogg'
        ],
        rotationPositionSandbox: 'assets/audio/sfx/gameplay/rotation_position.mp3',
        rotationPositionNormal: 'assets/audio/sfx/gameplay/rotation_position_02.mp3',
        goalBubbleBounce: 'assets/audio/sfx/gameplay/goal_bubble_bounce.ogg',
        bubblePop: 'assets/audio/sfx/gameplay/bubble_pop_main.ogg',
        levelComplete: 'assets/audio/sfx/gameplay/level_complete_main.mp3'
      }
    }
  });

  function clampUnitVolume(value, fallback = 1) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.min(1, numeric));
  }

  function readSoundEffectsEnabledPreference() {
    try {
      const stored = localStorage.getItem(SOUND_EFFECTS_STORAGE_KEY);
      return stored == null ? true : stored !== 'false';
    } catch (_err) {
      return true;
    }
  }

  function readBackgroundMusicVolumePreference() {
    try {
      const storedVolume = localStorage.getItem(BACKGROUND_MUSIC_VOLUME_STORAGE_KEY);
      if (storedVolume != null && storedVolume !== '') return clampUnitVolume(storedVolume, 1);
      const storedEnabled = localStorage.getItem(BACKGROUND_MUSIC_STORAGE_KEY);
      if (storedEnabled == null) return 1;
      return storedEnabled === 'false' ? 0 : 1;
    } catch (_err) {
      return 1;
    }
  }

  function sanitizeProgressState(raw) {
    const currentCampaignStep = Number.isFinite(raw?.currentCampaignStep)
      ? Math.max(0, Math.floor(raw.currentCampaignStep))
      : 0;
    const completedLevelIds = Array.isArray(raw?.completedLevelIds)
      ? [...new Set(raw.completedLevelIds.filter(id => typeof id === 'string' && id.trim()))]
      : [];
    const seenJourneyHints = Array.isArray(raw?.seenJourneyHints)
      ? [...new Set(raw.seenJourneyHints.filter(id => typeof id === 'string' && id.trim()))]
      : [];
    return {
      currentCampaignStep,
      completedLevelIds,
      seenJourneyHints
    };
  }

  function readProgressState() {
    try {
      const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!stored) return sanitizeProgressState({});
      return sanitizeProgressState(JSON.parse(stored));
    } catch (_err) {
      return sanitizeProgressState({});
    }
  }

  function createAudioManager({
    getBuild = () => window.BOKS_RUNTIME_CONFIG?.build || document.body?.dataset?.build || 'dev',
    isGameStarted = () => false,
    onSettingsChange = () => {}
  } = {}) {
    let fxAc;
    let backgroundMusicAudio = null;
    let backgroundMusicStarted = false;
    let levelOneIntroAudio = null;
    let levelOneIntroBgmTimer = null;
    let backgroundMusicVolume = readBackgroundMusicVolumePreference();
    let backgroundMusicEnabled = backgroundMusicVolume > 0.001;
    let soundEffectsEnabled = readSoundEffectsEnabledPreference();
    let progressState = readProgressState();
    const audioPlayers = new Map();

    const FX = () => {
      if (!fxAc) fxAc = new (window.AudioContext || window.webkitAudioContext)();
      if (fxAc.state === 'suspended') fxAc.resume();
      return fxAc;
    };

    function snapshot() {
      return {
        backgroundMusicVolume,
        backgroundMusicEnabled,
        soundEffectsEnabled,
        progressState
      };
    }

    function getVersionedAudioPath(path) {
      return `${path}?v=${encodeURIComponent(getBuild())}`;
    }

    function getBackgroundMusicLoopVolume() {
      return BACKGROUND_MUSIC_VOLUME * backgroundMusicVolume;
    }

    function getLevelOneIntroMixVolume() {
      return LEVEL_ONE_INTRO_VOLUME * backgroundMusicVolume;
    }

    function setProgressState(nextState, { persist = true } = {}) {
      progressState = sanitizeProgressState(nextState);
      if (!persist) return progressState;
      try {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressState));
      } catch (_err) {
        // ignore persistence issues
      }
      return progressState;
    }

    function resetJourneyProgressState() {
      return setProgressState({
        currentCampaignStep: 0,
        completedLevelIds: [],
        seenJourneyHints: []
      });
    }

    function applyBackgroundMusicVolumeToActiveAudio() {
      if (backgroundMusicAudio) {
        backgroundMusicAudio.muted = !backgroundMusicEnabled;
        backgroundMusicAudio.volume = getBackgroundMusicLoopVolume();
      }
      if (levelOneIntroAudio) {
        levelOneIntroAudio.muted = !backgroundMusicEnabled;
        levelOneIntroAudio.volume = getLevelOneIntroMixVolume();
      }
    }

    function setBackgroundMusicVolume(nextVolume, { persist = true } = {}) {
      backgroundMusicVolume = clampUnitVolume(nextVolume, backgroundMusicVolume);
      backgroundMusicEnabled = backgroundMusicVolume > 0.001;
      if (persist) {
        try {
          localStorage.setItem(BACKGROUND_MUSIC_VOLUME_STORAGE_KEY, String(backgroundMusicVolume));
          localStorage.setItem(BACKGROUND_MUSIC_STORAGE_KEY, backgroundMusicEnabled ? 'true' : 'false');
        } catch (_err) {
          // ignore persistence issues
        }
      }
      applyBackgroundMusicVolumeToActiveAudio();
      if (!backgroundMusicEnabled) {
        stopLevelOneIntro();
        pauseBackgroundMusicLoop();
      } else if (isGameStarted()) {
        startBackgroundMusicLoop();
      }
      onSettingsChange();
      return snapshot();
    }

    function setSoundEffectsEnabled(enabled, { persist = true } = {}) {
      soundEffectsEnabled = !!enabled;
      if (persist) {
        try {
          localStorage.setItem(SOUND_EFFECTS_STORAGE_KEY, soundEffectsEnabled ? 'true' : 'false');
        } catch (_err) {
          // ignore persistence issues
        }
      }
      onSettingsChange();
      return snapshot();
    }

    function getBackgroundMusicAudio() {
      if (backgroundMusicAudio) return backgroundMusicAudio;
      const audio = new Audio(getVersionedAudioPath(AUDIO_PATHS.music.gameLoop));
      audio.preload = 'auto';
      audio.loop = true;
      audio.muted = !backgroundMusicEnabled;
      audio.volume = getBackgroundMusicLoopVolume();
      backgroundMusicAudio = audio;
      return backgroundMusicAudio;
    }

    function startBackgroundMusicLoop() {
      if (!backgroundMusicEnabled) return;
      const audio = getBackgroundMusicAudio();
      audio.volume = getBackgroundMusicLoopVolume();
      backgroundMusicStarted = true;
      if (!audio.paused) return;
      const playAttempt = audio.play();
      if (playAttempt?.catch) playAttempt.catch(() => {});
    }

    function pauseBackgroundMusicLoop() {
      if (!backgroundMusicAudio) return;
      try {
        backgroundMusicAudio.pause();
      } catch (_err) {
        // ignore media pause issues
      }
    }

    function clearLevelOneIntroBgmTimer() {
      if (!levelOneIntroBgmTimer) return;
      clearTimeout(levelOneIntroBgmTimer);
      levelOneIntroBgmTimer = null;
    }

    function getLevelOneIntroAudio() {
      if (levelOneIntroAudio) return levelOneIntroAudio;
      const audio = new Audio(getVersionedAudioPath(AUDIO_PATHS.music.level01Intro));
      audio.preload = 'auto';
      audio.muted = !backgroundMusicEnabled;
      audio.volume = getLevelOneIntroMixVolume();
      levelOneIntroAudio = audio;
      return levelOneIntroAudio;
    }

    function getUiAudioSfxPlayer(path) {
      const cacheKey = getVersionedAudioPath(path);
      if (audioPlayers.has(cacheKey)) return audioPlayers.get(cacheKey);
      const audio = new Audio(cacheKey);
      audio.preload = 'auto';
      audioPlayers.set(cacheKey, audio);
      return audio;
    }

    function playUiAudioSfx(path, volume = 0.5, { mode = 'oneshot' } = {}) {
      if (!soundEffectsEnabled) return;
      try {
        const audio = mode === 'restart'
          ? getUiAudioSfxPlayer(path)
          : new Audio(getUiAudioSfxPlayer(path).src);
        audio.volume = volume;
        if (mode === 'restart') {
          audio.pause();
          try {
            audio.currentTime = 0;
          } catch (_err) {
            // ignore seek issues
          }
        }
        const playAttempt = audio.play();
        if (playAttempt?.catch) playAttempt.catch(() => {});
      } catch (_err) {
        // ignore ui audio failures
      }
    }

    function stopLevelOneIntro({ reset = true } = {}) {
      clearLevelOneIntroBgmTimer();
      if (!levelOneIntroAudio) return;
      try {
        levelOneIntroAudio.onended = null;
        levelOneIntroAudio.pause();
        if (reset) levelOneIntroAudio.currentTime = 0;
      } catch (_err) {
        // ignore media stop errors
      }
    }

    function playLevelOneIntroAndQueueBgm() {
      if (!backgroundMusicEnabled) {
        stopLevelOneIntro();
        clearLevelOneIntroBgmTimer();
        return;
      }
      stopLevelOneIntro();
      const audio = getLevelOneIntroAudio();
      clearLevelOneIntroBgmTimer();
      try {
        audio.currentTime = 0;
      } catch (_err) {
        // ignore seek issues
      }
      const playAttempt = audio.play();
      if (playAttempt?.catch) {
        playAttempt.catch(() => {});
      }
      const startLoop = () => {
        clearLevelOneIntroBgmTimer();
        startBackgroundMusicLoop();
      };
      audio.onended = startLoop;
      levelOneIntroBgmTimer = setTimeout(startLoop, 3200);
    }

    function resumeBackgroundMusicLoop() {
      if (!backgroundMusicEnabled || !backgroundMusicStarted) return;
      const audio = getBackgroundMusicAudio();
      audio.volume = getBackgroundMusicLoopVolume();
      const playAttempt = audio.play();
      if (playAttempt?.catch) playAttempt.catch(() => {});
    }

    function playTurnSfx(_dir = 'right') {
      playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.rotationPositionNormal, 0.28, { mode: 'restart' });
    }

    return {
      get state() {
        return snapshot();
      },
      setProgressState,
      resetJourneyProgressState,
      setBackgroundMusicVolume,
      setSoundEffectsEnabled,
      startBackgroundMusicLoop,
      pauseBackgroundMusicLoop,
      clearLevelOneIntroBgmTimer,
      stopLevelOneIntro,
      playLevelOneIntroAndQueueBgm,
      resumeBackgroundMusicLoop,
      playBlockDragStartSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.ui.blockDetach, 0.42),
      playBlockHoverSlotSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.ui.slotHover, 0.22),
      playBlockDropSuccessSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.ui.blockDropSuccess, 0.48),
      playStepSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.stepMove, 0.16, { mode: 'restart' }),
      playEffortSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.effort, 0.24, { mode: 'restart' }),
      playErrorSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.errorAction, 0.3),
      playBoksAnnoyedSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.boksAnnoyed, 0.34),
      playDecorationRubberSfx: () => {
        const variants = AUDIO_PATHS.sfx.gameplay.decorRubberTap;
        const path = variants[Math.floor(Math.random() * variants.length)] || variants[0];
        playUiAudioSfx(path, 0.26);
      },
      playSandboxRotationPositionSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.rotationPositionSandbox, 0.28),
      playNormalRotationPositionSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.rotationPositionNormal, 0.28, { mode: 'restart' }),
      playGoalBubbleBounceSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.goalBubbleBounce, 0.28),
      playBubblePopSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.bubblePop, 0.26),
      playWelcomeSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.welcome, 0.34),
      playLevelCompleteSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.levelComplete, 0.5),
      playRunPressSfx: () => playUiAudioSfx(AUDIO_PATHS.sfx.ui.playPress, 0.34),
      playTurnSfx
    };
  }

  window.BOKS_AUDIO_MANAGER = {
    create: createAudioManager,
    sanitizeProgressState
  };
})();
