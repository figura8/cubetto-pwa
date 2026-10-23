const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/editor/level-storage.js'), 'utf8');

function createStorage(fetchImpl, draft = null) {
  const values = new Map([['project-cache', JSON.stringify([{ id: 'old-campaign', name: 'Old', baseLevel: 'level1', start: { x: 0, y: 0 } }])]]);
  if (draft) values.set('editor-drafts', JSON.stringify([draft]));
  const context = {
    window: {},
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    },
    fetch: fetchImpl
  };
  vm.runInNewContext(source, context);
  return context.window.BOKS_LEVEL_STORAGE({
    cols: 6, rows: 6, slots: 8, fnSlots: 4,
    customIcons: ['leaf'], customLevelTheme: 'level1',
    projectLevelsCacheKey: 'project-cache',
    editorLevelsStorageKey: 'editor-drafts',
    editorLevelsFilePath: './data/editor-levels.json',
    preferProjectLevelsFile: true
  });
}

test('fresh project campaign takes priority over cached campaign before startup continues', async () => {
  const storage = createStorage(async () => ({
    ok: true,
    json: async () => ({ levels: [{ id: 'new-campaign', name: 'New' }] })
  }));
  await storage.loadEditorLevelsSource();
  assert.equal(storage.readCustomLevels()[0].id, 'new-campaign');
});

test('cached campaign remains available offline', async () => {
  const storage = createStorage(async () => { throw new Error('offline'); });
  await storage.loadEditorLevelsSource();
  assert.equal(storage.readCustomLevels()[0].id, 'old-campaign');
});

test('browser color edits survive reload while new puzzle data comes from the project', async () => {
  const storage = createStorage(async () => ({
    ok: true,
    json: async () => ({ levels: [{ id: 'old-campaign', name: 'Updated', baseLevel: 'level1', start: { x: 2, y: 3 } }] })
  }), { id: 'old-campaign', name: 'Old', baseLevel: 'level1', start: { x: 0, y: 0 }, themeOverrides: { '--cell-bg': '#ff0000' } });
  await storage.loadEditorLevelsSource();
  const level = storage.readCustomLevels()[0];
  assert.equal(level.name, 'Updated');
  assert.equal(level.start.x, 2);
  assert.equal(level.themeOverrides['--cell-bg'], '#ff0000');
});
