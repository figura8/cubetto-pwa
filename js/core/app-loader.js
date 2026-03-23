(() => {
  const build = document.body?.dataset.build || 'dev';
  const badge = document.getElementById('buildBadge');

  function formatBuildStamp(value) {
    const match = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(value);
    if (!match) return null;
    const [, year, month, day, hour, minute, second] = match;
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }

  if (badge) {
    const formattedStamp = formatBuildStamp(build);
    badge.textContent = formattedStamp
      ? `build ${build}\n${formattedStamp}`
      : `build ${build}`;
  }

  const files = [
    'assets/animations/characters/boks/manifest.js',
    'js/core/character/character-renderer.js',
    'js/levels/level1.js',
    'js/editor/solver.js',
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
