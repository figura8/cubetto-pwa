(() => {
  const body = document.body;
  const build = body?.dataset.build || 'dev';
  const badge = document.getElementById('buildBadge');
  const editorEnabled = body?.dataset.editorEnabled !== 'false';
  const debugToolsEnabled = body?.dataset.debugToolsEnabled !== 'false';
  const buildBadgeEnabled = body?.dataset.buildBadgeEnabled !== 'false';

  window.BOKS_RUNTIME_CONFIG = {
    releaseChannel: body?.dataset.releaseChannel || 'main',
    editorEnabled,
    debugToolsEnabled,
    buildBadgeEnabled
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

  if (badge && buildBadgeEnabled) {
    const formattedStamp = formatBuildStamp(build);
    badge.textContent = formattedStamp
      ? `build ${build}\n${formattedStamp}`
      : `build ${build}`;
  } else if (badge) {
    badge.textContent = '';
  }

  const startSubtitle = document.querySelector('#startGate .start-subtitle');
  if (startSubtitle && !editorEnabled) {
    startSubtitle.textContent = 'Tocca play per iniziare il percorso.';
  }

  const files = [
    'assets/animations/characters/boks/manifest.js',
    'js/core/character/character-renderer.js',
    'js/levels/level1.js',
    'js/editor/solver.js',
    'js/editor/level-storage.js',
    'js/editor/level-editor.js',
    'js/core/game.js',
    'js/core/sw-register.js'
  ];

  async function loadScript(src) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${src}?v=${encodeURIComponent(build)}`;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  }

  (async () => {
    for (const file of files) {
      await loadScript(file);
    }
  })().catch(err => {
    console.error('App bootstrap failed:', err);
  });
})();
