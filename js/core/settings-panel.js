(() => {
  function createSettingsPanel({
    isBlocked = () => false,
    isPrestart = () => document.body.classList.contains('prestart'),
    getAudioState = () => ({ backgroundMusicVolume: 1, soundEffectsEnabled: true }),
    setSoundEffectsEnabled = () => {},
    setBackgroundMusicVolume = () => {},
    onBeforeOpen = () => {},
    onResetProgress = () => {},
    onMainMenu = () => {},
    onToggleTabletLayout = () => {},
    isTabletLayout = () => false,
    onTogglePinchZoom = () => {},
    isPinchZoomEnabled = () => false,
    toast = () => {}
  } = {}) {
    let settingsOpen = false;

    function sync() {
      const header = document.getElementById('header');
      const settingsModal = document.getElementById('settingsModal');
      const sfxBtn = document.getElementById('settingsSfxBtn');
      const sfxSwitch = document.getElementById('settingsSfxSwitch');
      const musicSlider = document.getElementById('settingsMusicVolume');
      const musicValue = document.getElementById('settingsMusicVolumeValue');
      const creditsMeta = document.getElementById('settingsBuildMeta');
      const creditsBtn = document.getElementById('settingsCreditsBtn');
      const creditsPanel = document.getElementById('settingsCreditsPanel');
      const creditsPill = creditsBtn?.querySelector('.settings-pill');
      const resetBtn = document.getElementById('settingsResetProgressBtn');
      const resetPanel = document.getElementById('settingsResetProgressPanel');
      const resetPill = resetBtn?.querySelector('.settings-pill');
      const audioState = getAudioState();
      const musicVolume = Number(audioState.backgroundMusicVolume ?? 1);
      const sfxEnabled = audioState.soundEffectsEnabled !== false;

      if (settingsModal) {
        settingsModal.classList.toggle('show', settingsOpen);
        settingsModal.setAttribute('aria-hidden', settingsOpen ? 'false' : 'true');
      }
      if (header) {
        const headerLabel = settingsOpen ? 'Close settings' : 'Open settings';
        header.setAttribute('aria-label', headerLabel);
        header.setAttribute('title', headerLabel);
      }
      const tabletBtn = document.getElementById('settingsTabletBtn');
      const tabletSwitch = document.getElementById('settingsTabletSwitch');
      const tabletEnabled = isTabletLayout();
      if (tabletBtn) tabletBtn.setAttribute('aria-pressed', tabletEnabled ? 'true' : 'false');
      if (tabletSwitch) tabletSwitch.classList.toggle('is-on', tabletEnabled);

      const pinchBtn = document.getElementById('settingsPinchBtn');
      const pinchSwitch = document.getElementById('settingsPinchSwitch');
      const pinchEnabled = isPinchZoomEnabled();
      if (pinchBtn) pinchBtn.setAttribute('aria-pressed', pinchEnabled ? 'true' : 'false');
      if (pinchSwitch) pinchSwitch.classList.toggle('is-on', pinchEnabled);

      if (sfxBtn) sfxBtn.setAttribute('aria-pressed', sfxEnabled ? 'true' : 'false');
      if (sfxSwitch) sfxSwitch.classList.toggle('is-on', sfxEnabled);
      if (musicSlider) musicSlider.value = String(Math.round(musicVolume * 100));
      if (musicValue) musicValue.textContent = `${Math.round(musicVolume * 100)}%`;
      if (creditsBtn && creditsPanel) {
        const expanded = !creditsPanel.hidden;
        creditsBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        if (creditsPill) creditsPill.textContent = expanded ? 'Close' : 'Open';
      }
      if (resetBtn && resetPanel) {
        const expanded = !resetPanel.hidden;
        resetBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        if (resetPill) resetPill.textContent = expanded ? 'Close' : 'Open';
      }
      if (creditsMeta) {
        const build = window.BOKS_RUNTIME_CONFIG?.build || document.body?.dataset?.build || 'dev';
        const channel = window.BOKS_RUNTIME_CONFIG?.releaseChannel || document.body?.dataset?.releaseChannel || 'main';
        creditsMeta.textContent = `Build ${build}\nChannel ${channel}`;
      }
    }

    function close() {
      if (!settingsOpen) return;
      document.getElementById('settingsCreditsPanel')?.setAttribute('hidden', '');
      document.getElementById('settingsResetProgressPanel')?.setAttribute('hidden', '');
      settingsOpen = false;
      sync();
    }

    function open() {
      if (isPrestart()) return;
      if (isBlocked()) {
        toast('Wait for the move to finish');
        return;
      }
      onBeforeOpen();
      settingsOpen = true;
      sync();
    }

    function toggle() {
      if (settingsOpen) {
        close();
        return;
      }
      open();
    }

    function toggleCredits() {
      const panel = document.getElementById('settingsCreditsPanel');
      const resetPanel = document.getElementById('settingsResetProgressPanel');
      if (!panel) return;
      const shouldOpen = panel.hidden;
      panel.hidden = !shouldOpen;
      if (resetPanel) resetPanel.hidden = true;
      sync();
    }

    function toggleResetProgress() {
      const panel = document.getElementById('settingsResetProgressPanel');
      const creditsPanel = document.getElementById('settingsCreditsPanel');
      if (!panel) return;
      const shouldOpen = panel.hidden;
      panel.hidden = !shouldOpen;
      if (creditsPanel) creditsPanel.hidden = true;
      sync();
    }

    function openLanguageComingSoonNotice() {
      toast('More languages coming soon');
    }

    function resetProgress() {
      onResetProgress();
    }

    function goToMainMenu() {
      close();
      onMainMenu();
    }

    function isOpen() {
      return settingsOpen;
    }

    function bindEvents() {
      document.getElementById('header')?.addEventListener('click', toggle);
      document.getElementById('header')?.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        toggle();
      });
      document.getElementById('closeSettingsBtn')?.addEventListener('click', close);
      document.getElementById('settingsTabletBtn')?.addEventListener('click', () => {
        onToggleTabletLayout();
        sync();
      });
      document.getElementById('settingsPinchBtn')?.addEventListener('click', () => {
        onTogglePinchZoom();
        sync();
      });
      document.getElementById('settingsSfxBtn')?.addEventListener('click', () => {
        const audioState = getAudioState();
        setSoundEffectsEnabled(!(audioState.soundEffectsEnabled !== false));
      });
      document.getElementById('settingsMusicVolume')?.addEventListener('input', e => {
        const nextValue = Number(e.target?.value);
        setBackgroundMusicVolume(nextValue / 100);
      });
      document.getElementById('settingsLanguageBtn')?.addEventListener('click', openLanguageComingSoonNotice);
      document.getElementById('settingsCreditsBtn')?.addEventListener('click', toggleCredits);
      document.getElementById('settingsResetProgressBtn')?.addEventListener('click', toggleResetProgress);
      document.getElementById('cancelResetProgressBtn')?.addEventListener('click', toggleResetProgress);
      document.getElementById('confirmResetProgressBtn')?.addEventListener('click', resetProgress);
      document.getElementById('settingsMenuBtn')?.addEventListener('click', goToMainMenu);
      document.getElementById('settingsModal')?.addEventListener('click', e => {
        if (e.target?.id === 'settingsModal' || e.target?.classList?.contains('settings-shell')) close();
      });
    }

    return {
      bindEvents,
      close,
      isOpen,
      open,
      sync,
      toggle
    };
  }

  window.BOKS_SETTINGS_PANEL = {
    create: createSettingsPanel
  };
})();
