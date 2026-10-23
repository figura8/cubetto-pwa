const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/board-themes.json'), 'utf8'));
const source = fs.readFileSync(path.join(root, 'js/themes/board-themes.js'), 'utf8');
function setup() {
  const meadow = { id: 'level1', sceneVars: { '--scene-body-bg': 'original-page', '--panel-bg': '#ede7d7', '--obstacle-bg-top': '#cdb894', '--obstacle-edge': '#856843' }, thumbnailPalette: {}, renderGoal() {}, renderSprite() {} };
  const window = { BOKS_LEVELS: { level1: meadow } };
  vm.runInNewContext(source, { window });
  window.BOKS_BOARD_THEMES.register(catalog);
  return { api: window.BOKS_BOARD_THEMES, levels: window.BOKS_LEVELS, meadow };
}
function cell() {
  const classes = new Set(), styles = new Map();
  return { classes, styles, classList: { add: value => classes.add(value), toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value) }, style: { setProperty: (key, value) => styles.set(key, value) } };
}
test('thirty unique worlds preserve Meadow and reuse the approved actor and goal', () => {
  const { api, levels, meadow } = setup();
  assert.equal(api.list().length, 30);
  assert.equal(new Set(api.list().map(theme => theme.id)).size, 30);
  assert.equal(levels.level1, meadow);
  for (const theme of api.list().filter(theme => !theme.useExistingVisuals)) {
    assert.equal(levels[theme.id].renderGoal, meadow.renderGoal);
    assert.equal(levels[theme.id].renderSprite, meadow.renderSprite);
    assert.ok(theme.placeholder);
    for (const art of [theme.surfaceSvg]) {
      assert.match(art, /^<svg/);
      assert.doesNotMatch(art, /<script|foreignObject|<image|onload=/i);
    }
  }
});
test('theme data contains no puzzle rules and each world has distinct art', () => {
  const worlds = catalog.themes.filter(theme => !theme.useExistingVisuals);
  assert.equal(new Set(worlds.map(theme => theme.surfaceSvg)).size, 29);
  for (const theme of catalog.themes) {
    for (const key of ['start', 'goal', 'obstacles', 'commands', 'solution', 'mainSlots', 'fnSlots']) assert.equal(key in theme, false);
  }
});
test('themes never generate decorative props', () => {
  const { api, levels } = setup();
  for (const theme of api.list().filter(theme => !theme.useExistingVisuals)) {
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      const a = cell(), b = cell(), protectedCell = cell();
      const context = { levelId: 'same-level', protectedCell: false };
      levels[theme.id].decorateCell(a, x, y, context);
      levels[theme.id].decorateCell(b, x, y, context);
      assert.deepEqual(a.classes, b.classes);
      assert.deepEqual(a.styles, b.styles);
      levels[theme.id].decorateCell(protectedCell, x, y, { ...context, protectedCell: true });
      assert.equal(protectedCell.classes.has('world-cell-detail'), false);
    }
  }
});
test('returning to Meadow removes theme styles; unknown theme safely resolves to Meadow', () => {
  const { api } = setup();
  const styles = new Map(), classes = new Set();
  const root = { style: { setProperty: (key, value) => styles.set(key, value), removeProperty: key => styles.delete(key) } };
  const body = { dataset: {}, classList: { remove: value => classes.delete(value), toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value) } };
  api.applyStyles('world-space', root, body);
  assert.equal(body.dataset.worldTheme, 'world-space');
  assert.equal(styles.size, 2);
  api.applyStyles('level1', root, body);
  assert.equal(styles.size, 0);
  assert.equal(body.dataset.worldTheme, undefined);
  assert.equal(api.get('missing').id, 'level1');
});
test('a new authored theme registers without changing gameplay or adding props', () => {
  const { api, levels } = setup();
  const custom = { ...catalog.themes[1], id: 'world-custom' };
  api.register({ themes: [custom] });
  assert.equal(api.get(custom.id).id, 'world-custom');
  const target = cell();
  levels[custom.id].decorateCell(target, 2, 2, { levelId: 'sample' });
  assert.equal(target.classes.has('world-cell-detail'), false);
  assert.ok(api.thumbnail(custom.id).includes('<svg'));
});
test('all migrated props are available as manual decoration tools', () => {
  const { api } = setup();
  const assets = api.decorationAssets();
  assert.equal(Object.keys(assets).length, 12);
  for (const entry of catalog.decorations) {
    assert.equal(assets[entry.id].label, entry.label);
    assert.equal(assets[entry.id].layer, 'object');
    assert.match(assets[entry.id].svg, /class="cell-decoration-svg"/);
    assert.doesNotMatch(assets[entry.id].svg, /<script|foreignObject|<image|onload=/i);
  }
  for (const theme of catalog.themes) {
    assert.equal(theme.decorativeSvgs, undefined);
    assert.equal(theme.decorationDensity, undefined);
  }
});
test('themes preserve all baseline styles outside the grid, including bricks', () => {
  const { api, levels, meadow } = setup();
  const gridKeys = new Set(['--scene-grid-wrap-bg', '--grid-bg', '--cell-bg', '--cell-edge']);
  for (const theme of api.list().filter(theme => !theme.useExistingVisuals)) {
    for (const key of Object.keys(levels[theme.id].sceneVars)) {
      if (!gridKeys.has(key)) assert.equal(levels[theme.id].sceneVars[key], meadow.sceneVars[key]);
    }
    assert.equal(theme.obstacleSvg, undefined);
    assert.equal(theme.edgeSvgs, undefined);
    assert.deepEqual(Object.keys(theme.palette).sort(), ['alternate', 'board', 'border', 'tile']);
  }
});
