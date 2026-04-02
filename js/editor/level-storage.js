(function () {
  function createLevelStorage(api) {
    let editorLevelsCache = [];
    let projectLevelsSeed = [];

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

    function normalizeLevelHints(source = {}) {
      if (!source || typeof source !== 'object') return {};
      return {
        availableBlockGlow: !!source.availableBlockGlow
      };
    }

    function normalizeDecorationLayer(layer) {
      const normalized = typeof layer === 'string' ? layer.trim().toLowerCase() : '';
      return ['ground', 'object', 'overlay'].includes(normalized) ? normalized : 'object';
    }

    function normalizeDecorationScale(scale, fallback = 1) {
      const numeric = Number(scale);
      if (!Number.isFinite(numeric)) return fallback;
      return Math.max(0.5, Math.min(1.8, Math.round(numeric * 100) / 100));
    }

    function normalizeDecorationCount(count, fallback = 1) {
      const numeric = Number(count);
      if (!Number.isFinite(numeric)) return fallback;
      return Math.max(1, Math.min(10, Math.round(numeric)));
    }

    function normalizeDecorationColor(value, fallback = '') {
      const normalized = typeof value === 'string' ? value.trim().slice(0, 16) : '';
      return normalized || fallback;
    }

    function normalizeDecorationAnchor(value, fallback = 0.5) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return fallback;
      return Math.max(0, Math.min(1, Math.round(numeric * 1000) / 1000));
    }

    function normalizeDecorations(source = []) {
      if (!Array.isArray(source)) return [];
      return source.map((entry, index) => {
        const x = Number.isInteger(entry?.x) ? entry.x : null;
        const y = Number.isInteger(entry?.y) ? entry.y : null;
        const rawAsset = typeof entry?.asset === 'string' ? entry.asset.trim().slice(0, 48) : '';
        const asset = typeof api.resolveDecorationAssetId === 'function'
          ? api.resolveDecorationAssetId(rawAsset)
          : rawAsset;
        if (!asset) return null;
        const layer = normalizeDecorationLayer(entry?.layer);
        const fallbackAnchorX = Number.isInteger(x) && Number.isInteger(api.cols)
          ? ((x + 0.5) / api.cols)
          : 0.5;
        const fallbackAnchorY = Number.isInteger(y) && Number.isInteger(api.rows)
          ? ((y + 0.82) / api.rows)
          : 0.5;
        const anchorX = normalizeDecorationAnchor(entry?.anchorX, fallbackAnchorX);
        const anchorY = normalizeDecorationAnchor(entry?.anchorY, fallbackAnchorY);
        const resolvedX = Number.isInteger(api.cols)
          ? Math.max(0, Math.min(api.cols - 1, Math.floor(Math.min(anchorX, 0.9999) * api.cols)))
          : (x ?? 0);
        const resolvedY = Number.isInteger(api.rows)
          ? Math.max(0, Math.min(api.rows - 1, Math.floor(Math.min(anchorY, 0.9999) * api.rows)))
          : (y ?? 0);
        return {
          id: typeof entry?.id === 'string' && entry.id.trim()
            ? entry.id.trim().slice(0, 80)
            : `decor-${asset}-${Math.round(anchorX * 1000)}-${Math.round(anchorY * 1000)}-${index}`,
          x: resolvedX,
          y: resolvedY,
          anchorX,
          anchorY,
          asset,
          layer,
          scale: normalizeDecorationScale(entry?.scale, 1),
          count: normalizeDecorationCount(entry?.count, asset === 'bee_hover' ? 3 : 1),
          foliageColor: normalizeDecorationColor(entry?.foliageColor),
          trunkColor: normalizeDecorationColor(entry?.trunkColor)
        };
      }).filter(Boolean);
    }

    function normalizeCharacterId(characterId) {
      if (typeof api.resolveCharacterId === 'function') {
        return api.resolveCharacterId(characterId);
      }
      const normalized = typeof characterId === 'string' ? characterId.trim() : '';
      return normalized || 'boks_green';
    }

    function extractLevels(payload) {
      const levels = Array.isArray(payload) ? payload : payload?.levels;
      if (!Array.isArray(levels)) return [];
      return levels.map(normalizeCustomLevel);
    }

    function normalizeCustomLevel(level) {
      const normalizedCampaignIndex = Number.isInteger(level.campaignIndex)
        ? level.campaignIndex
        : (Number.isInteger(level.baseStepIndex) ? level.baseStepIndex : null);
      const normalizedBaseLevel = typeof level.baseLevel === 'string' && level.baseLevel.trim()
        ? level.baseLevel.trim()
        : api.customLevelTheme;
      const normalized = {
        id: level.id || `custom-${Date.now()}`,
        number: level.number ?? null,
        baseStepIndex: normalizedCampaignIndex,
        campaignIndex: normalizedCampaignIndex,
        name: normalizeLevelName(level.name || 'Livello custom') || 'Livello custom',
        icon: api.customIcons.includes(level.icon) ? level.icon : api.customIcons[0],
        baseLevel: normalizedBaseLevel,
        characterId: normalizeCharacterId(level.characterId),
        start: normalizePoint(level.start),
        goal: normalizePoint(level.goal),
        startOri: level.startOri || 'right',
        obstacles: Array.isArray(level.obstacles) ? level.obstacles : [],
        decorations: normalizeDecorations(level.decorations || []),
        mainSlotEnabled: normalizeSlotArray(level.mainSlotEnabled, api.slots),
        fnSlotEnabled: normalizeSlotArray(level.fnSlotEnabled, api.fnSlots),
        enabledBlocks: normalizeEnabledBlocks(level.enabledBlocks || {}),
        themeOverrides: normalizeThemeOverrides(level.themeOverrides || {}),
        levelHints: normalizeLevelHints(level.levelHints || {})
      };
      return normalized;
    }

    function editorLevelToTutorialStep(level) {
      const normalized = normalizeCustomLevel(level);
      return {
        campaignIndex: normalized.campaignIndex,
        baseLevel: normalized.baseLevel || api.customLevelTheme,
        characterId: normalizeCharacterId(normalized.characterId),
        start: normalized.start ? { ...normalized.start } : null,
        goal: normalized.goal ? { ...normalized.goal } : null,
        startOri: normalized.startOri || 'right',
        mainSlots: normalized.mainSlotEnabled.filter(Boolean).length,
        fnSlots: normalized.fnSlotEnabled.filter(Boolean).length,
        availableBlocks: Object.keys(normalized.enabledBlocks).filter(dir => normalized.enabledBlocks[dir]),
        obstacles: normalized.obstacles || [],
        decorations: normalizeDecorations(normalized.decorations || []),
        themeOverrides: normalizeThemeOverrides(normalized.themeOverrides || {}),
        levelHints: normalizeLevelHints(normalized.levelHints || {})
      };
    }

    function buildInitialEditorLevels() {
      if (projectLevelsSeed.length) {
        return projectLevelsSeed.map(normalizeCustomLevel);
      }
      const cachedProjectLevels = readStoredLevels(api.projectLevelsCacheKey);
      if (cachedProjectLevels.length) {
        return cachedProjectLevels;
      }
      return [];
    }

    function readStoredLevels(storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!Array.isArray(parsed) || !parsed.length) return [];
        return parsed.map(normalizeCustomLevel);
      } catch (_) {
        return [];
      }
    }

    function writeStoredLevels(storageKey, levels) {
      const normalizedLevels = levels.map(normalizeCustomLevel);
      try {
        localStorage.setItem(storageKey, JSON.stringify(normalizedLevels));
      } catch (_) {}
      return normalizedLevels;
    }

    function setActiveLevels(levels) {
      editorLevelsCache = levels.map(normalizeCustomLevel);
      return editorLevelsCache.map(normalizeCustomLevel);
    }

    function readCustomLevels() {
      if (editorLevelsCache.length) return editorLevelsCache.map(normalizeCustomLevel);

      const draftLevels = readStoredLevels(api.editorLevelsStorageKey);

      if (!api.preferProjectLevelsFile) {
        if (draftLevels.length) {
          return setActiveLevels(draftLevels);
        }
      }

      if (api.preferProjectLevelsFile && draftLevels.length && !isProjectSaveSupported()) {
        return setActiveLevels(draftLevels);
      }

      const projectLevels = buildInitialEditorLevels();
      if (projectLevels.length) {
        return setActiveLevels(projectLevels);
      }

      return [];
    }

    function writeCustomLevels(levels) {
      const normalizedLevels = writeStoredLevels(api.editorLevelsStorageKey, levels);
      editorLevelsCache = normalizedLevels;
    }

    function updateCachedLevel(level) {
      const normalized = normalizeCustomLevel(level);
      const sourceLevels = editorLevelsCache.length
        ? editorLevelsCache.map(normalizeCustomLevel)
        : buildInitialEditorLevels();
      const idx = sourceLevels.findIndex(entry => entry.id === normalized.id);
      if (idx >= 0) sourceLevels[idx] = normalized;
      else sourceLevels.push(normalized);
      editorLevelsCache = sourceLevels.map(normalizeCustomLevel);
      return normalized;
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
      const match = levels.find(level => (level.campaignIndex ?? level.baseStepIndex ?? null) === idx);
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
      let projectLevels = [];

      try {
        const response = await fetch(api.editorLevelsFilePath, { cache: 'no-store' });
        if (response.ok) {
          const levels = extractLevels(await response.json());
          if (levels.length) {
            projectLevelsSeed = levels.map(normalizeCustomLevel);
            writeStoredLevels(api.projectLevelsCacheKey, levels);
            projectLevels = levels.map(normalizeCustomLevel);
          }
        }
      } catch (_) {}

      if (api.preferProjectLevelsFile) {
        if (projectLevels.length) {
          setActiveLevels(projectLevels);
          return;
        }
        const cachedProjectLevels = readStoredLevels(api.projectLevelsCacheKey);
        if (cachedProjectLevels.length) {
          setActiveLevels(cachedProjectLevels);
          return;
        }
        return;
      }

      const draftLevels = readStoredLevels(api.editorLevelsStorageKey);
      if (draftLevels.length) {
        setActiveLevels(draftLevels);
        return;
      }

      if (projectLevels.length) {
        setActiveLevels(projectLevels);
        return;
      }

      const cachedProjectLevels = readStoredLevels(api.projectLevelsCacheKey);
      if (cachedProjectLevels.length) {
        setActiveLevels(cachedProjectLevels);
        return;
      }

      editorLevelsCache = [];
    }

    async function persistEditorLevels(levels, { promptIfMissing = false } = {}) {
      writeCustomLevels(levels);
      if (!isProjectSaveSupported()) {
        return {
          projectFileSaved: false,
          localOnly: true,
          browserDraftSaved: true
        };
      }
      try {
        const projectFileSaved = await writeProjectLevelsFile(levels, { promptIfMissing });
        if (projectFileSaved) {
          projectLevelsSeed = levels.map(normalizeCustomLevel);
          writeStoredLevels(api.projectLevelsCacheKey, levels);
        }
        return {
          projectFileSaved,
          localOnly: !projectFileSaved,
          browserDraftSaved: true
        };
      } catch (_err) {
        return {
          projectFileSaved: false,
          localOnly: true,
          browserDraftSaved: true
        };
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
      normalizeDecorations,
      normalizeEnabledBlocks,
      normalizeThemeOverrides,
      normalizeSlotArray,
      persistEditorLevels,
      readCustomLevels,
      updateCachedLevel,
      writeCustomLevels
    };
  }

  window.BOKS_LEVEL_STORAGE = createLevelStorage;
})();
