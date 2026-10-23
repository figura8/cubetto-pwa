(async function () {
  'use strict';
  const sample = Object.freeze({
    id: 'theme-comparison', start: Object.freeze({ x: 0, y: 5 }), goal: Object.freeze({ x: 0, y: 1 }), startOri: 'up',
    obstacles: Object.freeze([[1, 2], [2, 3], [2, 4], [2, 5]].map(([x, y]) => Object.freeze({ x, y }))),
    mainSlots: 4, fnSlots: 0, commands: Object.freeze(['forward']), solution: Object.freeze(['forward', 'forward', 'forward', 'forward'])
  });
  window.BOKS_THEME_PREVIEW_LEVEL = sample;
  const api = window.BOKS_BOARD_THEMES;
  const select = document.getElementById('previewTheme');
  const board = document.getElementById('previewBoard');
  const labels = { board: 'Cornice griglia', tile: 'Cella', alternate: 'Alternata', border: 'Bordo celle' };
  let themes = [], active = null;
  function render(id, updateInspector = true) {
    active = api.get(id);
    const level = window.BOKS_LEVELS[active.id];
    Object.entries(level.sceneVars).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
    api.applyStyles(active.id);
    board.replaceChildren();
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell'; cell.dataset.cx = x; cell.dataset.cy = y;
      const obstacle = sample.obstacles.some(point => point.x === x && point.y === y);
      const hero = sample.start.x === x && sample.start.y === y;
      const goal = sample.goal.x === x && sample.goal.y === y;
      if (level.worldTheme) level.decorateCell?.(cell, x, y);
      if (obstacle) { cell.className = 'cell obstacle-cell'; }
      if (goal) {
        cell.className = 'cell goal-cell';
        const visual = document.createElement('div'); visual.className = 'preview-goal'; visual.innerHTML = level.renderGoal(); cell.appendChild(visual);
      }
      if (hero) {
        const image = document.createElement('img'); image.className = 'preview-hero';
        image.src = '../assets/characters/boks_green/base-up-green.svg'; image.alt = 'BÖKS verso su'; cell.appendChild(image);
      }
      board.appendChild(cell);
    }
    document.getElementById('themeDescription').textContent = active.description;
    document.getElementById('artStatus').textContent = active.placeholder ? 'Art provvisoria: forme SVG leggere. BÖKS e goal conservano la grafica originale.' : 'Prato originale BÖKS.';
    if (updateInspector) fillInspector(active);
  }
  function fillInspector(theme) {
    // The original Meadow is immutable; author a new world from its palette instead.
    const p = theme.palette || { board: '#d7efba', tile: '#cfeaa5', alternate: '#d8efb6', border: '#9dc56b' };
    document.getElementById('themeName').value = theme.displayName + ' (copia)';
    document.getElementById('themeId').value = (theme.id === 'level1' ? 'world-meadow' : theme.id) + '-copy';
    const fields = document.getElementById('paletteFields'); fields.replaceChildren();
    Object.entries(labels).forEach(([key, label]) => {
      const wrap = document.createElement('label'); wrap.textContent = label;
      const input = document.createElement('input'); input.type = 'color'; input.dataset.palette = key; input.value = p[key]; wrap.appendChild(input); fields.appendChild(wrap);
    });
  }
  function readCopy() {
    const id = document.getElementById('themeId').value.trim();
    if (!/^[a-z0-9-]+$/.test(id) || window.BOKS_LEVELS[id] && id !== 'world-author-preview') throw new Error('Scegli un ID nuovo usando lettere minuscole, numeri e trattini.');
    const original = active.useExistingVisuals ? themes.find(theme => theme.id === 'world-camping') : active;
    const copy = { ...original, id, displayName: document.getElementById('themeName').value.trim(), palette: {}, useExistingVisuals: false, placeholder: true };
    document.querySelectorAll('[data-palette]').forEach(input => { copy.palette[input.dataset.palette] = input.value; });
    if (!copy.displayName) throw new Error('Inserisci un nome per il tema.');
    return copy;
  }
  function inspectorAction(exportFile) {
    try {
      const theme = readCopy();
      if (exportFile) {
        const url = URL.createObjectURL(new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = theme.id + '.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        api.register({ themes: [{ ...theme, id: 'world-author-preview' }] });
        render('world-author-preview', false);
      }
      document.getElementById('inspectorStatus').textContent = exportFile ? 'Definizione scaricata. Aggiungila al catalogo per usarla nel gioco.' : 'Copia in anteprima. Il puzzle resta identico.';
    } catch (err) { document.getElementById('inspectorStatus').textContent = err.message; }
  }
  try {
    themes = await api.load('../data/board-themes.json');
    document.getElementById('themeCountTitle').textContent = `Un livello, ${themes.length} mondi`;
    themes.forEach(theme => { const option = document.createElement('option'); option.value = theme.id; option.textContent = theme.displayName; select.appendChild(option); });
    const requested = new URL(location.href).searchParams.get('theme');
    select.value = themes.some(theme => theme.id === requested) ? requested : 'level1';
    select.addEventListener('change', () => render(select.value));
    function cycle(delta) { select.selectedIndex = (select.selectedIndex + delta + themes.length) % themes.length; render(select.value); }
    document.getElementById('previousTheme').addEventListener('click', () => cycle(-1));
    document.getElementById('nextTheme').addEventListener('click', () => cycle(1));
    document.getElementById('applyPreview').addEventListener('click', () => inspectorAction(false));
    document.getElementById('exportTheme').addEventListener('click', () => inspectorAction(true));
    render(select.value);
  } catch (err) { document.getElementById('previewError').textContent = 'Anteprima non disponibile: ' + err.message; }
})();
