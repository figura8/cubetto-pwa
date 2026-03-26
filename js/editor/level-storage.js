(function () {
  function createLevelStorage(api) {
    let editorLevelsCache = [];

    function normalizeLevelName(name = '') {
      return name.trim().replace(/\s+/g, ' ').slice(0, 32);
    }

    function normalizePoint(point, fallback = null) {
      if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
        return { x: point.x, y: point.y };
      }
      return fallback ? { ...fallback } : null;
    }

    function normalizeSlotArray(source = [], length) {
      return Array.from({ length }, (_, idx) => !!source[idx]);
    }

    function normalizeEnabledBlocks(source = {}) {
      return {
        forward: !!source.forward,
        left: !!source.left,
        right: !!source.right,
        function: !!source.function
      };
    }

    function normalizeThemeOverrides(source = {}) {
      if (!source || typeof source !== 'object') return {};
      return Object.entries(source).reduce((acc, [key, value]) => {
        if (typeof key !== 'string' || !key.startsWith('--')) return acc;
        if (typeof value !== 'string') return acc;
        const normalizedValue = value.trim();
        if (!normalizedValue) return acc;
        acc[key] = normalizedValue.slice(0, 64);
        return acc;
      }, {});
    }

    function normalizeCharacterId(characterId) {
      if (typeof api.resolveCharacterId === 'function') {
        return api.resolveCharacterId(characterId);
      }
      const normalized = typeof characterId === 'string' ? characterId.trim() : '';
      return normalized || 'boks_base';
    }

    function normalizeCustomLevel(level) {
      const normalizedBaseLevel = typeof level.baseLevel === 'string' && level.baseLevel.trim()
        ? level.baseLevel.trim()
        : api.customLevelTheme;
      return {
        id: level.id || `custom-${Date.now()}`,
        number: level.number ?? null,
        baseStepIndex: level.baseStepIndex ?? null,
        name: normalizeLevelName(level.name || 'Livello custom') || 'Livello custom',
        icon: api.customIcons.includes(level.icon) ? level.icon : api.customIcons[0],
        baseLevel: normalizedBaseLevel,
        characterId: normalizeCharacterId(level.characterId),
        start: normalizePoint(level.start),
        goal: normalizePoint(level.goal),
        startOri: level.startOri || 'right',
        obstacles: Array.isArray(level.obstacles) ? level.obstacles : [],
        mainSlotEnabled: normalizeSlotArray(level.mainSlotEnabled, api.slots),
        fnSlotEnabled: normalizeSlotArray(level.fnSlotEnabled, api.fnSlots),
        enabledBlocks: normalizeEnabledBlocks(level.enabledBlocks || {}),
        themeOverrides: normalizeThemeOverrides(level.themeOverrides || {})
      };
    }

    function tutorialStepToEditorLevel(step, idx) {
      const mainCount = Math.max(0, Math.min(api.slots, step.mainSlots ?? api.slots));
      const fnCount = Math.max(0, Math.min(api.fnSlots, step.fnSlots ?? 0));
      return normalizeCustomLevel({
        id: `level1-step-${idx + 1}`,
        number: idx + 1,
        baseStepIndex: idx,
        name: `Livello ${idx + 1}`,
        icon: api.customIcons[idx % api.customIcons.length],
        baseLevel: step.baseLevel || api.customLevelTheme,
        characterId: normalizeCharacterId(step.characterId),
        start: { ...(step.start || { x: 2, y: 2 }) },
        goal: { ...(step.goal || { x: 5, y: 5 }) },
        startOri: step.startOri || 'right',
        obstacles: step.obstacles || [],
        themeOverrides: normalizeThemeOverrides(step.themeOverrides || {}),
        mainSlotEnabled: Array.from({ length: api.slots }, (_, i) => i < mainCount),
        fnSlotEnabled: Array.from({ length: api.fnSlots }, (_, i) => i < fnCount),
        enabledBlocks: normalizeEnabledBlocks(
          Object.fromEntries(Object.keys(api.pool).map(dir => [dir, (step.availableBlocks || []).includes(dir)]))
        )
      });
    }

    function editorLevelToTutorialStep(level) {
      const normalized = normalizeCustomLevel(level);
      return {
        baseLevel: normalized.baseLevel || api.customLevelTheme,
        characterId: normalizeCharacterId(normalized.characterId),
        start: normalized.start ? { ...normalized.start } : null,
        goal: normalized.goal ? { ...normalized.goal } : null,
        startOri: normalized.startOri || 'right',
        mainSlots: normalized.mainSlotEnabled.filter(Boolean).length,
        fnSlots: normalized.fnSlotEnabled.filter(Boolean).length,
        availableBlocks: Object.keys(normalized.enabledBlocks).filter(dir => normalized.enabledBlocks[dir]),
        obstacles: normalized.obstacles || [],
        themeOverrides: normalizeThemeOverrides(normalized.themeOverrides || {})
      };
    }

    function buildInitialEditorLevels() {
      return api.getOfficialTutorialSteps().map((step, idx) => tutorialStepToEditorLevel(step, idx));
    }

    function readCustomLevels() {
      if (editorLevelsCache.length) return editorLevelsCache.map(normalizeCustomLevel);
      try {
        const raw = localStorage.getItem(api.editorLevelsStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!Array.isArray(parsed) || !parsed.length) {
          const seeded = buildInitialEditorLevels();
          editorLevelsCache = seeded.map(normalizeCustomLevel);
          return editorLevelsCache.map(normalizeCustomLevel);
        }
        editorLevelsCache = parsed.map(normalizeCustomLevel);
        return editorLevelsCache.map(normalizeCustomLevel);
      } catch (_) {
        const seeded = buildInitialEditorLevels();
        editorLevelsCache = seeded.map(normalizeCustomLevel);
        return editorLevelsCache.map(normalizeCustomLevel);
      }
    }

    function writeCustomLevels(levels) {
      editorLevelsCache = levels.map(normalizeCustomLevel);
      localStorage.setItem(api.editorLevelsStorageKey, JSON.stringify(editorLevelsCache));
    }

    function exportableLevelsPayload(levels = readCustomLevels()) {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        levels: levels.map(level => normalizeCustomLevel(level))
      };
    }

    function findCustomLevel(levelId) {
      return readCustomLevels().find(level => level.id === levelId) || null;
    }

    function getEditorLevelIdForTutorialStep(idx = api.getTutorialStepIndex()) {
      const levels = readCustomLevels();
      const match = levels.find(level => (level.baseStepIndex ?? null) === idx);
      return match?.id || `level1-step-${idx + 1}`;
    }

    function isProjectSaveSupported() {
      return !!(window.isSecureContext && window.showSaveFilePicker && window.indexedDB && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      ));
    }

    function openFileHandleDb() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(api.fileHandleDbName, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(api.fileHandleStoreName)) {
            db.createObjectStore(api.fileHandleStoreName);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    async function getStoredFileHandle() {
      if (!isProjectSaveSupported()) return null;
      const db = await openFileHandleDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(api.fileHandleStoreName, 'readonly');
        const store = tx.objectStore(api.fileHandleStoreName);
        const request = store.get(api.editorLevelsFileHandleKey);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    }

    async function storeFileHandle(handle) {
      if (!isProjectSaveSupported()) return;
      const db = await openFileHandleDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(api.fileHandleStoreName, 'readwrite');
        const store = tx.objectStore(api.fileHandleStoreName);
        const request = store.put(handle, api.editorLevelsFileHandleKey);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    async function ensureProjectFilePermission(handle) {
      if (!handle) return false;
      if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
      return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted';
    }

    async function requestProjectLevelsFileHandle() {
      if (!isProjectSaveSupported()) return null;
      const handle = await window.showSaveFilePicker({
        suggestedName: api.editorLevelsSuggestedName,
        types: [{
          description: 'JSON levels file',
          accept: { 'application/json': ['.json'] }
        }]
      });
      await storeFileHandle(handle);
      return handle;
    }

    async function getProjectLevelsFileHandle({ promptIfMissing = false } = {}) {
      if (!isProjectSaveSupported()) return null;
      let handle = await getStoredFileHandle();
      if (handle && await ensureProjectFilePermission(handle)) return handle;
      if (!promptIfMissing) return null;
      handle = await requestProjectLevelsFileHandle();
      if (handle && await ensureProjectFilePermission(handle)) return handle;
      return null;
    }

    async function writeProjectLevelsFile(levels, { promptIfMissing = false } = {}) {
      const handle = await getProjectLevelsFileHandle({ promptIfMissing });
      if (!handle) return false;
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(exportableLevelsPayload(levels), null, 2));
      await writable.close();
      return true;
    }

    async function loadEditorLevelsSource() {
      try {
        const raw = localStorage.getItem(api.editorLevelsStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed) && parsed.length) {
          editorLevelsCache = parsed.map(normalizeCustomLevel);
          return;
        }
      } catch (_) {
        // Se la cache locale e corrotta, proviamo sotto con file progetto/fallback.
      }

      try {
        const response = await fetch(api.editorLevelsFilePath, { cache: 'no-store' });
        if (response.ok) {
          const payload = await response.json();
          const levels = Array.isArray(payload) ? payload : payload?.levels;
          if (Array.isArray(levels) && levels.length) {
            writeCustomLevels(levels);
            return;
          }
        }
      } catch (_) {}

      const fallback = readCustomLevels();
      if (fallback.length) {
        editorLevelsCache = fallback.map(normalizeCustomLevel);
        return;
      }

      writeCustomLevels(buildInitialEditorLevels());
    }

    async function persistEditorLevels(levels, { promptIfMissing = false } = {}) {
      writeCustomLevels(levels);
      if (!isProjectSaveSupported()) return { projectFileSaved: false, localOnly: true };
      try {
        const projectFileSaved = await writeProjectLevelsFile(levels, { promptIfMissing });
        return { projectFileSaved, localOnly: !projectFileSaved };
      } catch (_err) {
        return { projectFileSaved: false, localOnly: true };
      }
    }

    return {
      buildInitialEditorLevels,
      editorLevelToTutorialStep,
      exportableLevelsPayload,
      findCustomLevel,
      getEditorLevelIdForTutorialStep,
      loadEditorLevelsSource,
      normalizeCustomLevel,
      normalizeEnabledBlocks,
      normalizeThemeOverrides,
      normalizeSlotArray,
      persistEditorLevels,
      readCustomLevels,
      tutorialStepToEditorLevel,
      writeCustomLevels
    };
  }

  window.BOKS_LEVEL_STORAGE = createLevelStorage;
})();
