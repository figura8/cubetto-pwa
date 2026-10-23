(function () {
  'use strict';
  const definitions = new Map(), compiled = new Map();
  const decorations = new Map();
  const styleKeys = ['--world-surface-art', '--world-tile-alternate'];
  const svgUrl = markup => `url("data:image/svg+xml,${encodeURIComponent(markup || '').replace(/'/g, '%27')}")`;
  function register(payload, levels = window.BOKS_LEVELS) {
    if (!levels?.level1 || !Array.isArray(payload?.themes)) throw new Error('Invalid board theme catalog');
    for (const decoration of payload.decorations || []) {
      if (!/^[a-z0-9_]+$/.test(decoration.id) || !decoration.label || !decoration.svg?.startsWith('<svg')) throw new Error('Invalid manual decoration');
      decorations.set(decoration.id, decoration);
    }
    for (const source of payload.themes) {
      if (!source || !/^[a-z0-9-]+$/.test(source.id) || !source.displayName) throw new Error('Invalid board theme identity');
      if (source.useExistingVisuals) {
        if (!levels[source.id]) throw new Error(`Missing baseline: ${source.id}`);
        definitions.set(source.id, source);
        continue;
      }
      const palette = source.palette;
      if (!palette || !['board', 'tile', 'alternate', 'border'].every(key => /^#[a-f0-9]{6}$/i.test(palette[key]))) throw new Error(`Invalid palette: ${source.id}`);
      const theme = { ...source };
      const art = {
        surface: svgUrl(theme.surfaceSvg)
      };
      definitions.set(theme.id, theme);
      compiled.set(theme.id, art);
      levels[theme.id] = {
        id: theme.id, name: theme.displayName, themeSelectable: true, worldTheme: true,
        themeLabel: theme.displayName, themeHint: theme.description, characterId: levels.level1.characterId,
        thumbnailPalette: { ...levels.level1.thumbnailPalette, scene: palette.board, cellA: palette.tile, cellB: palette.alternate, cellStroke: palette.border },
        sceneVars: {
          ...levels.level1.sceneVars,
          '--scene-grid-wrap-bg': palette.board,
          '--grid-bg': palette.border, '--cell-bg': palette.tile, '--cell-edge': palette.border
        },
        renderGoal: levels.level1.renderGoal, renderSprite: levels.level1.renderSprite,
        renderBackground() {
          const canvas = document.getElementById('bgCanvas'), context = canvas?.getContext('2d');
          if (!context) return;
          context.save(); context.setTransform(1, 0, 0, 1, 0, 0);
          context.clearRect(0, 0, canvas.width, canvas.height); context.restore();
        },
        decorateCell(cell, x, y) { cell.classList.toggle('world-cell-alternate', (x + y) % 2 === 1); }
      };
    }
    return list();
  }
  async function load(url = 'data/board-themes.json') {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Board themes: HTTP ${response.status}`);
    return register(await response.json());
  }
  function list() { return Array.from(definitions.values()); }
  function get(id) { return definitions.get(id) || definitions.get('level1'); }
  function applyStyles(id, root = document.documentElement, body = document.body) {
    const theme = definitions.get(id), art = compiled.get(id);
    for (const key of styleKeys) root.style.removeProperty(key);
    if (!theme || !art) { delete body.dataset.worldTheme; return; }
    body.dataset.worldTheme = id;
    root.style.setProperty('--world-surface-art', art.surface);
    root.style.setProperty('--world-tile-alternate', theme.palette.alternate);
  }
  function thumbnail(id) {
    const theme = definitions.get(id);
    if (!theme || theme.useExistingVisuals) return '';
    const p = theme.palette, art = encodeURIComponent(theme.surfaceSvg || '').replace(/'/g, '%27');
    return `<svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true"><rect width="48" height="48" rx="5" fill="${p.board}"/><path d="M5 5H43V43H5Z" fill="${p.tile}" stroke="${p.border}"/><image href="data:image/svg+xml,${art}" x="5" y="5" width="38" height="38"/><path d="M18 5V43M31 5V43M5 18H43M5 31H43" stroke="${p.border}"/></svg>`;
  }
  function decorationAssets() {
    return Object.fromEntries(Array.from(decorations, ([id, source]) => [id, { ...source, svg: source.svg.replace('<svg ', '<svg class="cell-decoration-svg" aria-hidden="true" ') }]));
  }
  window.BOKS_BOARD_THEMES = { load, register, list, get, applyStyles, thumbnail, decorationAssets };
})();
