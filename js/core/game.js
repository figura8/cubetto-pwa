// ═══ CONSTANTS ═══
const COLS = 6, ROWS = 6, SLOTS = 8, FSLOTS = 4;
let GOAL = {x:5,y:5};
let START = {x:2,y:2};
const gridCellEls = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const coarsePointer = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : true;
const runtimePerf = window.BOKS_RUNTIME_CONFIG?.perf || null;
let appSceneVisible = document.visibilityState !== 'hidden';

function getCanvasDprCap() {
  return coarsePointer ? 1.6 : 2;
}

function getEffectiveCanvasDpr() {
  return Math.max(1, Math.min(getCanvasDprCap(), window.devicePixelRatio || 1));
}

function recordPerfMetric(name, durationMs, detail = {}) {
  return runtimePerf?.record?.(name, durationMs, detail) || null;
}

function markPerfMetricStart(name) {
  runtimePerf?.markStart?.(name);
}

function markPerfMetricEnd(name, detail = {}) {
  return runtimePerf?.markEnd?.(name, detail) || null;
}

function getGridCell(x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null;
  const cached = gridCellEls[y]?.[x] || null;
  if (cached?.isConnected) return cached;
  const cell = document.querySelector(`.cell[data-cx="${x}"][data-cy="${y}"]`);
  if (gridCellEls[y]) gridCellEls[y][x] = cell || null;
  return cell || null;
}

function moveGoal() {
  const old = document.querySelector('.goal-cell');
  if(old) {
    old.classList.remove('is-annoyed');
    old.classList.remove('goal-cell');
    old.innerHTML = '';
    old.style.position = '';
    old.style.overflow = '';
  }
  let nx, ny, attempts = 0;
  do {
    nx = Math.floor(Math.random()*COLS);
    ny = Math.floor(Math.random()*ROWS);
    attempts++;
  } while(
    attempts < 100 &&
    (Math.abs(nx-pos.x)+Math.abs(ny-pos.y) < 3 ||
     (nx===START.x && ny===START.y))
  );
  GOAL = {x:nx, y:ny};
  const cell = getGridCell(nx, ny);
  if(cell) {
    cell.classList.remove(...DECOR_CLASSES);
    cell.classList.add('goal-cell');
    cell.style.position = 'relative';
    cell.style.overflow = 'visible';
    applyGoalTapAnnoyanceState();
  }
  sizeGoalCanvasLayers();
}
let goalIdleCanvasFrame = null;
let goalPopCanvasFrame = null;
let goalPopCanvasDpr = getEffectiveCanvasDpr();
let goalIdleCanvasDpr = getEffectiveCanvasDpr();
let goalBubblePopUntil = 0;
let goalCanvasPopStartedAt = 0;
let goalCanvasParticles = [];
let goalCanvasPopOrigin = { x: 0, y: 0 };
let goalCanvasPopProfile = null;

function ensureGoalCanvasLayers() {
  const wrap = document.getElementById('gridWrap');
  if (!wrap) return null;
  let idle = document.getElementById('goalIdleCanvas');
  let pop = document.getElementById('goalPopCanvas');
  if (!idle) {
    idle = document.createElement('canvas');
    idle.id = 'goalIdleCanvas';
    idle.setAttribute('aria-hidden', 'true');
    wrap.appendChild(idle);
  }
  if (!pop) {
    pop = document.createElement('canvas');
    pop.id = 'goalPopCanvas';
    pop.setAttribute('aria-hidden', 'true');
    wrap.appendChild(pop);
  }
  return { idle, pop };
}
function getGoalCanvasOrigin() {
  const goalCell = document.querySelector('.goal-cell');
  const wrap = document.getElementById('gridWrap');
  if (!goalCell || !wrap) return null;
  const wrapRect = wrap.getBoundingClientRect();
  const goalRect = goalCell.getBoundingClientRect();
  return {
    x: goalRect.left - wrapRect.left + (goalRect.width * 0.5),
    y: goalRect.top - wrapRect.top + (goalRect.height * 0.5)
  };
}
function sizeGoalCanvasLayers() {
  const layers = ensureGoalCanvasLayers();
  const grid = document.getElementById('gameGrid');
  const wrap = document.getElementById('gridWrap');
  if (!layers || !grid || !wrap) return;
  const rect = grid.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  const left = rect.left - wrapRect.left;
  const top = rect.top - wrapRect.top;
  [layers.idle, layers.pop].forEach((canvas, index) => {
    const dpr = getEffectiveCanvasDpr();
    if (index === 0) goalIdleCanvasDpr = dpr;
    else goalPopCanvasDpr = dpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  });
}
function clearCanvas(canvas, dpr) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
}
function drawGoalIdleCanvas(now) {
  const idleCanvas = document.getElementById('goalIdleCanvas');
  if (!idleCanvas || !goalPlaced || !appSceneVisible) {
    goalIdleCanvasFrame = null;
    return;
  }
  const ctx = idleCanvas.getContext('2d');
  const origin = getGoalCanvasOrigin();
  if (!ctx || !origin) {
    goalIdleCanvasFrame = window.requestAnimationFrame(drawGoalIdleCanvas);
    return;
  }
  clearCanvas(idleCanvas, goalIdleCanvasDpr);
  if ((window.performance?.now?.() || Date.now()) >= goalBubblePopUntil) {
    const t = now / 1000;
    const annoyanceProgress = getGoalTapAnnoyanceProgress();
    const annoyanceWave = annoyanceProgress > 0
      ? Math.sin(annoyanceProgress * Math.PI * 1.18)
      : 0;
    const annoyanceLift = annoyanceProgress > 0
      ? Math.sin(annoyanceProgress * Math.PI) * 8.5
      : 0;
    const annoyanceSquashX = annoyanceProgress > 0
      ? 1 + (annoyanceWave * 0.08)
      : 1;
    const annoyanceSquashY = annoyanceProgress > 0
      ? 1 - (annoyanceWave * 0.1)
      : 1;
    const driftY = Math.sin(t * 1.4) * 4.5 - annoyanceLift;
    const driftX = Math.cos(t * 0.9) * 1.8;
    const shellRx = (28 + Math.sin(t * 1.2) * 1.8) * annoyanceSquashX;
    const shellRy = (31 + Math.cos(t * 1.05) * 2.6) * annoyanceSquashY;
    const wobble = (Math.sin(t * 2.1) * 0.08) + (annoyanceWave * 0.12);
    const glossShift = Math.sin(t * 1.7) * 3.2;
    const bubbleX = origin.x + driftX;
    const bubbleY = origin.y + driftY;

    const glow = ctx.createRadialGradient(bubbleX, bubbleY, 0, bubbleX, bubbleY, 54);
    glow.addColorStop(0, 'rgba(255,248,193,0.22)');
    glow.addColorStop(0.42, 'rgba(216,245,255,0.14)');
    glow.addColorStop(1, 'rgba(216,245,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, 54 + (annoyanceWave * 3), 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(bubbleX, bubbleY);
    ctx.rotate(wobble);

    const shell = ctx.createRadialGradient(-10 + glossShift, -14, 0, 0, 0, 44);
    shell.addColorStop(0, 'rgba(255,255,255,0.24)');
    shell.addColorStop(0.56, 'rgba(212,243,255,0.14)');
    shell.addColorStop(1, 'rgba(212,243,255,0.03)');
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(0, 0, shellRx, shellRy, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(232,250,255,0.88)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, shellRx, shellRy, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(164,226,248,0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(2, 1, shellRx - 4, shellRy - 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.beginPath();
    ctx.ellipse(-10 + glossShift, -14, 6, 10, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(210,244,255,0.42)';
    ctx.beginPath();
    ctx.ellipse(14, 10, 9, 6, 0.38, 0, Math.PI * 2);
    ctx.fill();

    const petalColors = [
      'rgba(255,120,120,0.96)',
      'rgba(255,92,92,0.96)',
      'rgba(255,74,74,0.96)',
      'rgba(255,110,110,0.96)',
      'rgba(255,58,58,0.96)'
    ];
    const petalPositions = [
      { x: 0, y: -10 },
      { x: 9, y: -2 },
      { x: 6, y: 9 },
      { x: -6, y: 9 },
      { x: -9, y: -2 }
    ];
    petalPositions.forEach((petal, index) => {
      ctx.fillStyle = petalColors[index];
      ctx.beginPath();
      ctx.arc(petal.x, petal.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#f3c341';
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  goalIdleCanvasFrame = window.requestAnimationFrame(drawGoalIdleCanvas);
}
function ensureGoalIdleCanvasLoop() {
  sizeGoalCanvasLayers();
  if (!goalIdleCanvasFrame) {
    goalIdleCanvasFrame = window.requestAnimationFrame(drawGoalIdleCanvas);
  }
}
function createGoalPopParticles(origin) {
  const burstAngle = Math.random() * Math.PI * 2;
  const burstBias = 0.45 + Math.random() * 0.35;
  goalCanvasPopProfile = {
    burstAngle,
    burstBias,
    ringOffsetX: (Math.random() - 0.5) * 12,
    ringOffsetY: (Math.random() - 0.5) * 10,
    ringStretchX: 0.88 + Math.random() * 0.4,
    ringStretchY: 0.82 + Math.random() * 0.34,
    ringRotation: (Math.random() - 0.5) * 0.9
  };
  const particles = [];
  const orbCount = 14 + Math.floor(Math.random() * 7);
  for (let i = 0; i < orbCount; i += 1) {
    const spreadMode = Math.random();
    const baseAngle = spreadMode < 0.55
      ? burstAngle + (Math.random() - 0.5) * 1.35
      : (Math.PI * 2 * i) / orbCount + (Math.random() - 0.5) * 0.62;
    const biasBoost = 1 + Math.max(0, Math.cos(baseAngle - burstAngle)) * burstBias;
    const speed = (34 + Math.random() * 84) * biasBoost;
    const spawnRadius = Math.random() * 10;
    const largeBubbleBias = Math.random();
    particles.push({
      kind: 'orb',
      x: origin.x + Math.cos(baseAngle) * spawnRadius,
      y: origin.y + Math.sin(baseAngle) * spawnRadius,
      vx: Math.cos(baseAngle) * speed,
      vy: Math.sin(baseAngle) * speed,
      radius: largeBubbleBias > 0.62 ? 14 + Math.random() * 18 : 8 + Math.random() * 14,
      alpha: 0.78 + Math.random() * 0.24,
      life: 1500 + Math.random() * 820,
      wobble: (Math.random() - 0.5) * 18,
      wobblePhase: Math.random() * Math.PI * 2
    });
  }
  return particles;
}
function drawGoalPopCanvas(now) {
  const popCanvas = document.getElementById('goalPopCanvas');
  if (!popCanvas) {
    goalPopCanvasFrame = null;
    return;
  }
  const ctx = popCanvas.getContext('2d');
  if (!ctx) {
    goalPopCanvasFrame = null;
    return;
  }
  const elapsed = now - goalCanvasPopStartedAt;
  clearCanvas(popCanvas, goalPopCanvasDpr);
  const ringProgress = Math.min(1, elapsed / 760);
  const ringRadius = 16 + (ringProgress * 84);
  const ringAlpha = Math.max(0, 1 - ringProgress);
  if (ringAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = ringAlpha * 0.92;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(234,250,255,0.92)';
    ctx.shadowColor = 'rgba(158,237,255,0.45)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(
      goalCanvasPopOrigin.x + (goalCanvasPopProfile?.ringOffsetX || 0),
      goalCanvasPopOrigin.y + (goalCanvasPopProfile?.ringOffsetY || 0),
      ringRadius * (goalCanvasPopProfile?.ringStretchX || 1),
      ringRadius * (goalCanvasPopProfile?.ringStretchY || 1),
      goalCanvasPopProfile?.ringRotation || 0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  }
  goalCanvasParticles = goalCanvasParticles.filter((particle) => elapsed <= particle.life);
  goalCanvasParticles.forEach((particle) => {
    const t = Math.min(1, elapsed / particle.life);
    const wobble = Math.sin((t * 7) + particle.wobblePhase) * particle.wobble * (1 - t);
    const x = particle.x + particle.vx * t * 0.82 + wobble;
    const y = particle.y + particle.vy * t * 0.82 + (Math.cos((t * 6) + particle.wobblePhase) * particle.wobble * 0.45 * (1 - t));
    const radius = particle.radius * (1 - t * 0.34);
    const alpha = particle.alpha * Math.max(0, 1 - t * 0.82);
    ctx.save();
    ctx.globalAlpha = alpha;
    const gradient = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.3, 0, x, y, Math.max(2, radius));
    gradient.addColorStop(0, 'rgba(255,255,255,0.98)');
    gradient.addColorStop(0.18, 'rgba(245,252,255,0.95)');
    gradient.addColorStop(0.54, 'rgba(198,238,255,0.34)');
    gradient.addColorStop(0.78, 'rgba(168,226,248,0.08)');
    gradient.addColorStop(1, 'rgba(168,226,248,0)');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = `rgba(232,250,255,${Math.max(0, alpha * 0.82)})`;
    ctx.lineWidth = Math.max(1.2, radius * 0.08);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.5, radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha * 0.92)})`;
    ctx.arc(x - radius * 0.28, y - radius * 0.3, Math.max(1.2, radius * 0.16), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  if (elapsed < 2500) {
    goalPopCanvasFrame = window.requestAnimationFrame(drawGoalPopCanvas);
  } else {
    goalPopCanvasFrame = null;
    goalCanvasPopProfile = null;
    clearCanvas(popCanvas, goalPopCanvasDpr);
  }
}
function triggerGoalCanvasPop() {
  const origin = getGoalCanvasOrigin();
  const popCanvas = ensureGoalCanvasLayers()?.pop;
  if (!origin || !popCanvas) return;
  sizeGoalCanvasLayers();
  goalCanvasPopOrigin = origin;
  goalCanvasParticles = createGoalPopParticles(origin);
  goalCanvasPopStartedAt = window.performance?.now?.() || Date.now();
  goalBubblePopUntil = goalCanvasPopStartedAt + 1200;
  if (goalPopCanvasFrame) window.cancelAnimationFrame(goalPopCanvasFrame);
  goalPopCanvasFrame = window.requestAnimationFrame(drawGoalPopCanvas);
}
async function popGoalBubble() {
  const goalCell = document.querySelector('.goal-cell');
  if (!goalCell || goalCell.classList.contains('is-popping')) return;
  triggerGoalCanvasPop();
  playBubblePopSfx();
  await sleep(GOAL_BUBBLE_POP_DURATION_MS);
}
let ori = 'right';
const MOVE_MS = 650, TURN_MS = 520, STEP_MS = 180;
const POOL = {
  forward:  {dir:'forward',  color:'#5BC85A', dark:'#3a8a39', light:'#8de88c'},
  left:     {dir:'left',     color:'#F5C842', dark:'#b8920a', light:'#ffe87a'},
  right:    {dir:'right',    color:'#E8504A', dark:'#a02820', light:'#ff8a84'},
  function: {dir:'function', color:'#2B8FD4', dark:'#1a5a8a', light:'#8fd1ff'}
};
const CUSTOM_LEVELS_STORAGE_KEY = 'boks-custom-levels';
const EDITOR_LEVELS_STORAGE_KEY = 'boks-editor-levels-v1';
const PROJECT_LEVELS_CACHE_KEY = 'boks-project-levels-cache-v1';
const STYLE_PRESETS_STORAGE_KEY = 'boks-style-presets-v1';
const EDITOR_LEVELS_FILE_PATH = './data/editor-levels.json';
const EDITOR_LEVELS_FILE_PICKER_SUGGESTED_NAME = 'editor-levels.json';
const FILE_HANDLE_DB_NAME = 'boks-file-handles';
const FILE_HANDLE_STORE_NAME = 'handles';
const EDITOR_LEVELS_FILE_HANDLE_KEY = 'editor-levels-project-file';
const CUSTOM_LEVEL_THEME = 'level1';
const BOKS_TOUCH_REBUKE_DURATION_MS = 560;
const BOKS_TOUCH_REBUKE_COOLDOWN_MS = 950;
const BOKS_GOAL_BUBBLE_LEAD_IN_MS = 90;
const GOAL_BUBBLE_POP_DURATION_MS = 1200;
const BOKS_GOAL_BUBBLE_EYE_REOPEN_LEAD_MS = 280;
const GOAL_TAP_ANNOYANCE_DURATION_MS = 460;
const GOAL_TAP_ANNOYANCE_COOLDOWN_MS = 700;
const DECORATION_TOUCH_REACTION_DURATION_MS = 520;
const DECORATION_TOUCH_REACTION_COOLDOWN_MS = 760;
const DECORATION_TOUCH_SPRITE_INSET_RATIO = 0.04;
const CUSTOM_ICONS = ['leaf', 'star', 'turtle', 'sun', 'moon', 'flower'];
  const DEFAULT_CHARACTER_ID = 'boks_green';
const LOCKED_THEME_SCENE_VAR_KEYS = ['--scene-body-bg', '--bg-base'];
const EDITOR_THEME_COLOR_CONTROLS = [
  { key: '--panel-bg', label: 'Pannelli' },
  { key: '--panel-edge', label: 'Bordo pannelli' },
  { key: '--scene-grid-wrap-bg', label: 'Cornice griglia' },
  { key: '--grid-bg', label: 'Sfondo griglia' },
  { key: '--cell-bg', label: 'Celle' },
  { key: '--cell-hi-bg', label: 'Highlight celle' },
  { key: '--cell-hi-edge', label: 'Bordo highlight' },
  { key: '--obstacle-bg-top', label: 'Mattoni top' },
  { key: '--obstacle-bg-bottom', label: 'Mattoni bottom' },
  { key: '--obstacle-edge', label: 'Bordo mattoni' }
];
const EDITOR_THEME_COLOR_KEYS = new Set(EDITOR_THEME_COLOR_CONTROLS.map(control => control.key));
const DECORATION_BEE_LOTTIE_SRC = 'assets/animations/decor/bee_swarm_hover.json';
const DECORATION_BEE_BASE_SIZE = 16;
const DECORATION_BEE_PLAYBACK_SPEED = 2;
const DECORATION_BEE_MAX_LOTTIE_ACTORS = 2;
const DECORATION_LAYERS = ['ground', 'object', 'overlay'];
const DECORATION_ERASE_TOOL = '__decor_erase__';
const DECORATION_ASSET_DEFS = {
  tree_small: {
    label: 'Alberello',
    layer: 'object',
    hint: 'Scalabile e colorabile',
    editable: true,
    touchReactive: true,
    touchHitbox: {
      scaleX: 0.92,
      scaleY: 0.9,
      offsetY: 0.03
    },
    defaults: {
      scale: 1,
      foliageColor: '#5dae61',
      trunkColor: '#8f6136'
    }
  },
  daisy_flower: {
    label: 'Margherita',
    layer: 'object',
    hint: 'Fiorellino decorativo leggero',
    touchReactive: true,
    touchHitbox: {
      scaleX: 0.9,
      scaleY: 0.9,
      offsetY: 0.08
    },
    defaults: {
      scale: 0.9
    }
  },
  bee_hover: {
    label: 'Api',
    layer: 'overlay',
    hint: 'Stormo decorativo con numero di istanze regolabile',
    animated: true,
    renderAboveSprite: true,
    defaults: {
      scale: 1,
      count: 3
    }
  },
  bridge: {
    label: 'Ponte',
    layer: 'overlay',
    hint: 'Lo teniamo come placeholder visivo per ora'
  }
};
const RUNTIME_CONFIG = window.BOKS_RUNTIME_CONFIG || {};
const LEVEL_EDITOR_ENABLED = RUNTIME_CONFIG.editorEnabled !== false;
const DEBUG_TOOLS_ENABLED = RUNTIME_CONFIG.debugToolsEnabled !== false;
const FORCE_LIGHTWEIGHT_CHARACTER = RUNTIME_CONFIG.lightweightCharacterMode !== false;
  const LIGHTWEIGHT_CHARACTER_ID = 'boks_green';

// ═══ STATE ═══
let pos = {...START};
let running = false, animating = false, idN = 0;
const avail = [];
const prog  = Array(SLOTS).fill(null);
const fnProg = Array(FSLOTS).fill(null);
const DECOR_CLASSES = [
  'decor-grass',
  'decor-flower',
  'decor-stone',
  'decor-city-road',
  'decor-city-light',
  'decor-space-dust',
  'decor-space-crater'
];
let tutorialStepIndex = 0;
let blockedCells = new Set();
let activeMainSlots = SLOTS;
let activeFnSlots = FSLOTS;
let characterAction = 'idle';
let mainSlotEnabled = Array(SLOTS).fill(true);
let fnSlotEnabled = Array(FSLOTS).fill(true);
let editorBlockEnabled = {
  forward: false,
  left: false,
  right: false,
  function: false
};
let fnUnlockHintActive = false;
let stepStartHintActive = false;
let gameStarted = false;
let debugVisible = DEBUG_TOOLS_ENABLED;
let animationDebugVisible = false;
let editorMode = false;
let currentCustomLevel = null;
let tutorialSceneLevelId = CUSTOM_LEVEL_THEME;
let selectedSaveIcon = CUSTOM_ICONS[0];
let lastEditorSolutionCount = 0;
let selectedEditorLevelId = null;
let draggingEditorLevelId = null;
let stylePresets = readStylePresets();
const NEW_EDITOR_LEVEL_ID = '__new_editor_level__';
let playerPlaced = true;
let goalPlaced = true;
let selectedElementTool = null;
let selectedDecorationBrush = null;
let activeLevelDecorations = [];
let decorationBrushSettings = {
  tree_small: { scale: 1, foliageColor: '#5dae61', trunkColor: '#8f6136' },
  bee_hover: { scale: 1, count: 3 }
};
const decorationFxState = {
  raf: 0,
  beeActors: new Map(),
  lottieRuntimeRequested: false
};
const decorationTouchCooldowns = new Map();
let editorStylePanelOpen = false;
let pendingNewLevelThemeOverrides = {};
let pendingNewLevelCharacterId = DEFAULT_CHARACTER_ID;
let pendingNewLevelHints = {};
let emptyRunHintTimers = [];
let lastEmptyRunHintAt = 0;
let firstLevelOnboardingStage = 'idle';
let firstLevelOnboardingFrame = null;
let firstLevelOnboardingReadyAt = 0;
let firstLevelOnboardingDelayTimer = null;
let appSceneRevealReadyAt = 0;
let appSceneRevealTimer = null;
const WIN_BURST_ANGLES = [-108, -78, -52, -24, 8, 34, 62, 92, 122, 154, 186, 218, 250];
let winBurstHideTimer = null;
let activeWinBurstPromise = null;
let activeWinFeedbackAt = 0;
let scheduledWinFeedbackTimer = null;
let endingCinematicPromise = null;
let settingsOpen = false;
let boksTouchRebukeUntil = 0;
let boksTouchRebukeCooldownUntil = 0;
let boksTouchRebukeTimer = null;
let boksGoalBubbleImpactActive = false;
let boksGoalBubbleEyeReopenTimer = null;
let goalTapAnnoyanceUntil = 0;
let goalTapAnnoyanceCooldownUntil = 0;
let goalTapAnnoyanceTimer = null;
document.body?.classList.add('prestart');
document.body?.classList.toggle('debug-visible', DEBUG_TOOLS_ENABLED && debugVisible);
if (DEBUG_TOOLS_ENABLED && animationDebugVisible) {
  document.body?.classList.add('animation-debug-visible');
  requestAnimationFrame(() => updateAnimationDebugBadge());
} else {
  document.body?.classList.remove('animation-debug-visible');
}

// ═══ UTILS ═══
const sleep = ms => new Promise(r => setTimeout(r, ms));
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
let fpsProbeRaf = 0;
let fxAc;
let backgroundMusicAudio = null;
let backgroundMusicStarted = false;
let levelOneIntroAudio = null;
let levelOneIntroBgmTimer = null;
const BACKGROUND_MUSIC_VOLUME = 0.18;
const LEVEL_ONE_INTRO_VOLUME = 0.72;

function startFpsProbe(label = 'scene', sampleMs = 2200) {
  if (!appSceneVisible || fpsProbeRaf) return;
  const startedAt = window.performance?.now?.() || Date.now();
  let lastAt = startedAt;
  let frames = 0;
  let worstFrameMs = 0;

  const step = now => {
    frames += 1;
    const delta = now - lastAt;
    lastAt = now;
    if (delta > worstFrameMs) worstFrameMs = delta;
    if ((now - startedAt) >= sampleMs) {
      fpsProbeRaf = 0;
      const elapsed = Math.max(1, now - startedAt);
      recordPerfMetric('fps-probe', 0, {
        label,
        frames,
        avgFps: Math.round((frames * 1000) / elapsed),
        worstFrameMs: Math.round(worstFrameMs * 100) / 100
      });
      return;
    }
    fpsProbeRaf = requestAnimationFrame(step);
  };

  fpsProbeRaf = requestAnimationFrame(step);
}

function stopFpsProbe() {
  if (!fpsProbeRaf) return;
  cancelAnimationFrame(fpsProbeRaf);
  fpsProbeRaf = 0;
}
const BACKGROUND_MUSIC_STORAGE_KEY = 'boks-bgm-enabled';
const BACKGROUND_MUSIC_VOLUME_STORAGE_KEY = 'boks-bgm-volume';
const SOUND_EFFECTS_STORAGE_KEY = 'boks-sfx-enabled';
const PROGRESS_STORAGE_KEY = 'boks-progress-v1';
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
      stepMove: 'assets/audio/sfx/gameplay/step_move.mp3',
      errorAction: 'assets/audio/sfx/gameplay/error_action.mp3',
      boksAnnoyed: 'assets/audio/sfx/gameplay/boks_annoyed.ogg',
      decorRubberTap: [
        'assets/audio/sfx/gameplay/decor_rubber_tap_01.ogg',
        'assets/audio/sfx/gameplay/decor_rubber_tap_02.ogg'
      ],
      goalBubbleBounce: 'assets/audio/sfx/gameplay/goal_bubble_bounce.ogg',
      bubblePop: 'assets/audio/sfx/gameplay/bubble_pop_main.ogg',
      levelComplete: 'assets/audio/sfx/gameplay/level_complete_main.mp3'
    }
  }
});
const PLAY_ICON_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><use href="#icon-play-boks"></use></svg>';
const PAUSE_ICON_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><use href="#icon-pause-boks"></use></svg>';
const audioPlayers = new Map();
const FX = () => {
  if (!fxAc) fxAc = new (window.AudioContext || window.webkitAudioContext)();
  if (fxAc.state === 'suspended') fxAc.resume();
  return fxAc;
};
function getVersionedAudioPath(path) {
  const build = window.BOKS_RUNTIME_CONFIG?.build || document.body?.dataset?.build || 'dev';
  return `${path}?v=${encodeURIComponent(build)}`;
}
function readSoundEffectsEnabledPreference() {
  try {
    const stored = localStorage.getItem(SOUND_EFFECTS_STORAGE_KEY);
    return stored == null ? true : stored !== 'false';
  } catch (_err) {
    return true;
  }
}
function clampUnitVolume(value, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(1, numeric));
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
let backgroundMusicVolume = readBackgroundMusicVolumePreference();
let backgroundMusicEnabled = backgroundMusicVolume > 0.001;
let soundEffectsEnabled = readSoundEffectsEnabledPreference();
let progressState = readProgressState();
function getBackgroundMusicLoopVolume() {
  return BACKGROUND_MUSIC_VOLUME * backgroundMusicVolume;
}
function getLevelOneIntroMixVolume() {
  return LEVEL_ONE_INTRO_VOLUME * backgroundMusicVolume;
}
function setProgressState(nextState, { persist = true } = {}) {
  progressState = sanitizeProgressState(nextState);
  if (!persist) return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressState));
  } catch (_err) {
    // ignore persistence issues
  }
}
function rememberCurrentCampaignStep(stepIndex = tutorialStepIndex) {
  if (currentCustomLevel || currentLevel !== 'level1') return;
  setProgressState({
    ...progressState,
    currentCampaignStep: Math.max(0, Math.floor(stepIndex || 0))
  });
}
function rememberCompletedCampaignLevel(levelId = getCampaignLevelIdForIndex(tutorialStepIndex)) {
  if (!levelId) return;
  if (progressState.completedLevelIds.includes(levelId)) return;
  setProgressState({
    ...progressState,
    completedLevelIds: [...progressState.completedLevelIds, levelId]
  });
}
function resetJourneyProgressState() {
  setProgressState({
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
  } else if (gameStarted) {
    startBackgroundMusicLoop();
  }
  syncSettingsPanelUi();
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
  syncSettingsPanelUi();
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
function playBlockDragStartSfx() {
  playUiAudioSfx(AUDIO_PATHS.sfx.ui.blockDetach, 0.42);
}
function playBlockHoverSlotSfx() {
  playUiAudioSfx(AUDIO_PATHS.sfx.ui.slotHover, 0.22);
}
function playBlockDropSuccessSfx() {
  playUiAudioSfx(AUDIO_PATHS.sfx.ui.blockDropSuccess, 0.48);
}
function playStepSfx() {
  playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.stepMove, 0.16, { mode: 'restart' });
}
function playErrorSfx() {
  playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.errorAction, 0.3);
}
function playBoksAnnoyedSfx() {
  playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.boksAnnoyed, 0.34);
}
function playDecorationRubberSfx() {
  const variants = AUDIO_PATHS.sfx.gameplay.decorRubberTap;
  const path = variants[Math.floor(Math.random() * variants.length)] || variants[0];
  playUiAudioSfx(path, 0.26);
}
function playGoalBubbleBounceSfx() {
  playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.goalBubbleBounce, 0.28);
}
function playBubblePopSfx() {
  playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.bubblePop, 0.26);
}
function playLevelCompleteSfx() {
  playUiAudioSfx(AUDIO_PATHS.sfx.gameplay.levelComplete, 0.5);
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
function playRunPressSfx() {
  playUiAudioSfx(AUDIO_PATHS.sfx.ui.playPress, 0.34);
}
function playTurnSfx(dir = 'right') {
  if (!soundEffectsEnabled) return;
  try {
    const c = FX();
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    if (dir === 'left') {
      o.frequency.setValueAtTime(470, t);
      o.frequency.exponentialRampToValueAtTime(320, t + 0.08);
    } else {
      o.frequency.setValueAtTime(320, t);
      o.frequency.exponentialRampToValueAtTime(470, t + 0.08);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.036, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.095);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + 0.1);
  } catch (_) {}
}
const LEVEL_CLOUD_BASE_W = 440;
const LEVEL_CLOUD_BASE_H = 440;
function ensureLevelTransitionMask(fade) {
    return {
      svg: fade.querySelector('.level-transition-mask'),
      mask: fade.querySelector('#levelCloudMask'),
      maskBase: fade.querySelector('.level-transition-mask-base'),
      fill: fade.querySelector('.level-transition-fill'),
      hole: fade.querySelector('.level-transition-hole')
    };
  }
function setTransitionHole(hole, target, scale, rotate = 0) {
    hole.setAttribute(
      'transform',
      `translate(${target.x.toFixed(2)} ${target.y.toFixed(2)}) rotate(${rotate.toFixed(3)}) scale(${scale.toFixed(4)})`
    );
  }
function makeCubicBezier(x1, y1, x2, y2) {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const sampleX = t => ((ax * t + bx) * t + cx) * t;
    const sampleY = t => ((ay * t + by) * t + cy) * t;
    const sampleDX = t => (3 * ax * t + 2 * bx) * t + cx;
    return function cubicBezier(progress) {
      if (progress <= 0) return 0;
      if (progress >= 1) return 1;
      let t = progress;
      for (let i = 0; i < 6; i++) {
        const currentX = sampleX(t) - progress;
        const currentD = sampleDX(t);
        if (Math.abs(currentX) < 1e-5 || Math.abs(currentD) < 1e-5) break;
        t -= currentX / currentD;
      }
      if (t < 0 || t > 1 || Number.isNaN(t)) {
        let low = 0;
        let high = 1;
        t = progress;
        for (let i = 0; i < 12; i++) {
          const currentX = sampleX(t);
          if (Math.abs(currentX - progress) < 1e-5) break;
          if (currentX < progress) low = t;
          else high = t;
          t = (low + high) / 2;
        }
      }
      return sampleY(t);
    };
  }
const levelTransitionEase = makeCubicBezier(0.4, 0, 0.2, 1);
function animateTransitionHole(hole, target, frames, duration, easing = levelTransitionEase) {
    return new Promise(resolve => {
      const start = performance.now();
      const ordered = Array.isArray(frames) && frames.length ? frames : [{ offset: 0, scale: 1, rotate: 0 }, { offset: 1, scale: 1, rotate: 0 }];
      function sampleFrame(progress) {
        const t = easing(Math.min(Math.max(progress, 0), 1));
        let nextIndex = ordered.findIndex(frame => t <= frame.offset);
        if (nextIndex <= 0) return ordered[0];
        if (nextIndex === -1) return ordered[ordered.length - 1];
        const prev = ordered[nextIndex - 1];
        const next = ordered[nextIndex];
        const range = Math.max(0.0001, next.offset - prev.offset);
        const local = (t - prev.offset) / range;
        return {
          scale: prev.scale + (next.scale - prev.scale) * local,
          rotate: prev.rotate + (next.rotate - prev.rotate) * local
        };
      }
      function step(now) {
        const progress = duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
        const frame = sampleFrame(progress);
        setTransitionHole(hole, target, frame.scale, frame.rotate);
        if (progress >= 1) {
          resolve();
          return;
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
async function triggerLevelExit(ms = 760, onClosed = null, anchor = null) {
  const fade = document.getElementById('levelTransition');
  if (!fade) {
    if (typeof onClosed === 'function') await onClosed();
    await sleep(ms);
    return;
  }
  const { svg, mask, maskBase, fill, hole } = ensureLevelTransitionMask(fade);
  const gridWrap = document.getElementById('gridWrap');
  const bottom = document.getElementById('bottom');
  const gridRect = gridWrap?.getBoundingClientRect();
  const bottomRect = bottom?.getBoundingClientRect();
  const gameplayLeft = Math.min(gridRect?.left ?? 0, bottomRect?.left ?? 0);
  const gameplayRight = Math.max(gridRect?.right ?? window.innerWidth, bottomRect?.right ?? 0);
  const gameplayTop = Math.min(gridRect?.top ?? 0, bottomRect?.top ?? 0);
  const gameplayBottom = Math.max(gridRect?.bottom ?? 0, bottomRect?.bottom ?? 0);
  const gameplayWidth = Math.max(280, gameplayRight - gameplayLeft);
  const gameplayHeight = Math.max(360, gameplayBottom - gameplayTop);
  const target = anchor || {
    x: gameplayLeft + gameplayWidth / 2,
    y: gameplayTop + gameplayHeight / 2
  };

  const rootComputed = getComputedStyle(document.documentElement);
  const overlayColor =
    (rootComputed.getPropertyValue('--level-transition-fill') || '').trim() ||
    (rootComputed.getPropertyValue('--bg-base') || '').trim() ||
    getComputedStyle(document.body).backgroundColor ||
    '#e8dfcc';
  fill.setAttribute('fill', overlayColor);

  const overlayWidth = Math.max(window.innerWidth, 1);
  const overlayHeight = Math.max(window.innerHeight, 1);
  svg?.setAttribute('viewBox', `0 0 ${overlayWidth} ${overlayHeight}`);
  mask?.setAttribute('x', '0');
  mask?.setAttribute('y', '0');
  mask?.setAttribute('width', `${overlayWidth}`);
  mask?.setAttribute('height', `${overlayHeight}`);
  maskBase?.setAttribute('x', '0');
  maskBase?.setAttribute('y', '0');
  maskBase?.setAttribute('width', `${overlayWidth}`);
  maskBase?.setAttribute('height', `${overlayHeight}`);
  fill?.setAttribute('x', '0');
  fill?.setAttribute('y', '0');
  fill?.setAttribute('width', `${overlayWidth}`);
  fill?.setAttribute('height', `${overlayHeight}`);

  const total = Math.max(1850, ms);
  const closeMs = Math.round(total * 0.56);
  const holdMs = Math.round(total * 0.18);
  const openMs = total - closeMs - holdMs;
  const fullScale = Math.max(
    (gameplayWidth + 220) / LEVEL_CLOUD_BASE_W,
    (gameplayHeight + 260) / LEVEL_CLOUD_BASE_H,
    1.05
  );
  const minScale = 0.0001;
  const holeTarget = {
    x: target.x,
    y: target.y
  };

  fade.classList.remove('show');
  void fade.offsetWidth;
  setTransitionHole(hole, holeTarget, fullScale, 0);
  fade.classList.add('show');

  await animateTransitionHole(hole, holeTarget, [
    { offset: 0, scale: fullScale, rotate: 0 },
    { offset: 0.16, scale: fullScale * 1.05, rotate: -3 },
    { offset: 0.82, scale: fullScale * 0.18, rotate: 2 },
    { offset: 1, scale: minScale, rotate: 0 }
  ], closeMs);
  hole.style.visibility = 'hidden';

  if (typeof onClosed === 'function') await onClosed();

  await sleep(holdMs);
  hole.style.visibility = 'visible';
  setTransitionHole(hole, holeTarget, minScale, 0);

  await animateTransitionHole(hole, holeTarget, [
    { offset: 0, scale: minScale, rotate: 0 },
    { offset: 0.72, scale: fullScale * 1.04, rotate: 2 },
    { offset: 1, scale: fullScale, rotate: 0 }
  ], openMs);

  fade.classList.remove('show');
}
async function fadeTransition(ms = 760, onClosed = null, anchor = null) {
  return triggerLevelExit(ms, onClosed, anchor);
}
function syncViewportHeight() {
  const vv = window.visualViewport;
  const h = vv ? Math.round(vv.height) : window.innerHeight;
  const w = vv ? Math.round(vv.width) : window.innerWidth;
  const finePointer = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : false;
  const desktopShort = finePointer && h < 820;
  document.documentElement.style.setProperty('--app-vh', `${h}px`);
  document.documentElement.style.setProperty('--app-vw', `${w}px`);
  document.body.classList.toggle('compact-ui', h < 740 || w < 360 || desktopShort);
  updateOrientationGuard();
}
function updateOrientationGuard() {
  const portrait = window.matchMedia
    ? window.matchMedia('(orientation: portrait)').matches
    : window.innerHeight >= window.innerWidth;
  const mobileLike = window.matchMedia
    ? window.matchMedia('(pointer: coarse)').matches || Math.max(window.innerWidth, window.innerHeight) <= 1366
    : true;
  document.body.classList.toggle('landscape-block', !portrait && mobileLike);
}
async function requestAppFullscreen() {
  // Evita lo snap automatico a schermo intero al primo click.
  // Se in futuro vuoi reintrodurlo, legalo a un'azione esplicita dell'utente.
  // blocca orientamento portrait su Android
  try {
    if (screen.orientation?.lock) await screen.orientation.lock('portrait');
  } catch (_) {}
}
function toast(msg, cls='', aboveEl=null) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = msg ? 'show '+cls : '';
  if(aboveEl && msg) {
    const r = aboveEl.getBoundingClientRect();
    el.style.top  = (r.top - 60) + 'px';
    el.style.bottom = '';
    el.style.left = (r.left + r.width/2) + 'px';
  } else {
    el.style.top = '';
    el.style.bottom = '70px';
    el.style.left = '50%';
  }
  clearTimeout(el._t); if(msg) el._t = setTimeout(() => el.className='', 3000);
}
function syncSettingsPanelUi() {
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
  if (settingsModal) {
    settingsModal.classList.toggle('show', settingsOpen);
    settingsModal.setAttribute('aria-hidden', settingsOpen ? 'false' : 'true');
  }
  if (header) {
    const headerLabel = settingsOpen ? 'Close settings' : 'Open settings';
    header.setAttribute('aria-label', headerLabel);
    header.setAttribute('title', headerLabel);
  }
  if (sfxBtn) sfxBtn.setAttribute('aria-pressed', soundEffectsEnabled ? 'true' : 'false');
  if (sfxSwitch) sfxSwitch.classList.toggle('is-on', soundEffectsEnabled);
  if (musicSlider) musicSlider.value = String(Math.round(backgroundMusicVolume * 100));
  if (musicValue) musicValue.textContent = `${Math.round(backgroundMusicVolume * 100)}%`;
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
function closeSettingsPanel() {
  if (!settingsOpen) return;
  document.getElementById('settingsCreditsPanel')?.setAttribute('hidden', '');
  document.getElementById('settingsResetProgressPanel')?.setAttribute('hidden', '');
  settingsOpen = false;
  syncSettingsPanelUi();
}
function openSettingsPanel() {
  if (document.body.classList.contains('prestart')) return;
  if (running || animating) {
    toast('Wait for the move to finish');
    return;
  }
  closeSaveLevelModal();
  settingsOpen = true;
  syncSettingsPanelUi();
}
function toggleSettingsPanel() {
  if (settingsOpen) {
    closeSettingsPanel();
    return;
  }
  openSettingsPanel();
}
function toggleSettingsCredits() {
  const panel = document.getElementById('settingsCreditsPanel');
  const resetPanel = document.getElementById('settingsResetProgressPanel');
  if (!panel) return;
  const shouldOpen = panel.hidden;
  panel.hidden = !shouldOpen;
  if (resetPanel) resetPanel.hidden = true;
  syncSettingsPanelUi();
}
function toggleResetProgressPanel() {
  const panel = document.getElementById('settingsResetProgressPanel');
  const creditsPanel = document.getElementById('settingsCreditsPanel');
  if (!panel) return;
  const shouldOpen = panel.hidden;
  panel.hidden = !shouldOpen;
  if (creditsPanel) creditsPanel.hidden = true;
  syncSettingsPanelUi();
}
function openLanguageComingSoonNotice() {
  toast('More languages coming soon');
}
function resetJourneyProgress() {
  resetJourneyProgressState();
  closeSettingsPanel();
  closeSaveLevelModal();
  if (editorMode) setEditorMode(false);
  currentCustomLevel = null;
  setLevel('level1');
  applyCampaignLevel(0);
  if (!document.body.classList.contains('prestart')) {
    returnToMainMenu();
  }
  updateDebugBadge();
  toast('Journey progress erased');
}
function goToMainMenuFromSettings() {
  closeSettingsPanel();
  returnToMainMenu();
}
function consumeHardRefreshNotice() {
  try {
    const currentBuild = window.BOKS_RUNTIME_CONFIG?.build || document.body?.dataset?.build || '';
    const pendingBuild = window.sessionStorage?.getItem('boks-hard-refresh-notice') || '';
    if (!pendingBuild || pendingBuild !== currentBuild) return;
    window.sessionStorage?.removeItem('boks-hard-refresh-notice');
  } catch (_err) {
    // ignore storage errors
  }
}
function ensureWinBurst() {
  let root = document.getElementById('winBurst');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'winBurst';
  root.setAttribute('aria-hidden', 'true');

  const core = document.createElement('span');
  core.className = 'win-core';
  root.appendChild(core);

  WIN_BURST_ANGLES.forEach((angle, idx) => {
    const spark = document.createElement('span');
    spark.className = 'win-spark';
    spark.style.setProperty('--a', `${angle}deg`);
    spark.style.setProperty('--r', `${idx % 2 === 0 ? 96 : 124}px`);
    spark.style.setProperty('--d', `${idx * 14}ms`);
    root.appendChild(spark);
  });

  const ringA = document.createElement('span');
  ringA.className = 'win-ring';
  ringA.style.setProperty('--d', '0ms');
  root.appendChild(ringA);

  const ringB = document.createElement('span');
  ringB.className = 'win-ring';
  ringB.style.setProperty('--d', '110ms');
  root.appendChild(ringB);

  const flash = document.createElement('span');
  flash.className = 'win-flash';
  root.appendChild(flash);
  document.body.appendChild(root);
  return root;
}
function getWinBurstAnchor() {
  const fallback = {
    x: Math.round(window.innerWidth * 0.5),
    y: Math.round(window.innerHeight * 0.36)
  };
  if (!goalPlaced) return fallback;
  const goalCell = getGridCell(GOAL.x, GOAL.y);
  if (!goalCell) return fallback;
  const rect = goalCell.getBoundingClientRect();
  const x = rect.left + rect.width * 0.5;
  const y = rect.top + rect.height * 0.34;
  const safeX = Math.max(80, Math.min(window.innerWidth - 80, x));
  const safeY = Math.max(84, Math.min(window.innerHeight - 94, y));
  return { x: Math.round(safeX), y: Math.round(safeY) };
}
async function playWinBurst() {
  const root = ensureWinBurst();
  const anchor = getWinBurstAnchor();
  root.style.setProperty('--wb-x', `${anchor.x}px`);
  root.style.setProperty('--wb-y', `${anchor.y}px`);
  if (winBurstHideTimer) {
    clearTimeout(winBurstHideTimer);
    winBurstHideTimer = null;
  }
  root.classList.remove('show', 'bursting');
  void root.offsetWidth;
  root.classList.add('show', 'bursting');
  await sleep(980);
  root.classList.remove('bursting');
  winBurstHideTimer = setTimeout(() => {
    root.classList.remove('show');
    winBurstHideTimer = null;
  }, 140);
  await sleep(220);
}
function clearScheduledWinFeedback() {
  if (!scheduledWinFeedbackTimer) return;
  clearTimeout(scheduledWinFeedbackTimer);
  scheduledWinFeedbackTimer = null;
}
function triggerWinFeedbackNow() {
  clearScheduledWinFeedback();
  const now = window.performance?.now ? window.performance.now() : Date.now();
  if (activeWinBurstPromise && (now - activeWinFeedbackAt) < 1400) {
    return activeWinBurstPromise;
  }
  activeWinFeedbackAt = now;
  playLevelCompleteSfx();
  activeWinBurstPromise = playWinBurst().finally(() => {
    activeWinBurstPromise = null;
  });
  return activeWinBurstPromise;
}
function scheduleWinFeedback(delayMs = 0) {
  if (scheduledWinFeedbackTimer || activeWinBurstPromise) return;
  scheduledWinFeedbackTimer = setTimeout(() => {
    scheduledWinFeedbackTimer = null;
    triggerWinFeedbackNow();
  }, delayMs);
}
function ensureEndingCinematicRoot() {
  let root = document.getElementById('endingCinematic');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'endingCinematic';
  root.setAttribute('aria-hidden', 'true');
  const petals = Array.from({ length: 12 }, (_, idx) => `
    <span
      class="ending-cinematic__petal"
      style="--petal-angle:${idx * 31}deg;--petal-distance:${84 + ((idx % 4) * 18)}px;--petal-delay:${idx * 120}ms;"
    ></span>
  `).join('');
  const sparks = Array.from({ length: 10 }, (_, idx) => `
    <span
      class="ending-cinematic__spark"
      style="--spark-angle:${idx * 36}deg;--spark-distance:${96 + ((idx % 3) * 22)}px;--spark-delay:${idx * 110}ms;"
    ></span>
  `).join('');
  root.innerHTML = `
    <div class="ending-cinematic__veil"></div>
    <span class="ending-cinematic__sun"></span>
    <span class="ending-cinematic__ring ending-cinematic__ring--a"></span>
    <span class="ending-cinematic__ring ending-cinematic__ring--b"></span>
    <div class="ending-cinematic__message" aria-hidden="true">
      <span class="ending-cinematic__thanks">Thank you for playing</span>
      <span class="ending-cinematic__brand">
        <span class="logo-letter logo-b">B</span><span class="logo-letter logo-o">Ö</span><span class="logo-letter logo-k">K</span><span class="logo-letter logo-s">S</span>
      </span>
    </div>
    ${sparks}
    ${petals}
  `;
  document.body.appendChild(root);
  return root;
}
function getEndingCinematicAnchor() {
  const goalCell = getGridCell(GOAL.x, GOAL.y);
  if (goalCell) {
    const rect = goalCell.getBoundingClientRect();
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5
    };
  }
  const wrap = document.getElementById('gridWrap');
  const rect = wrap?.getBoundingClientRect();
  if (rect) {
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.42
    };
  }
  return {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.4
  };
}
function prepareEndingCinematicScene() {
  const anchorCell = getGridCell(GOAL.x, GOAL.y);
  const anchorX = Number(anchorCell?.dataset?.cx ?? GOAL.x ?? 0);
  const anchorY = Number(anchorCell?.dataset?.cy ?? GOAL.y ?? 0);
  document.querySelectorAll('.cell').forEach(cell => {
    const cx = Number(cell.dataset.cx || 0);
    const cy = Number(cell.dataset.cy || 0);
    const distance = Math.abs(cx - anchorX) + Math.abs(cy - anchorY);
    cell.style.setProperty('--ending-delay', `${distance * 120}ms`);
  });
  document.querySelectorAll('#blocksRow .ablock').forEach((block, idx) => {
    block.style.setProperty('--ending-delay', `${220 + (idx * 70)}ms`);
  });
}
function clearEndingCinematicScene() {
  document.body.classList.remove('ending-cinematic-active');
  document.querySelectorAll('.cell').forEach(cell => cell.style.removeProperty('--ending-delay'));
  document.querySelectorAll('#blocksRow .ablock').forEach(block => block.style.removeProperty('--ending-delay'));
}
async function playEndingCinematic({ preview = false } = {}) {
  if (endingCinematicPromise) return endingCinematicPromise;
  const root = ensureEndingCinematicRoot();
  const anchor = getEndingCinematicAnchor();
  root.style.setProperty('--ending-x', `${Math.round(anchor.x)}px`);
  root.style.setProperty('--ending-y', `${Math.round(anchor.y)}px`);
  prepareEndingCinematicScene();
  endingCinematicPromise = (async () => {
    document.body.classList.add('ending-cinematic-active');
    root.classList.remove('show');
    void root.offsetWidth;
    root.classList.add('show');
    await triggerWinFeedbackNow();
    await sleep(5200);
    root.classList.remove('show');
    await sleep(260);
    clearEndingCinematicScene();
    if (preview) toast('Ending preview finished');
  })().finally(() => {
    endingCinematicPromise = null;
  });
  return endingCinematicPromise;
}
async function previewEndingCinematic() {
  if (document.body.classList.contains('prestart')) return;
  if (running || animating) {
    toast('Wait for the move to finish');
    return;
  }
  closeSettingsPanel();
  requestAppFullscreen();
  await playEndingCinematic({ preview: true });
}

// ═══ CLIP PATHS ═══
const clip = dir =>
  dir==='forward' ? 'polygon(0 10%,80% 10%,100% 50%,80% 90%,0 90%)' :
  dir==='left'    ? 'polygon(50% 0,100% 32%,100% 100%,0 100%,0 32%)' :
                    'polygon(0 0,100% 0,100% 68%,50% 100%,0 68%)';

// ═══ BUILD BLOCK ═══
function mkB(block, w, h, cls='') {
  const el = document.createElement('div');
  el.className = cls;
  el.dataset.dir = block.dir || block.direction;
  el.dataset.bid = block.id;
  const dir = el.dataset.dir;
  el.style.cssText = `width:${w}px;height:${h}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;`;

  const c  = block.color;
  const dk = block.dark  || '#666';
  const lt = block.light || '#fff';

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 40 32');
  svg.setAttribute('width', w); svg.setAttribute('height', h);

  const isThomasTheme = document.body?.classList.contains('theme-thomas');
  const blockShape = isThomasTheme
    ? `M4,4 L36,4 L36,28 L4,28 Z`
    : `M4,8 Q4,4 8,4 L32,4 Q36,4 36,8 L36,24 Q36,28 32,28 L8,28 Q4,28 4,24 Z`;

  // ombra
  const shadow = document.createElementNS('http://www.w3.org/2000/svg','path');
  shadow.setAttribute('d', blockShape);
  shadow.setAttribute('fill', dk);
  shadow.setAttribute('transform','translate(0,3)');
  svg.appendChild(shadow);

  // corpo
  const body = document.createElementNS('http://www.w3.org/2000/svg','path');
  body.setAttribute('d', blockShape);
  body.setAttribute('fill', c);
  svg.appendChild(body);

  // highlight
  const hi = document.createElementNS('http://www.w3.org/2000/svg','path');
  hi.setAttribute('d', blockShape);
  hi.setAttribute('fill', lt);
  hi.setAttribute('opacity','0.35');
  hi.setAttribute('clip-path','inset(0 0 55% 0)');
  svg.appendChild(hi);

  el.appendChild(svg);

  if (cls.includes('ablock')) {
    const fx = document.createElement('span');
    fx.className = 'available-block-vfx';

    const glow = document.createElement('span');
    glow.className = 'available-block-vfx__glow';
    fx.appendChild(glow);

    const spark = document.createElement('span');
    spark.className = 'available-block-vfx__spark';
    fx.appendChild(spark);

    el.appendChild(fx);
  }
  return el;
}

// ═══ GRID ═══
function initGrid() {
  const g = document.getElementById('gameGrid');
  g.innerHTML = '';
  bindDecorationTapReactions();
  gridCellEls.forEach(row => row.fill(null));
  const lv = getLevel();
  for(let y=0; y<ROWS; y++) for(let x=0; x<COLS; x++) {
    const c = document.createElement('div');
    c.className = 'cell'; c.dataset.cx = x; c.dataset.cy = y;
    if (lv?.decorateCell) lv.decorateCell(c, x, y);
    if (isBlockedCell(x, y)) {
      c.classList.remove(...DECOR_CLASSES);
      c.classList.add('obstacle-cell');
    }
    if(goalPlaced && x===GOAL.x && y===GOAL.y) {
      c.classList.remove(...DECOR_CLASSES);
      c.classList.add('goal-cell');
      c.style.position = 'relative';
      c.style.overflow = 'visible';
      bindGoalTapAnnoyance(c);
    }
    gridCellEls[y][x] = c;
    g.appendChild(c);
  }
  renderGridDecorations();
  ensureGoalIdleCanvasLoop();
  sizeGoalCanvasLayers();
}

// ═══ SIZE THE GRID AS A SQUARE ═══
function sizeGrid() {
  const wrap  = document.getElementById('gridWrap');
  const grid  = document.getElementById('gameGrid');
  const app   = document.getElementById('app');
  const bot   = document.getElementById('bottom');
  const desktopLike = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : false;

  // Measure what bottom actually needs
  const appH  = app.clientHeight;
  const botH  = bot.offsetHeight;
  const availH = appH - botH - 6 - 6 - 6; // gaps + padding
  const availW = wrap.clientWidth;
  const sq = Math.max(120, Math.floor(desktopLike ? availW : Math.min(availH, availW)));

  grid.style.width  = sq + 'px';
  grid.style.height = sq + 'px';
  wrap.style.height = sq + 'px'; // shrink wrap to exact grid size, no extra space
  renderGridDecorations();
  sizeGoalCanvasLayers();
}

// ═══ SPRITE ═══

function cellPos(x, y) {
  const cell = getGridCell(x, y);
  const wrap = document.getElementById('gridWrap');
  if(!cell || !wrap) return null;
  const cr = cell.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
  return { l: cr.left-wr.left, t: cr.top-wr.top, w: cr.width, h: cr.height };
}

function spriteRectFromCellRect(r) {
  return {
    l: r.l,
    t: r.t,
    w: r.w,
    h: r.h
  };
}

function getCharacterRenderState(overrides = {}) {
  const characterId = resolveRuntimeCharacterId(overrides.characterId || getActiveCharacterId());
  const manifest = getCharacterDefs()[characterId] || {};
  if (manifest.containerDrivenPose === true) {
    return {
      characterId,
      direction: manifest.defaultDirection || 'right',
      action: manifest.defaultAction || 'idle'
    };
  }
  return {
    characterId,
    direction: overrides.direction || ori,
    action: overrides.action || characterAction
  };
}

function setCharacterAction(action = 'idle') {
  characterAction = action;
}

function isContainerDrivenCharacter(characterId) {
  const resolvedId = resolveCharacterId(characterId);
  const manifest = getCharacterDefs()[resolvedId] || {};
  return manifest.containerDrivenPose === true;
}

function applySpriteContainerOrientation(characterId, orientation = 'right', targetEl = null) {
  const spriteEl = targetEl || document.getElementById('sprite');
  if (!spriteEl) return;
  const shouldTrackOrientation = isContainerDrivenCharacter(characterId);
  const effectiveOrientation = shouldTrackOrientation ? orientation : 'right';
  const angle = orientationAngle(effectiveOrientation);
  spriteEl.style.setProperty('--sprite-rotation', `${angle}deg`);
  spriteEl.dataset.visualOrientation = effectiveOrientation;
}

function clearSpriteSwapTimer(spriteEl) {
  if (!spriteEl || !spriteEl._heroSwapTimer) return;
  clearTimeout(spriteEl._heroSwapTimer);
  spriteEl._heroSwapTimer = null;
}

function clearBoksTouchRebukeTimer() {
  if (!boksTouchRebukeTimer) return;
  clearTimeout(boksTouchRebukeTimer);
  boksTouchRebukeTimer = null;
}

function clearBoksGoalBubbleEyeReopenTimer() {
  if (!boksGoalBubbleEyeReopenTimer) return;
  clearTimeout(boksGoalBubbleEyeReopenTimer);
  boksGoalBubbleEyeReopenTimer = null;
}

function getGoalCellEl() {
  return document.querySelector('.goal-cell');
}

function clearGoalTapAnnoyanceTimer() {
  if (!goalTapAnnoyanceTimer) return;
  clearTimeout(goalTapAnnoyanceTimer);
  goalTapAnnoyanceTimer = null;
}

function applyGoalTapAnnoyanceState() {
  const goalCell = getGoalCellEl();
  if (!goalCell) return;
  goalCell.classList.toggle('is-annoyed', Date.now() < goalTapAnnoyanceUntil);
}

function clearGoalTapAnnoyanceState() {
  goalTapAnnoyanceUntil = 0;
  clearGoalTapAnnoyanceTimer();
  const goalCell = getGoalCellEl();
  if (goalCell) goalCell.classList.remove('is-annoyed');
}

function bindGoalTapAnnoyance(cell) {
  if (!cell || cell.dataset.goalTapBound === 'true') return;
  cell.dataset.goalTapBound = 'true';
  const onInteract = () => {
    triggerGoalTapAnnoyance();
  };
  cell.addEventListener('pointerdown', onInteract);
  cell.addEventListener('click', onInteract);
}

function triggerGoalTapAnnoyance() {
  const now = Date.now();
  const goalCell = getGoalCellEl();
  if (!goalCell || editorMode || !goalPlaced) return false;
  if (goalCell.classList.contains('is-popping') || running || animating) return false;
  if (now < goalTapAnnoyanceCooldownUntil) return false;
  goalTapAnnoyanceUntil = now + GOAL_TAP_ANNOYANCE_DURATION_MS;
  goalTapAnnoyanceCooldownUntil = now + GOAL_TAP_ANNOYANCE_COOLDOWN_MS;
  applyGoalTapAnnoyanceState();
  clearGoalTapAnnoyanceTimer();
  goalTapAnnoyanceTimer = setTimeout(() => {
    goalTapAnnoyanceUntil = 0;
    applyGoalTapAnnoyanceState();
    clearGoalTapAnnoyanceTimer();
  }, GOAL_TAP_ANNOYANCE_DURATION_MS + 20);
  playGoalBubbleBounceSfx();

  return true;
}

function getGoalTapAnnoyanceProgress() {
  if (!goalTapAnnoyanceUntil) return 0;
  const remaining = goalTapAnnoyanceUntil - Date.now();
  if (remaining <= 0) return 0;
  return 1 - (remaining / GOAL_TAP_ANNOYANCE_DURATION_MS);
}

function getBoksHeroEl() {
  return document.querySelector('#sprite .boks-hero');
}

function applyBoksTouchRebukeState() {
  const hero = getBoksHeroEl();
  if (!hero) return;
  hero.dataset.touchRebuke = (Date.now() < boksTouchRebukeUntil) ? 'true' : 'false';
}

function applyBoksGoalBubbleImpactState() {
  const hero = getBoksHeroEl();
  if (!hero) return;
  hero.dataset.goalBubbleImpact = boksGoalBubbleImpactActive ? 'true' : 'false';
}

function applyBoksReactionStates() {
  applyBoksTouchRebukeState();
  applyBoksGoalBubbleImpactState();
}

function clearBoksTouchRebukeState() {
  boksTouchRebukeUntil = 0;
  clearBoksTouchRebukeTimer();
  const hero = getBoksHeroEl();
  if (hero) hero.dataset.touchRebuke = 'false';
}

function clearBoksGoalBubbleImpactState() {
  boksGoalBubbleImpactActive = false;
  clearBoksGoalBubbleEyeReopenTimer();
  const hero = getBoksHeroEl();
  if (hero) hero.dataset.goalBubbleImpact = 'false';
}

function triggerBoksTouchRebuke() {
  const now = Date.now();
  if (editorMode || running || animating || !playerPlaced) return false;
  if (now < boksTouchRebukeCooldownUntil) return false;
  boksTouchRebukeUntil = now + BOKS_TOUCH_REBUKE_DURATION_MS;
  boksTouchRebukeCooldownUntil = now + BOKS_TOUCH_REBUKE_COOLDOWN_MS;
  applyBoksTouchRebukeState();
  clearBoksTouchRebukeTimer();
  boksTouchRebukeTimer = setTimeout(() => {
    boksTouchRebukeUntil = 0;
    applyBoksTouchRebukeState();
    clearBoksTouchRebukeTimer();
  }, BOKS_TOUCH_REBUKE_DURATION_MS + 20);
  playBoksAnnoyedSfx();
  return true;
}

function triggerBoksGoalBubbleImpact() {
  if (!playerPlaced) return false;
  boksGoalBubbleImpactActive = true;
  applyBoksGoalBubbleImpactState();
  return true;
}

function scheduleBoksGoalBubbleEyeReopen() {
  clearBoksGoalBubbleEyeReopenTimer();
  const delay = Math.max(120, GOAL_BUBBLE_POP_DURATION_MS - BOKS_GOAL_BUBBLE_EYE_REOPEN_LEAD_MS);
  boksGoalBubbleEyeReopenTimer = setTimeout(() => {
    clearBoksGoalBubbleImpactState();
  }, delay);
}

function pruneSpriteHeroes(spriteEl) {
  if (!spriteEl) return null;
  const heroes = Array.from(spriteEl.querySelectorAll('.boks-hero'));
  if (heroes.length <= 1) return heroes[0] || null;
  const keep = heroes[heroes.length - 1];
  heroes.slice(0, -1).forEach(hero => {
    window.BOKS_CHARACTER_RENDERER?.destroyIn?.(hero);
    hero.remove();
  });
  return keep;
}

function applySpriteMarkup(spriteEl, markup, renderToken, { animate = true, preservePlayback = true } = {}) {
  if (!spriteEl) return;
  clearSpriteSwapTimer(spriteEl);
  const currentHero = pruneSpriteHeroes(spriteEl);
  const playbackSnapshot = preservePlayback && currentHero
    ? window.BOKS_CHARACTER_RENDERER?.getPlaybackSnapshot?.(currentHero) || null
    : null;

  window.BOKS_CHARACTER_RENDERER?.destroyIn?.(spriteEl);
  spriteEl.innerHTML = markup;
  spriteEl.dataset.heroRenderToken = renderToken;
  window.BOKS_CHARACTER_RENDERER?.applyPlaybackSnapshot?.(spriteEl, playbackSnapshot);
  window.BOKS_CHARACTER_RENDERER?.mountIn?.(spriteEl);
}

function resetSpritePresentation() {
  const sprite = document.getElementById('sprite');
  setCharacterAction('idle');
  clearBoksTouchRebukeState();
  clearBoksGoalBubbleImpactState();
  if (sprite) {
    clearSpriteSwapTimer(sprite);
    window.BOKS_CHARACTER_RENDERER?.destroyIn?.(sprite);
    delete sprite.dataset.heroRenderToken;
    delete sprite.dataset.visualOrientation;
    sprite.style.removeProperty('--sprite-rotation');
    sprite.style.removeProperty('transform');
    sprite.getAnimations().forEach(a => a.cancel());
  }
  const ghost = document.getElementById('ghost');
  if (ghost) {
    window.BOKS_CHARACTER_RENDERER?.destroyIn?.(ghost);
    delete ghost.dataset.visualOrientation;
    ghost.style.removeProperty('--sprite-rotation');
    ghost.style.removeProperty('transform');
  }
  updateAnimationDebugBadge();
  return sprite;
}

function syncSprite(overrides = null) {
  const s = document.getElementById('sprite');
  if (!s) {
    clearDecorationTouchCooldowns();
    updateAnimationDebugBadge();
    return;
  }
  if (!playerPlaced) {
    clearDecorationTouchCooldowns();
    clearBoksTouchRebukeState();
    clearBoksGoalBubbleImpactState();
    clearSpriteSwapTimer(s);
    window.BOKS_CHARACTER_RENDERER?.destroyIn?.(s);
    delete s.dataset.heroRenderToken;
    delete s.dataset.visualOrientation;
    s.style.removeProperty('--sprite-rotation');
    s.style.removeProperty('transform');
    s.innerHTML = '';
    s.style.width = '0px';
    s.style.height = '0px';
    s.style.opacity = '0';
    updateAnimationDebugBadge();
    return;
  }
  const r = cellPos(pos.x, pos.y);
  if(!r) {
    clearDecorationTouchCooldowns();
    updateAnimationDebugBadge();
    return;
  }
  const sr = spriteRectFromCellRect(r);
  s.style.opacity = '1';
  s.style.left = sr.l+'px'; s.style.top = sr.t+'px';
  s.style.width = sr.w+'px'; s.style.height = sr.h+'px';
  const renderState = overrides
    ? getCharacterRenderState(overrides)
    : getCharacterRenderState();
  const visualDirection = overrides?.direction || ori;
  applySpriteContainerOrientation(renderState.characterId, visualDirection, s);
  window.BOKS_CHARACTER_RENDERER?.preloadCharacterAssets?.(renderState.characterId);
  const renderInfo = window.BOKS_CHARACTER_RENDERER?.resolveConfig?.(renderState) || null;
  const renderToken = window.BOKS_CHARACTER_RENDERER?.getRenderToken?.(renderState) || '';
  if (renderToken && s.dataset.heroRenderToken === renderToken && s.innerHTML) {
    window.BOKS_CHARACTER_RENDERER?.mountIn?.(s);
    applyBoksReactionStates();
    if (!animating) requestAnimationFrame(() => triggerTouchedDecorationReactions());
    updateAnimationDebugBadge();
    return;
  }
  const markup = svgRobot(renderState);
  if (!markup) {
    clearDecorationTouchCooldowns();
    clearBoksTouchRebukeState();
    clearBoksGoalBubbleImpactState();
    clearSpriteSwapTimer(s);
    window.BOKS_CHARACTER_RENDERER?.destroyIn?.(s);
    delete s.dataset.heroRenderToken;
    s.innerHTML = '';
    updateAnimationDebugBadge();
    return;
  }
  const preservePlayback = renderInfo?.resolved?.state?.restartPlayback !== true;
  applySpriteMarkup(s, markup, renderToken, { animate: true, preservePlayback });
  applyBoksReactionStates();
  if (!animating) requestAnimationFrame(() => triggerTouchedDecorationReactions());
  updateAnimationDebugBadge();
  requestAnimationFrame(() => updateAnimationDebugBadge());
}

function orientationAngle(orientation = 'right') {
  return ({
    right: 0,
    down: 90,
    left: 180,
    up: -90
  })[orientation] ?? 0;
}

function orientationDelta(fromOri = 'right', toOri = 'right') {
  let delta = orientationAngle(toOri) - orientationAngle(fromOri);
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function buildTurnInterpolationKeyframes(delta = 0) {
  const start = -delta;
  const overshoot = delta === 0
    ? 0
    : Math.sign(delta) * Math.min(10, Math.max(4, Math.abs(delta) * 0.12));
  return [
    {
      transform: `translate3d(0, 0, 0) rotate(${start}deg) scale(0.97)`
    },
    {
      transform: `translate3d(0, -1.5%, 0) rotate(${overshoot}deg) scale(1.02)`,
      offset: 0.72
    },
    {
      transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)'
    }
  ];
}

async function animateTurnInterpolation(previousOri, newOri, durationMs = TURN_MS) {
  const activeCharacterId = resolveRuntimeCharacterId(getActiveCharacterId());
  if (isContainerDrivenCharacter(activeCharacterId)) {
    const spriteEl = document.getElementById('sprite');
    const visualEl = spriteEl?.querySelector('.boks-hero');
    if (!spriteEl || !visualEl) {
      await sleep(durationMs);
      return;
    }
    const delta = orientationDelta(previousOri, newOri);
    const fromDeg = orientationAngle(previousOri);
    // Angolo continuo: evita wrap -90 <-> 180 che causa scatti sul primo turn left.
    const toDeg = fromDeg + delta;
    const overshoot = delta === 0
      ? 0
      : Math.sign(delta) * Math.min(10, Math.max(4, Math.abs(delta) * 0.12));
    const turnAnim = visualEl.animate(
      [
        { transform: `translateZ(0) rotate(${fromDeg}deg) scale(0.97)` },
        { transform: `translateZ(0) rotate(${toDeg + overshoot}deg) scale(1.02)`, offset: 0.72 },
        { transform: `translateZ(0) rotate(${toDeg}deg) scale(1)` }
      ],
      {
        duration: durationMs,
        easing: 'cubic-bezier(.22,1,.36,1)',
        fill: 'forwards'
      }
    );
    await turnAnim.finished.catch(()=>{});
    turnAnim.cancel();
    visualEl.style.transform = '';
    applySpriteContainerOrientation(activeCharacterId, newOri, spriteEl);
    return;
  }

  const spriteEl = document.getElementById('sprite');
  const heroArt = spriteEl?.querySelector('.boks-hero__art');
  const target = heroArt || spriteEl;
  if (!target) {
    await sleep(durationMs);
    return;
  }

  const delta = orientationDelta(previousOri, newOri);
  const turnAnim = target.animate(
    buildTurnInterpolationKeyframes(delta),
    {
      duration: durationMs,
      easing: 'cubic-bezier(.22,1,.36,1)',
      fill: 'forwards'
    }
  );

  await turnAnim.finished.catch(()=>{});
  if (typeof turnAnim.commitStyles === 'function') {
    try { turnAnim.commitStyles(); } catch (_) {}
  }
  turnAnim.cancel();
  target.style.transform = '';
}

async function animTo(tx, ty) {
  if(animating) return;
  animating = true;
  const s = document.getElementById('sprite');
  const enteringGoal = goalPlaced && tx === GOAL.x && ty === GOAL.y;
  let popTimer = null;
  let popPromise = null;
  let impactTimer = null;
  let goalImpactTriggered = false;
  let fr = cellPos(pos.x, pos.y), to = cellPos(tx, ty);
  if(!fr || !to) {
    sizeGrid();
    drawBackground();
    syncSprite();
    await sleep(16);
    fr = cellPos(pos.x, pos.y);
    to = cellPos(tx, ty);
  }
  if(!fr || !to) {
    pos={x:tx,y:ty};
    setCharacterAction('idle');
    syncSprite();
    animating=false;
    return;
  }
  const sfr = spriteRectFromCellRect(fr);
  const sto = spriteRectFromCellRect(to);
  const dx = Math.round((sfr.l - sto.l) * 100) / 100;
  const dy = Math.round((sfr.t - sto.t) * 100) / 100;
  s.style.left = sto.l + 'px';
  s.style.top = sto.t + 'px';
  const a = s.animate(
    [
      { transform: `translate3d(${dx}px, ${dy}px, 0)` },
      { transform: 'translate3d(0, 0, 0)' }
    ],
    {duration:MOVE_MS, easing:'cubic-bezier(.2,.9,.2,1)', fill:'forwards'}
  );
  if (enteringGoal) {
    scheduleWinFeedback(1000);
    const impactDelay = Math.max(20, Math.min(Math.round(MOVE_MS * 0.28), BOKS_GOAL_BUBBLE_LEAD_IN_MS));
    impactTimer = setTimeout(() => {
      goalImpactTriggered = triggerBoksGoalBubbleImpact();
    }, impactDelay);
    const popDelay = Math.max(20, Math.round(MOVE_MS * 0.2));
    popTimer = setTimeout(() => {
      popPromise = popGoalBubble();
      scheduleBoksGoalBubbleEyeReopen();
    }, popDelay);
  }
  await a.finished.catch(()=>{});
  if (impactTimer) {
    clearTimeout(impactTimer);
    impactTimer = null;
  }
  if (popTimer) {
    clearTimeout(popTimer);
    popTimer = null;
  }
  if (enteringGoal && !goalImpactTriggered) {
    triggerBoksGoalBubbleImpact();
  }
  if (enteringGoal && !popPromise) {
    popPromise = popGoalBubble();
    scheduleBoksGoalBubbleEyeReopen();
  }
  if (popPromise) {
    await popPromise;
  }
  a.cancel();
  s.style.transform = '';
  pos={x:tx,y:ty};
  setCharacterAction('idle');
  syncSprite();
  triggerTouchedDecorationReactions();
  animating=false;
}

// ═══ SPRITE DRAG ═══
function setupSpriteDrag() {
  const s = document.getElementById('sprite');
  function start(cx,cy) {
    if(!editorMode||running||animating||!playerPlaced) return false;
    const g = document.getElementById('ghost');
    const w = s.offsetWidth;
    const h = s.offsetHeight;
    const renderState = getCharacterRenderState();
    window.BOKS_CHARACTER_RENDERER?.destroyIn?.(g);
    g.innerHTML = svgRobot(renderState);
    g.style.cssText = `display:block;width:${w}px;height:${h}px;left:${cx}px;top:${cy}px;`;
    applySpriteContainerOrientation(renderState.characterId, ori, g);
    s.style.opacity = '0.3'; return true;
  }
  function move(cx,cy) {
    const g = document.getElementById('ghost');
    g.style.left=cx+'px'; g.style.top=cy+'px';
    g.style.display='none';
    const u = document.elementFromPoint(cx,cy);
    g.style.display='block';
    document.querySelectorAll('.cell.hi').forEach(c=>c.classList.remove('hi'));
    u?.closest('.cell')?.classList.add('hi');
  }
  async function end(cx,cy) {
    document.getElementById('ghost').style.display='none';
    window.BOKS_CHARACTER_RENDERER?.destroyIn?.(document.getElementById('ghost'));
    s.style.opacity='1';
    document.querySelectorAll('.cell.hi').forEach(c=>c.classList.remove('hi'));
    const u = document.elementFromPoint(cx,cy);
    const cell = u?.closest('.cell');
    if(cell) {
      const tx = +cell.dataset.cx;
      const ty = +cell.dataset.cy;
      const blocked = isBlockedCell(tx, ty);
      const overlapsGoal = goalPlaced && tx === GOAL.x && ty === GOAL.y;
      if (!blocked && (!editorMode || !overlapsGoal)) {
        await animTo(tx, ty);
      }
    }
    syncSprite();
    requestAnimationFrame(() => triggerTouchedDecorationReactions());
    refreshEditorDebug();
  }
  s.addEventListener('touchstart',e=>{
    if (!editorMode) {
      e.preventDefault();
      e.stopPropagation();
      triggerBoksTouchRebuke();
      return;
    }
    e.preventDefault(); e.stopPropagation();
    const t=e.touches[0]; if(!start(t.clientX,t.clientY)) return;
    const mm=e=>{e.preventDefault();move(e.touches[0].clientX,e.touches[0].clientY);};
    const mu=e=>{e.preventDefault();end(e.changedTouches[0].clientX,e.changedTouches[0].clientY);s.removeEventListener('touchmove',mm);s.removeEventListener('touchend',mu);};
    s.addEventListener('touchmove',mm,{passive:false});
    s.addEventListener('touchend',mu,{passive:false});
  },{passive:false});
  s.addEventListener('mousedown',e=>{
    if (!editorMode) {
      e.preventDefault();
      triggerBoksTouchRebuke();
      return;
    }
    e.preventDefault(); if(!start(e.clientX,e.clientY)) return;
    const mm=e=>move(e.clientX,e.clientY);
    const mu=e=>{end(e.clientX,e.clientY);document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
    document.addEventListener('mousemove',mm);
    document.addEventListener('mouseup',mu);
  });
}

function setupGoalDrag() {
  getLevelEditor()?.setupGoalDrag();
}

function normalizeLevelName(name = '') {
  return name.trim().replace(/\s+/g, ' ').slice(0, 32);
}

function cloneCustomLevel(level) {
  return JSON.parse(JSON.stringify(level));
}

function getCharacterDefs() {
  const defs = window.BOKS_CHARACTER_DEFS || {};
  return defs && typeof defs === 'object' ? defs : {};
}

function getCharacterIds() {
  const defs = getCharacterDefs();
  const seen = new Set();
  const ids = [];
  Object.entries(defs).forEach(([key, def]) => {
    const canonicalId = typeof def?.id === 'string' && def.id.trim() ? def.id.trim() : key;
    if (!canonicalId || seen.has(canonicalId)) return;
    seen.add(canonicalId);
    ids.push(canonicalId);
  });
  if (!seen.has(DEFAULT_CHARACTER_ID)) ids.unshift(DEFAULT_CHARACTER_ID);
  return ids;
}

function canUseCharacterInLightweightMode(characterId) {
  const resolvedId = resolveCharacterId(characterId);
  const manifest = getCharacterDefs()[resolvedId];
  if (!manifest?.states || typeof manifest.states !== 'object') return false;
  return Object.values(manifest.states).every(state => (
    !!state?.svgSrc
    || !!state?.svgMarkup
    || !!state?.htmlMarkup
    || !!state?.src
  ));
}

function hasRenderableCharacterState(characterId, stateKey) {
  const resolvedId = resolveCharacterId(characterId);
  const manifest = getCharacterDefs()[resolvedId];
  const state = manifest?.states?.[stateKey];
  return !!state && (
    !!state.svgSrc
    || !!state.svgMarkup
    || !!state.htmlMarkup
    || !!state.src
  );
}

function isCharacterEditorApproved(characterId) {
  const resolvedId = resolveCharacterId(characterId);
  const manifest = getCharacterDefs()[resolvedId];
  if (!manifest?.editorApproved) return false;
  return ['right', 'left', 'up', 'down'].every(direction => (
    hasRenderableCharacterState(resolvedId, `idle:${direction}`)
  ));
}

function resolveRuntimeCharacterId(characterId) {
  const resolved = resolveCharacterId(characterId);
  if (!FORCE_LIGHTWEIGHT_CHARACTER) return resolved;
  if (canUseCharacterInLightweightMode(resolved)) return resolved;
  const ids = getCharacterIds();
  return ids.includes(LIGHTWEIGHT_CHARACTER_ID) ? LIGHTWEIGHT_CHARACTER_ID : resolved;
}

function resolveCharacterId(characterId) {
  const raw = typeof characterId === 'string' ? characterId.trim() : '';
  const defs = getCharacterDefs();
  if (raw && defs[raw]) {
    const canonicalId = typeof defs[raw]?.id === 'string' && defs[raw].id.trim()
      ? defs[raw].id.trim()
      : raw;
    return canonicalId;
  }
  const ids = getCharacterIds();
  if (raw && ids.includes(raw)) return raw;
  return ids[0] || DEFAULT_CHARACTER_ID;
}

function getCharacterLabel(characterId) {
  const resolvedId = resolveCharacterId(characterId);
  const manifest = getCharacterDefs()[resolvedId] || {};
  return manifest.label || manifest.name || resolvedId;
}

function normalizePoint(point, fallback = null) {
  if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
    return { x: point.x, y: point.y };
  }
  return fallback ? { ...fallback } : null;
}

function parseBlockedCellsToArray() {
  return [...blockedCells].map(key => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  });
}

function customIconSVG(icon) {
  const icons = {
    leaf: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><path d="M39 9C26 10 13 18 11 31c-1 7 6 10 12 8 10-2 18-14 16-30Z" fill="#71c85f" stroke="#3f8c33" stroke-width="2"/><path d="M16 32c6-4 12-10 18-18" fill="none" stroke="#3f8c33" stroke-width="2.2" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><path d="m24 6 5.2 10.5 11.6 1.7-8.4 8.2 2 11.6L24 32.4 13.6 38l2-11.6-8.4-8.2 11.6-1.7Z" fill="#ffd34d" stroke="#c39217" stroke-width="2"/></svg>',
    boks: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><defs><linearGradient id="editorBoksFace" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7fda68"/><stop offset="100%" stop-color="#58b44f"/></linearGradient><linearGradient id="editorBoksSide" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2f8f3a"/><stop offset="100%" stop-color="#226c30"/></linearGradient></defs><g transform="translate(4 5)"><path d="M6 7.5C6 4.462 8.462 2 11.5 2h15C29.538 2 32 4.462 32 7.5v19c0 3.038-2.462 5.5-5.5 5.5h-15C8.462 32 6 29.538 6 26.5Z" fill="url(#editorBoksFace)" stroke="#3f8c33" stroke-width="2.2"/><path d="M6 26.5v-19C6 4.462 8.462 2 11.5 2H14v30H11.5C8.462 32 6 29.538 6 26.5Z" fill="url(#editorBoksSide)" opacity="0.98"/><rect x="10.2" y="6.2" width="17.4" height="4.2" rx="2.1" fill="rgba(255,255,255,0.22)"/><ellipse cx="31.2" cy="18.8" rx="5.2" ry="5.8" fill="#fffdf7" stroke="rgba(63,140,51,0.18)" stroke-width="1.2"/><circle cx="32.6" cy="18.8" r="1.55" fill="#2c2a28"/><circle cx="33.1" cy="18.4" r="0.45" fill="#ffffff"/></g></svg>',
    turtle: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><ellipse cx="24" cy="24" rx="12" ry="10" fill="#97dd75" stroke="#58a44a" stroke-width="2"/><circle cx="37" cy="24" r="4" fill="#97dd75" stroke="#58a44a" stroke-width="2"/><circle cx="18" cy="15" r="2.2" fill="#58a44a"/><circle cx="30" cy="15" r="2.2" fill="#58a44a"/><circle cx="17" cy="34" r="2.5" fill="#58a44a"/><circle cx="31" cy="34" r="2.5" fill="#58a44a"/></svg>',
    sun: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><circle cx="24" cy="24" r="9" fill="#ffcf40" stroke="#d79a14" stroke-width="2"/><g stroke="#d79a14" stroke-width="2.5" stroke-linecap="round"><path d="M24 5v7"/><path d="M24 36v7"/><path d="M5 24h7"/><path d="M36 24h7"/><path d="m10 10 5 5"/><path d="m33 33 5 5"/><path d="m38 10-5 5"/><path d="m15 33-5 5"/></g></svg>',
    moon: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><path d="M31 7c-8 2-14 10-14 19 0 6 3 11 8 14-9 1-18-6-18-16C7 14 16 6 27 6c1 0 3 0 4 1Z" fill="#7ea6df" stroke="#4f78b8" stroke-width="2"/></svg>',
    flower: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><circle cx="24" cy="24" r="4.5" fill="#f5c542"/><circle cx="24" cy="13" r="6" fill="#ffb3c8"/><circle cx="35" cy="24" r="6" fill="#ffd79d"/><circle cx="24" cy="35" r="6" fill="#d2f0ff"/><circle cx="13" cy="24" r="6" fill="#fff0a8"/></svg>'
  };
  return icons[icon] || icons.leaf;
}

function elementPaletteIcon(type) {
  if (type === 'player') {
    return customIconSVG('boks').replace('width="24" height="24"', 'width="38" height="38"');
  }
  if (type === 'goal') {
    return window.BOKS_GOAL_CHARACTER?.iconMarkup?.({
      size: 38,
      rim: '#a25a69',
      panelTop: '#fff8fb',
      panelBottom: '#ffdbe3',
      shadow: 'rgba(83, 28, 39, 0.14)'
    }) || '<svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true"><path d="M39 9C26 10 13 18 11 31c-1 7 6 10 12 8 10-2 18-14 16-30Z" fill="#71c85f" stroke="#3f8c33" stroke-width="2"/><path d="M16 32c6-4 12-10 18-18" fill="none" stroke="#3f8c33" stroke-width="2.2" stroke-linecap="round"/></svg>';
  }
  return '<svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true"><rect x="10" y="12" width="28" height="22" rx="5" fill="#c8a271" stroke="#8c6744" stroke-width="2.2"/><path d="M13 20h22M13 26h22" stroke="#8c6744" stroke-width="2" stroke-linecap="round" opacity="0.65"/></svg>';
}

function normalizeDecorationLayer(layer = 'object') {
  const normalized = typeof layer === 'string' ? layer.trim().toLowerCase() : '';
  return DECORATION_LAYERS.includes(normalized) ? normalized : 'object';
}

function resolveDecorationAssetId(assetId = '') {
  const raw = typeof assetId === 'string' ? assetId.trim().toLowerCase() : '';
  if (!raw) return '';
  if (raw === 'bridge_h' || raw === 'bridge_v') return 'bridge';
  if (raw === 'bee' || raw === 'ape' || raw === 'ape2' || raw === 'ambient_bee') return 'bee_hover';
  return DECORATION_ASSET_DEFS[raw] ? raw : '';
}

function getDecorationAssetDef(assetId) {
  const resolvedId = resolveDecorationAssetId(assetId);
  return DECORATION_ASSET_DEFS[resolvedId] || null;
}

function getDecorationDefaultOptions(assetId) {
  const def = getDecorationAssetDef(assetId);
  return { ...(def?.defaults || {}) };
}

function getDecorationBrushOptions(assetId) {
  const resolvedId = resolveDecorationAssetId(assetId);
  return {
    ...getDecorationDefaultOptions(resolvedId),
    ...(decorationBrushSettings[resolvedId] || {})
  };
}

function setDecorationBrushOptions(assetId, nextOptions = {}) {
  const resolvedId = resolveDecorationAssetId(assetId);
  if (!resolvedId) return;
  decorationBrushSettings = {
    ...decorationBrushSettings,
    [resolvedId]: {
      ...getDecorationDefaultOptions(resolvedId),
      ...nextOptions
    }
  };
}

function getDecorationPreviewMarkup(assetId) {
  return `<span class="cell-decoration-preview">${renderDecorationAssetMarkup({
    asset: assetId,
    ...getDecorationBrushOptions(assetId)
  })}</span>`;
}

function normalizeDecorationCount(count, fallback = 1) {
  const numeric = Number(count);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.min(10, Math.round(numeric)));
}

function renderDecorationAssetMarkup(assetInput) {
  const assetId = typeof assetInput === 'string'
    ? resolveDecorationAssetId(assetInput)
    : resolveDecorationAssetId(assetInput?.asset);
  const options = typeof assetInput === 'string'
    ? getDecorationBrushOptions(assetId)
    : {
      ...getDecorationDefaultOptions(assetId),
      ...(assetInput || {})
    };
  switch (assetId) {
    case 'tree_small': {
      const foliage = parseColorToHex(options.foliageColor) || '#5dae61';
      const foliageDark = shiftHexColor(foliage, -24);
      const foliageLight = shiftHexColor(foliage, 18);
      const trunk = parseColorToHex(options.trunkColor) || '#8f6136';
      const trunkDark = shiftHexColor(trunk, -18);
      return `<svg class="cell-decoration-svg" viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="39" rx="12" ry="4" fill="rgba(45,84,31,0.22)"/><rect x="21" y="24" width="6" height="12" rx="2" fill="${trunk}"/><rect x="22" y="24" width="2" height="12" rx="1" fill="${trunkDark}" opacity="0.45"/><circle cx="24" cy="20" r="9" fill="${foliage}"/><circle cx="17" cy="23" r="7" fill="${foliageDark}"/><circle cx="31" cy="23" r="7" fill="${foliageLight}"/></svg>`;
    }
    case 'daisy_flower':
      return '<svg class="cell-decoration-svg" viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="39" rx="8.5" ry="2.8" fill="rgba(65,104,49,0.16)"/><path d="M24 23v13" stroke="#5e9b4f" stroke-width="2.8" stroke-linecap="round"/><path d="M23 30c-3.4-3.2-6.1-2.8-7.8-.6 3.6 1.8 6 1.8 7.8.6Z" fill="#77bc62"/><path d="M25 27.8c3.3-2.8 5.8-2.4 7.3-.3-3.1 1.6-5.4 1.5-7.3.3Z" fill="#6faf58"/><g fill="#fff8f3" stroke="#d8d1c8" stroke-width="0.75"><ellipse cx="24" cy="14.8" rx="3" ry="7.8"/><ellipse cx="24" cy="14.8" rx="3" ry="7.8" transform="rotate(45 24 14.8)"/><ellipse cx="24" cy="14.8" rx="3" ry="7.8" transform="rotate(90 24 14.8)"/><ellipse cx="24" cy="14.8" rx="3" ry="7.8" transform="rotate(135 24 14.8)"/></g><circle cx="24" cy="14.8" r="4.1" fill="#f0c441" stroke="#cc9a1b" stroke-width="1.1"/></svg>';
    case 'bee_hover':
      return '<svg class="cell-decoration-svg" viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="26" rx="11" ry="8" fill="#f2c94c" stroke="#3d2b12" stroke-width="2"/><path d="M18 22h12M18 26h12M18 30h12" stroke="#3d2b12" stroke-width="1.8" stroke-linecap="round"/><circle cx="33" cy="24.5" r="1.7" fill="#3d2b12"/><ellipse cx="18.5" cy="17" rx="6.2" ry="4.1" fill="rgba(202,240,255,0.9)" stroke="rgba(88,143,168,0.9)" stroke-width="1.2"/><ellipse cx="29" cy="14.5" rx="6.2" ry="4.1" fill="rgba(202,240,255,0.9)" stroke="rgba(88,143,168,0.9)" stroke-width="1.2"/></svg>';
    case 'bridge':
      return '<svg class="cell-decoration-svg" viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19h32v3H8zm0 10h32v3H8z" fill="#7c5431"/><path d="M10 16h4v18h-4zm8 1h4v16h-4zm8 0h4v16h-4zm8-1h4v18h-4z" fill="#c89157" stroke="#8a6038" stroke-width="0.8"/></svg>';
    default:
      return '<svg class="cell-decoration-svg" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="8" fill="#ddd"/></svg>';
  }
}

function getGridMetrics() {
  const wrap = document.getElementById('gridWrap');
  const grid = document.getElementById('gameGrid');
  const firstCell = getGridCell(0, 0);
  if (!wrap || !grid || !firstCell) return null;
  const wrapRect = wrap.getBoundingClientRect();
  const gridRect = grid.getBoundingClientRect();
  const cellRect = firstCell.getBoundingClientRect();
  return {
    wrapLeft: gridRect.left - wrapRect.left,
    wrapTop: gridRect.top - wrapRect.top,
    width: gridRect.width,
    height: gridRect.height,
    cellWidth: cellRect.width,
    cellHeight: cellRect.height
  };
}

function ensureGridDecorationLayer() {
  const wrap = document.getElementById('gridWrap');
  if (!wrap) return null;
  let layer = document.getElementById('gridDecor');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'gridDecor';
    layer.setAttribute('aria-hidden', 'true');
    wrap.appendChild(layer);
  }
  return layer;
}

function ensureGridDecorationFxLayer() {
  const wrap = document.getElementById('gridWrap');
  if (!wrap) return null;
  let layer = document.getElementById('gridDecorFx');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'gridDecorFx';
    layer.setAttribute('aria-hidden', 'true');
    wrap.appendChild(layer);
  }
  return layer;
}

function clearDecorationTouchCooldowns() {
  decorationTouchCooldowns.clear();
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function buildBeeDecorationRuntimeMarkup() {
  return `
    <span class="grid-decoration-bee__fallback" aria-hidden="true">
      ${renderDecorationAssetMarkup('bee_hover')}
    </span>
    <span class="grid-decoration-bee__lottie"></span>
  `;
}

function getBeeDecorationCount(entry) {
  return normalizeDecorationCount(entry?.count, 3);
}

function buildBeeDecorationActorId(entryId, index) {
  return `${entryId}::${index}`;
}

function shouldUseLottieForBeeActor(globalIndex) {
  return globalIndex < DECORATION_BEE_MAX_LOTTIE_ACTORS;
}

function getBeeDecorationActorSeed(index = 0) {
  const golden = 0.61803398875;
  return ((index + 1) * golden) % 1;
}

function getBeeSwarmSpread(entry, metrics = null) {
  const count = getBeeDecorationCount(entry);
  const cellUnitX = metrics?.width ? (metrics.cellWidth / metrics.width) : (1 / COLS);
  const cellUnitY = metrics?.height ? (metrics.cellHeight / metrics.height) : (1 / ROWS);
  const spreadFactor = 0.6 + (Math.sqrt(Math.max(1, count)) * 0.42);
  return {
    count,
    radiusX: Math.min(0.34, cellUnitX * spreadFactor),
    radiusY: Math.min(0.32, cellUnitY * (spreadFactor * 0.92))
  };
}

function getBeeFlightBounds(metrics = null) {
  if (!metrics) {
    return {
      minX: 0.06,
      maxX: 0.94,
      minY: 0.08,
      maxY: 0.9
    };
  }
  const marginX = Math.max(0.05, Math.min(0.11, (metrics.cellWidth * 0.45) / Math.max(metrics.width, 1)));
  const marginY = Math.max(0.06, Math.min(0.12, (metrics.cellHeight * 0.45) / Math.max(metrics.height, 1)));
  return {
    minX: marginX,
    maxX: 1 - marginX,
    minY: marginY,
    maxY: 1 - marginY
  };
}

function clearHeroBeeNearState() {
  const hero = document.querySelector('#sprite .boks-hero');
  if (hero) hero.dataset.beeNear = 'false';
}

function destroyBeeDecorationActor(actor) {
  if (!actor) return;
  actor.animation?.destroy?.();
  actor.mount?.remove?.();
}

function stopBeeDecorationLoop() {
  if (decorationFxState.raf) {
    window.cancelAnimationFrame(decorationFxState.raf);
    decorationFxState.raf = 0;
  }
}

function requestLottieRuntimeForDecor() {
  if (decorationFxState.lottieRuntimeRequested) return;
  const loader = window.BOKS_RUNTIME_CONFIG?.ensureLottieRuntime;
  if (typeof loader !== 'function') return;
  decorationFxState.lottieRuntimeRequested = true;
  loader()
    .catch(() => false)
    .finally(() => {
      decorationFxState.lottieRuntimeRequested = false;
      if (appSceneVisible && decorationFxState.beeActors.size) {
        updateBeeDecorationActors();
        startBeeDecorationLoop();
      }
    });
}

function pickBeeDecorationTarget(actor, metrics = getGridMetrics()) {
  if (!actor || !metrics) return;
  const bounds = getBeeFlightBounds(metrics);
  actor.startX = Number.isFinite(actor.x) ? actor.x : actor.homeX;
  actor.startY = Number.isFinite(actor.y) ? actor.y : actor.homeY;
  actor.targetX = bounds.minX + (Math.random() * (bounds.maxX - bounds.minX));
  actor.targetY = bounds.minY + (Math.random() * (bounds.maxY - bounds.minY));
  actor.legStart = window.performance?.now?.() || Date.now();
  actor.legDuration = 1400 + Math.random() * 2200;
}

function ensureBeeDecorationActor(entry, index = 0, globalIndex = index) {
  const layer = ensureGridDecorationFxLayer();
  if (!layer || !entry?.id) return null;
  const actorId = buildBeeDecorationActorId(entry.id, index);
  let actor = decorationFxState.beeActors.get(actorId) || null;
  const nextHomeX = Number.isFinite(entry.anchorX) ? entry.anchorX : (((entry.x ?? 0) + 0.5) / COLS);
  const nextHomeY = Number.isFinite(entry.anchorY) ? entry.anchorY : (((entry.y ?? 0) + 0.5) / ROWS);
  const nextScale = Number.isFinite(entry.scale) ? entry.scale : 1;
  const swarm = getBeeSwarmSpread(entry, getGridMetrics());
  const seed = getBeeDecorationActorSeed(index);
  const orbitAngle = seed * Math.PI * 2;
  const orbitDistance = swarm.count <= 1
    ? 0
    : (0.34 + ((index / Math.max(1, swarm.count - 1)) * 0.72));
  const orbitRadiusX = swarm.radiusX * orbitDistance;
  const orbitRadiusY = swarm.radiusY * orbitDistance;
  const offsetX = Math.cos(orbitAngle) * orbitRadiusX;
  const offsetY = Math.sin(orbitAngle) * orbitRadiusY;
  const prefersLottie = shouldUseLottieForBeeActor(globalIndex);

  if (!actor) {
    const mount = document.createElement('span');
    mount.className = 'grid-decoration grid-decoration--bee grid-decoration-layer--overlay';
    mount.innerHTML = buildBeeDecorationRuntimeMarkup();
    layer.appendChild(mount);
    actor = {
      id: actorId,
      entryId: entry.id,
      actorIndex: index,
      globalIndex,
      mount,
      animation: null,
      homeX: nextHomeX,
      homeY: nextHomeY,
      scale: nextScale,
      swarmRadiusX: swarm.radiusX,
      swarmRadiusY: swarm.radiusY,
      offsetX,
      offsetY,
      x: clamp01(nextHomeX + offsetX),
      y: clamp01(nextHomeY + offsetY),
      startX: clamp01(nextHomeX + offsetX),
      startY: clamp01(nextHomeY + offsetY),
      targetX: clamp01(nextHomeX + offsetX),
      targetY: clamp01(nextHomeY + offsetY),
      legStart: 0,
      legDuration: 0,
      bobPhase: Math.random() * Math.PI * 2,
      width: 0,
      height: 0,
      prefersLottie
    };
    decorationFxState.beeActors.set(actorId, actor);
  } else if (
    Math.abs(actor.homeX - nextHomeX) > 0.0005
    || Math.abs(actor.homeY - nextHomeY) > 0.0005
    || Math.abs((actor.swarmRadiusX || 0) - swarm.radiusX) > 0.002
    || Math.abs((actor.swarmRadiusY || 0) - swarm.radiusY) > 0.002
    || Math.abs((actor.offsetX || 0) - offsetX) > 0.002
    || Math.abs((actor.offsetY || 0) - offsetY) > 0.002
  ) {
    actor.homeX = nextHomeX;
    actor.homeY = nextHomeY;
    actor.swarmRadiusX = swarm.radiusX;
    actor.swarmRadiusY = swarm.radiusY;
    actor.offsetX = offsetX;
    actor.offsetY = offsetY;
    actor.x = clamp01(nextHomeX + offsetX);
    actor.y = clamp01(nextHomeY + offsetY);
    actor.startX = clamp01(nextHomeX + offsetX);
    actor.startY = clamp01(nextHomeY + offsetY);
    actor.targetX = clamp01(nextHomeX + offsetX);
    actor.targetY = clamp01(nextHomeY + offsetY);
    actor.legStart = 0;
  } else {
    actor.homeX = nextHomeX;
    actor.homeY = nextHomeY;
    actor.swarmRadiusX = swarm.radiusX;
    actor.swarmRadiusY = swarm.radiusY;
    actor.offsetX = offsetX;
    actor.offsetY = offsetY;
  }

  actor.entryId = entry.id;
  actor.actorIndex = index;
  actor.globalIndex = globalIndex;
  actor.scale = nextScale;
  actor.prefersLottie = prefersLottie;
  actor.mount.dataset.id = actorId;
  actor.mount.dataset.entryId = entry.id;
  actor.mount.dataset.asset = entry.asset;
  actor.mount.dataset.layer = entry.layer;
  actor.mount.classList.toggle('grid-decoration-bee--lottie', prefersLottie);
  actor.mount.classList.toggle('grid-decoration-bee--fallback-only', !prefersLottie);

  if (!prefersLottie) {
    actor.animation?.destroy?.();
    actor.animation = null;
    actor.mount.classList.remove('is-lottie-ready');
  } else if (!actor.animation && window.lottie?.loadAnimation) {
    try {
      actor.animation = window.lottie.loadAnimation({
        container: actor.mount.querySelector('.grid-decoration-bee__lottie'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: DECORATION_BEE_LOTTIE_SRC
      });
      actor.animation.setSpeed?.(DECORATION_BEE_PLAYBACK_SPEED);
      actor.animation.addEventListener?.('DOMLoaded', () => {
        actor.animation?.setSpeed?.(DECORATION_BEE_PLAYBACK_SPEED);
      });
      actor.mount.classList.add('is-lottie-ready');
    } catch (_err) {
      actor.animation = null;
      actor.mount.classList.remove('is-lottie-ready');
    }
  } else if (prefersLottie && !window.lottie?.loadAnimation) {
    requestLottieRuntimeForDecor();
  }

  return actor;
}

function updateBeeDecorationActors(now = window.performance?.now?.() || Date.now()) {
  const metrics = getGridMetrics();
  if (!metrics || !decorationFxState.beeActors.size) {
    clearHeroBeeNearState();
    return;
  }

  const hero = document.querySelector('#sprite .boks-hero');
  const sprite = document.getElementById('sprite');
  const wrap = document.getElementById('gridWrap');
  const spriteRect = sprite?.getBoundingClientRect();
  const wrapRect = wrap?.getBoundingClientRect();
  let isHeroNearAnyBee = false;

  decorationFxState.beeActors.forEach(actor => {
    if (!actor?.mount?.isConnected) return;
    if (actor.prefersLottie && !actor.animation && window.lottie?.loadAnimation) {
      ensureBeeDecorationActor({
        id: actor.entryId,
        asset: 'bee_hover',
        layer: 'overlay',
        anchorX: actor.homeX,
        anchorY: actor.homeY,
        scale: actor.scale
      }, actor.actorIndex, actor.globalIndex ?? actor.actorIndex);
    }
    if (!actor.legStart) pickBeeDecorationTarget(actor, metrics);

    const elapsed = now - actor.legStart;
    const rawProgress = actor.legDuration > 0 ? (elapsed / actor.legDuration) : 1;
    const progress = clamp01(rawProgress);
    const eased = 0.5 - (Math.cos(Math.PI * progress) * 0.5);
    actor.x = actor.startX + ((actor.targetX - actor.startX) * eased);
    actor.y = actor.startY + ((actor.targetY - actor.startY) * eased);

    const width = Math.max(10, Math.round((DECORATION_BEE_BASE_SIZE - Math.min(actor.actorIndex, 4)) * actor.scale));
    const height = width;
    const localX = metrics.wrapLeft + (actor.x * metrics.width);
    const localY = metrics.wrapTop + (actor.y * metrics.height);
    const bob = Math.sin((now / 260) + actor.bobPhase) * 5;
    const drift = Math.cos((now / 410) + actor.bobPhase) * 3;
    const dx = actor.targetX - actor.startX;
    const dy = actor.targetY - actor.startY;
    const angle = (Math.atan2(dy, dx) * 180 / Math.PI) || 0;
    const tilt = Math.sin((now / 520) + actor.bobPhase) * 6;

    actor.mount.style.left = `${localX + drift}px`;
    actor.mount.style.top = `${localY + bob}px`;
    actor.mount.style.width = `${width}px`;
    actor.mount.style.height = `${height}px`;
    actor.mount.style.transform = `translate(-50%, -50%) rotate(${angle + tilt}deg)`;
    actor.width = width;
    actor.height = height;
    actor.localX = localX + drift;
    actor.localY = localY + bob;

    if (hero && spriteRect && wrapRect) {
      const spriteCenterX = (spriteRect.left - wrapRect.left) + (spriteRect.width * 0.5);
      const spriteCenterY = (spriteRect.top - wrapRect.top) + (spriteRect.height * 0.42);
      const dxHero = actor.localX - spriteCenterX;
      const dyHero = actor.localY - spriteCenterY;
      const isNear = Math.hypot(dxHero, dyHero) <= Math.max(46, spriteRect.width * 0.9);
      if (isNear) isHeroNearAnyBee = true;
    }

    if (progress >= 1) {
      pickBeeDecorationTarget(actor, metrics);
    }
  });

  if (hero) {
    hero.dataset.beeNear = isHeroNearAnyBee ? 'true' : 'false';
  }
}

function startBeeDecorationLoop() {
  if (decorationFxState.raf || !decorationFxState.beeActors.size || !appSceneVisible) return;
  const step = now => {
    if (!decorationFxState.beeActors.size || !appSceneVisible) {
      stopBeeDecorationLoop();
      clearHeroBeeNearState();
      return;
    }
    decorationFxState.raf = window.requestAnimationFrame(step);
    updateBeeDecorationActors(now);
  };
  decorationFxState.raf = window.requestAnimationFrame(step);
}

function syncBeeDecorationActors(entries = []) {
  const nextIds = new Set();
  entries.forEach(entry => {
    const count = getBeeDecorationCount(entry);
    for (let index = 0; index < count; index += 1) {
      nextIds.add(buildBeeDecorationActorId(entry.id, index));
    }
  });
  decorationFxState.beeActors.forEach((actor, id) => {
    if (nextIds.has(id)) return;
    destroyBeeDecorationActor(actor);
    decorationFxState.beeActors.delete(id);
  });

  if (!entries.length) {
    const layer = document.getElementById('gridDecorFx');
    if (layer) layer.innerHTML = '';
    clearHeroBeeNearState();
    stopBeeDecorationLoop();
    return;
  }

  let globalBeeIndex = 0;
  entries.forEach(entry => {
    const count = getBeeDecorationCount(entry);
    for (let index = 0; index < count; index += 1) {
      ensureBeeDecorationActor(entry, index, globalBeeIndex);
      globalBeeIndex += 1;
    }
  });

  updateBeeDecorationActors();
  startBeeDecorationLoop();
}

function getDecorationFrame(entry, metrics = getGridMetrics()) {
  if (!metrics) return null;
  const scale = Number.isFinite(entry?.scale) ? entry.scale : 1;
  const anchorX = Number.isFinite(entry?.anchorX)
    ? entry.anchorX
    : ((entry?.x ?? 0) + 0.5) / COLS;
  const anchorY = Number.isFinite(entry?.anchorY)
    ? entry.anchorY
    : ((entry?.y ?? 0) + 0.82) / ROWS;
  const anchorLeft = metrics.wrapLeft + (anchorX * metrics.width);
  const anchorTop = metrics.wrapTop + (anchorY * metrics.height);
  if (resolveDecorationAssetId(entry?.asset) === 'bee_hover') {
    const width = Math.max(12, Math.round(DECORATION_BEE_BASE_SIZE * scale));
    const height = width;
    return {
      left: anchorLeft - (width / 2),
      top: anchorTop - (height / 2),
      width,
      height
    };
  }
  if (resolveDecorationAssetId(entry?.asset) === 'bridge') {
    const width = metrics.cellWidth * 1.18 * scale;
    const height = metrics.cellHeight * 0.92 * scale;
    return {
      left: anchorLeft - (width / 2),
      top: anchorTop - (height * 0.72),
      width,
      height
    };
  }
  const width = metrics.cellWidth * scale;
  const height = metrics.cellHeight * scale;
  return {
    left: anchorLeft - (width / 2),
    top: anchorTop - (height * 0.88),
    width,
    height
  };
}

function getInsetFrame(frame, insetRatioX = 0, insetRatioY = insetRatioX) {
  if (!frame) return null;
  const insetX = Math.max(0, frame.width * insetRatioX);
  const insetY = Math.max(0, frame.height * insetRatioY);
  const width = Math.max(8, frame.width - (insetX * 2));
  const height = Math.max(8, frame.height - (insetY * 2));
  return {
    left: frame.left + ((frame.width - width) / 2),
    top: frame.top + ((frame.height - height) / 2),
    width,
    height
  };
}

function getDecorationTouchFrame(entry, metrics = getGridMetrics()) {
  const frame = getDecorationFrame(entry, metrics);
  if (!frame) return null;
  const def = getDecorationAssetDef(entry?.asset);
  const hitbox = def?.touchHitbox || {};
  const scaleX = Number.isFinite(hitbox.scaleX) ? hitbox.scaleX : 1;
  const scaleY = Number.isFinite(hitbox.scaleY) ? hitbox.scaleY : scaleX;
  const width = Math.max(8, frame.width * scaleX);
  const height = Math.max(8, frame.height * scaleY);
  const offsetX = (Number(hitbox.offsetX) || 0) * frame.width;
  const offsetY = (Number(hitbox.offsetY) || 0) * frame.height;
  return {
    left: frame.left + ((frame.width - width) / 2) + offsetX,
    top: frame.top + ((frame.height - height) / 2) + offsetY,
    width,
    height
  };
}

function framesIntersect(a, b) {
  if (!a || !b) return false;
  return (
    a.left < (b.left + b.width)
    && (a.left + a.width) > b.left
    && a.top < (b.top + b.height)
    && (a.top + a.height) > b.top
  );
}

function getSpriteTouchFrame() {
  const cellFrame = cellPos(pos.x, pos.y);
  if (!cellFrame) return null;
  const spriteFrame = spriteRectFromCellRect(cellFrame);
  return getInsetFrame({
    left: spriteFrame.l,
    top: spriteFrame.t,
    width: spriteFrame.w,
    height: spriteFrame.h
  }, DECORATION_TOUCH_SPRITE_INSET_RATIO);
}

function isReactiveDecoration(entry) {
  const def = getDecorationAssetDef(entry?.asset);
  return Boolean(def?.touchReactive && !def?.animated);
}

function isDecorationHostedInCell(entry, cellX, cellY) {
  if (!Number.isInteger(cellX) || !Number.isInteger(cellY)) return false;
  return Number.isInteger(entry?.x) && Number.isInteger(entry?.y) && entry.x === cellX && entry.y === cellY;
}

function isSpriteTouchingDecoration(entry, spriteFrame, metrics = getGridMetrics()) {
  const decorationFrame = getDecorationTouchFrame(entry, metrics);
  if (!decorationFrame || !spriteFrame) return false;
  if (framesIntersect(spriteFrame, decorationFrame)) return true;
  if (Number.isInteger(entry?.x) && Number.isInteger(entry?.y) && entry.x === pos.x && entry.y === pos.y) {
    return true;
  }
  const spriteCenterX = spriteFrame.left + (spriteFrame.width / 2);
  const spriteCenterY = spriteFrame.top + (spriteFrame.height / 2);
  const decorCenterX = decorationFrame.left + (decorationFrame.width / 2);
  const decorCenterY = decorationFrame.top + (decorationFrame.height / 2);
  const threshold = Math.max(decorationFrame.width, decorationFrame.height) * 0.44;
  return Math.hypot(decorCenterX - spriteCenterX, decorCenterY - spriteCenterY) <= threshold;
}

function pruneDecorationTouchCooldowns(now = (window.performance?.now?.() || Date.now())) {
  decorationTouchCooldowns.forEach((expiresAt, entryId) => {
    if (expiresAt <= now) {
      decorationTouchCooldowns.delete(entryId);
    }
  });
}

function triggerDecorationReaction(entry, now = (window.performance?.now?.() || Date.now())) {
  if (!isReactiveDecoration(entry)) return false;
  const entryId = typeof entry?.id === 'string' ? entry.id : '';
  if (!entryId) return false;
  pruneDecorationTouchCooldowns(now);
  if ((decorationTouchCooldowns.get(entryId) || 0) > now) return false;
  decorationTouchCooldowns.set(entryId, now + DECORATION_TOUCH_REACTION_COOLDOWN_MS);
  animateDecorationTouch(entry);
  playDecorationRubberSfx();
  return true;
}

function animateDecorationTouch(entry) {
  const layer = document.getElementById('gridDecor');
  if (!layer || !entry?.id) return;
  const item = layer.querySelector(`.grid-decoration[data-id="${entry.id}"]`);
  if (!item) return;
  const visual = item.querySelector('.cell-decoration-svg') || item;
  item.classList.remove('is-reacting');
  void item.offsetWidth;
  item.classList.add('is-reacting');
  item.getAnimations().forEach(animation => animation.cancel());
  visual.getAnimations().forEach(animation => animation.cancel());
  visual.animate(
    [
      { transform: 'scale(1, 1) rotate(0deg)' },
      { transform: 'scale(1.07, 0.9) rotate(-1deg)', offset: 0.26 },
      { transform: 'scale(0.965, 1.045) rotate(0.9deg)', offset: 0.62 },
      { transform: 'scale(1, 1) rotate(0deg)' }
    ],
    {
      duration: DECORATION_TOUCH_REACTION_DURATION_MS,
      easing: 'cubic-bezier(.22,.76,.24,1)',
      fill: 'both'
    }
  );
  window.setTimeout(() => item.classList.remove('is-reacting'), DECORATION_TOUCH_REACTION_DURATION_MS + 40);
}

function triggerTouchedDecorationReactions() {
  if (!playerPlaced || !activeLevelDecorations.length) return;
  const spriteFrame = getSpriteTouchFrame();
  const metrics = getGridMetrics();
  if (!spriteFrame || !metrics) return;
  const now = window.performance?.now?.() || Date.now();
  pruneDecorationTouchCooldowns(now);

  activeLevelDecorations.forEach(entry => {
    const touched = isDecorationHostedInCell(entry, pos.x, pos.y)
      || isSpriteTouchingDecoration(entry, spriteFrame, metrics);
    if (!touched) return;
    triggerDecorationReaction(entry, now);
  });
}

function bindDecorationTapReactions() {
  const wrap = document.getElementById('gridWrap');
  if (!wrap || wrap.dataset.decorationTapBound === 'true') return;
  wrap.dataset.decorationTapBound = 'true';
  wrap.addEventListener('pointerdown', e => {
    if (!(activeLevelDecorations?.length)) return;
    if (editorMode && (selectedDecorationBrush || selectedElementTool)) return;
    const hit = getDecorationHitAtPoint(e.clientX, e.clientY);
    if (!hit || !isReactiveDecoration(hit)) return;
    if (triggerDecorationReaction(hit, window.performance?.now?.() || Date.now())) {
      e.preventDefault();
    }
  });
}

function getGridPointerAnchor(clientX, clientY) {
  const grid = document.getElementById('gameGrid');
  if (!grid) return null;
  const rect = grid.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const relX = (clientX - rect.left) / rect.width;
  const relY = (clientY - rect.top) / rect.height;
  return {
    anchorX: Math.max(0, Math.min(1, Math.round(relX * 1000) / 1000)),
    anchorY: Math.max(0, Math.min(1, Math.round(relY * 1000) / 1000))
  };
}

function getDecorationHitAtPoint(clientX, clientY) {
  const wrap = document.getElementById('gridWrap');
  const metrics = getGridMetrics();
  if (!wrap || !metrics) return null;
  const wrapRect = wrap.getBoundingClientRect();
  const localX = clientX - wrapRect.left;
  const localY = clientY - wrapRect.top;
  const zIndexByLayer = { ground: 1, object: 2, overlay: 3 };
  const sorted = activeLevelDecorations
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const zA = zIndexByLayer[a.entry.layer] || 0;
      const zB = zIndexByLayer[b.entry.layer] || 0;
      if (zA !== zB) return zA - zB;
      return a.index - b.index;
    });

  for (let idx = sorted.length - 1; idx >= 0; idx -= 1) {
    const entry = sorted[idx].entry;
    if (resolveDecorationAssetId(entry?.asset) === 'bee_hover') {
      const actors = [...decorationFxState.beeActors.values()].filter(actor => actor.entryId === entry.id);
      for (let actorIndex = actors.length - 1; actorIndex >= 0; actorIndex -= 1) {
        const actor = actors[actorIndex];
        const actorWidth = Number.isFinite(actor?.width) ? actor.width : DECORATION_BEE_BASE_SIZE;
        const actorHeight = Number.isFinite(actor?.height) ? actor.height : DECORATION_BEE_BASE_SIZE;
        const frame = Number.isFinite(actor?.localX) && Number.isFinite(actor?.localY)
          ? {
            left: actor.localX - (actorWidth / 2),
            top: actor.localY - (actorHeight / 2),
            width: actorWidth,
            height: actorHeight
          }
          : getDecorationFrame(entry, metrics);
        if (!frame) continue;
        if (
          localX >= frame.left
          && localX <= frame.left + frame.width
          && localY >= frame.top
          && localY <= frame.top + frame.height
        ) {
          return entry;
        }
      }
      continue;
    }

    const frame = getDecorationFrame(entry, metrics);
    if (!frame) continue;
    if (
      localX >= frame.left
      && localX <= frame.left + frame.width
      && localY >= frame.top
      && localY <= frame.top + frame.height
    ) {
      return entry;
    }
  }
  return null;
}

function renderGridDecorations() {
  const layer = ensureGridDecorationLayer();
  const fxLayer = ensureGridDecorationFxLayer();
  if (!layer) return;
  layer.innerHTML = '';
  if (fxLayer && !activeLevelDecorations.length) {
    clearDecorationTouchCooldowns();
    syncBeeDecorationActors([]);
  }
  if (!activeLevelDecorations.length) return;
  const metrics = getGridMetrics();
  if (!metrics) {
    syncBeeDecorationActors([]);
    return;
  }

  const zIndexByLayer = {
    ground: 1,
    object: 2,
    overlay: 3
  };
  const beeEntries = [];

  activeLevelDecorations.forEach(entry => {
    const def = getDecorationAssetDef(entry.asset);
    if (!def) return;
    if (def.animated && resolveDecorationAssetId(entry.asset) === 'bee_hover') {
      beeEntries.push(entry);
      return;
    }
    const frame = getDecorationFrame(entry, metrics);
    if (!frame) return;
    const item = document.createElement('span');
    item.className = `grid-decoration grid-decoration--${entry.asset} grid-decoration-layer--${entry.layer}`;
    if (entry.id) item.dataset.id = entry.id;
    item.dataset.asset = entry.asset;
    item.dataset.layer = entry.layer;
    item.style.left = `${frame.left}px`;
    item.style.top = `${frame.top}px`;
    item.style.width = `${frame.width}px`;
    item.style.height = `${frame.height}px`;
    item.style.zIndex = String(zIndexByLayer[entry.layer] || 1);
    item.innerHTML = renderDecorationAssetMarkup(entry);
    layer.appendChild(item);
  });

  syncBeeDecorationActors(beeEntries);
}

function normalizeThemeClassName(themeId) {
  return `theme-${String(themeId || CUSTOM_LEVEL_THEME).toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}`;
}

function clampColorChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseColorToHex(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  const shortHex = normalized.match(/^#([0-9a-f]{3})$/i);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  const fullHex = normalized.match(/^#([0-9a-f]{6})$/i);
  if (fullHex) return `#${fullHex[1]}`;
  const rgb = normalized.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*[0-9.]+\s*)?\)$/i);
  if (!rgb) return null;
  const r = clampColorChannel(Number(rgb[1]));
  const g = clampColorChannel(Number(rgb[2]));
  const b = clampColorChannel(Number(rgb[3]));
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return null;
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
}

function shiftHexColor(hex, amount = 0) {
  const normalized = parseColorToHex(hex);
  if (!normalized) return '#888888';
  const r = clampColorChannel(parseInt(normalized.slice(1, 3), 16) + amount);
  const g = clampColorChannel(parseInt(normalized.slice(3, 5), 16) + amount);
  const b = clampColorChannel(parseInt(normalized.slice(5, 7), 16) + amount);
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
}

function getCampaignLockedSceneVars() {
  const campaignVars = LEVELS.level1?.sceneVars || {};
  return LOCKED_THEME_SCENE_VAR_KEYS.reduce((acc, key) => {
    const value = campaignVars[key];
    if (typeof value === 'string' && value.trim()) acc[key] = value;
    return acc;
  }, {});
}

function sanitizeThemeOverrides(source = {}) {
  const normalized = normalizeThemeOverrides(source);
  const sanitized = {};
  EDITOR_THEME_COLOR_CONTROLS.forEach(control => {
    const hex = parseColorToHex(normalized[control.key] || '');
    if (hex) sanitized[control.key] = hex;
  });
  return sanitized;
}

function sanitizeLevelHints(source = {}) {
  if (!source || typeof source !== 'object') return {};
  return {
    availableBlockGlow: !!source.availableBlockGlow
  };
}

function sanitizeStylePresetName(name = '') {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 32);
}

function sanitizeStylePreset(source = {}) {
  const id = typeof source?.id === 'string' && source.id.trim()
    ? source.id.trim()
    : `style-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const name = sanitizeStylePresetName(source?.name || '');
  if (!name) return null;
  return {
    id,
    name,
    baseLevel: resolveThemeLevelId(source?.baseLevel),
    characterId: resolveCharacterId(source?.characterId),
    themeOverrides: sanitizeThemeOverrides(source?.themeOverrides || {}),
    levelHints: sanitizeLevelHints(source?.levelHints || {})
  };
}

function readStylePresets() {
  try {
    const stored = localStorage.getItem(STYLE_PRESETS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeStylePreset).filter(Boolean);
  } catch (_err) {
    return [];
  }
}

function writeStylePresets(presets) {
  stylePresets = presets.map(sanitizeStylePreset).filter(Boolean);
  try {
    localStorage.setItem(STYLE_PRESETS_STORAGE_KEY, JSON.stringify(stylePresets));
  } catch (_err) {
    // ignore persistence issues
  }
}

function getCurrentEditorThemeOverrides() {
  if (currentCustomLevel) {
    return sanitizeThemeOverrides(currentCustomLevel.themeOverrides || {});
  }
  if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) {
    return sanitizeThemeOverrides(pendingNewLevelThemeOverrides || {});
  }
  const fallbackLevel = findCustomLevel(selectedEditorLevelId || '');
  if (fallbackLevel) {
    return sanitizeThemeOverrides(fallbackLevel.themeOverrides || {});
  }
  return {};
}

function getCurrentEditorLevelHints() {
  if (currentCustomLevel) {
    return sanitizeLevelHints(currentCustomLevel.levelHints || {});
  }
  if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) {
    return sanitizeLevelHints(pendingNewLevelHints || {});
  }
  const fallbackLevel = findCustomLevel(selectedEditorLevelId || '');
  if (fallbackLevel) {
    return sanitizeLevelHints(fallbackLevel.levelHints || {});
  }
  return {};
}

function setCurrentEditorThemeOverrides(overrides) {
  const normalized = sanitizeThemeOverrides(overrides);
  if (currentCustomLevel) {
    currentCustomLevel.themeOverrides = normalized;
    syncCurrentEditorLevelToSessionCache();
    return true;
  }
  if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) {
    pendingNewLevelThemeOverrides = normalized;
    return true;
  }
  const selectedLevel = findCustomLevel(selectedEditorLevelId || '');
  if (!selectedLevel) return false;
  const draft = collectCurrentEditorLevel();
  currentCustomLevel = normalizeCustomLevel({
    ...selectedLevel,
    ...draft,
    id: selectedLevel.id,
    number: selectedLevel.number,
    campaignIndex: selectedLevel.campaignIndex ?? selectedLevel.baseStepIndex ?? null,
    baseStepIndex: selectedLevel.baseStepIndex,
    name: selectedLevel.name,
    themeOverrides: normalized
  });
  syncCurrentEditorLevelToSessionCache();
  return true;
}

function setCurrentEditorLevelHints(levelHints) {
  const normalized = sanitizeLevelHints(levelHints);
  if (currentCustomLevel) {
    currentCustomLevel.levelHints = normalized;
    syncCurrentEditorLevelToSessionCache();
    return true;
  }
  if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) {
    pendingNewLevelHints = normalized;
    return true;
  }
  const selectedLevel = findCustomLevel(selectedEditorLevelId || '');
  if (!selectedLevel) return false;
  const draft = collectCurrentEditorLevel();
  currentCustomLevel = normalizeCustomLevel({
    ...selectedLevel,
    ...draft,
    id: selectedLevel.id,
    number: selectedLevel.number,
    campaignIndex: selectedLevel.campaignIndex ?? selectedLevel.baseStepIndex ?? null,
    baseStepIndex: selectedLevel.baseStepIndex,
    name: selectedLevel.name,
    levelHints: normalized
  });
  syncCurrentEditorLevelToSessionCache();
  return true;
}

function resetCurrentEditorThemeOverrides() {
  if (!setCurrentEditorThemeOverrides({})) return;
  applyLevelSceneVars();
  renderThemeEditorPanel();
}

function buildCurrentEditorStylePreset(name) {
  return sanitizeStylePreset({
    id: `style-${Date.now()}`,
    name,
    baseLevel: getCurrentEditorThemeId(),
    characterId: getCurrentEditorCharacterId(),
    themeOverrides: getCurrentEditorThemeOverrides(),
    levelHints: getCurrentEditorLevelHints()
  });
}

function applyStylePresetToCurrentEditor(presetId) {
  const preset = stylePresets.find(entry => entry.id === presetId);
  if (!preset) {
    toast('Stile non trovato');
    return false;
  }

  if (currentCustomLevel) {
    currentCustomLevel.baseLevel = preset.baseLevel;
    currentCustomLevel.characterId = preset.characterId;
    currentCustomLevel.themeOverrides = sanitizeThemeOverrides(preset.themeOverrides);
    currentCustomLevel.levelHints = sanitizeLevelHints(preset.levelHints);
    syncCurrentEditorLevelToSessionCache();
  } else if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) {
    tutorialSceneLevelId = preset.baseLevel;
    pendingNewLevelCharacterId = preset.characterId;
    pendingNewLevelThemeOverrides = sanitizeThemeOverrides(preset.themeOverrides);
    pendingNewLevelHints = sanitizeLevelHints(preset.levelHints);
  } else {
    const selectedLevel = findCustomLevel(selectedEditorLevelId || '');
    if (!selectedLevel) {
      toast('Seleziona prima un livello');
      return false;
    }
    const draft = collectCurrentEditorLevel();
    currentCustomLevel = normalizeCustomLevel({
      ...selectedLevel,
      ...draft,
      id: selectedLevel.id,
      number: selectedLevel.number,
      campaignIndex: selectedLevel.campaignIndex ?? selectedLevel.baseStepIndex ?? null,
      baseStepIndex: selectedLevel.baseStepIndex,
      name: selectedLevel.name,
      baseLevel: preset.baseLevel,
      characterId: preset.characterId,
      themeOverrides: sanitizeThemeOverrides(preset.themeOverrides),
      levelHints: sanitizeLevelHints(preset.levelHints)
    });
    syncCurrentEditorLevelToSessionCache();
  }

  applyLevelSceneVars();
  applyEditorBoardChanges();
  renderThemeEditorPanel();
  renderCustomLevels();
  toast(`Stile "${preset.name}" applicato`);
  return true;
}

function saveCurrentStylePreset() {
  if (!LEVEL_EDITOR_ENABLED || !editorMode) return;
  const input = document.getElementById('stylePresetNameInput');
  const presetName = sanitizeStylePresetName(input?.value || '');
  if (!presetName) {
    toast('Dai un nome allo stile');
    input?.focus();
    return;
  }
  const nextPreset = buildCurrentEditorStylePreset(presetName);
  if (!nextPreset) {
    toast('Impossibile salvare questo stile');
    return;
  }
  const existingIndex = stylePresets.findIndex(entry => entry.name.toLowerCase() === presetName.toLowerCase());
  const nextList = [...stylePresets];
  if (existingIndex >= 0) {
    nextPreset.id = stylePresets[existingIndex].id;
    nextList[existingIndex] = nextPreset;
  } else {
    nextList.unshift(nextPreset);
  }
  writeStylePresets(nextList);
  if (input) input.value = '';
  renderStylePresetPanel();
  toast(existingIndex >= 0 ? 'Stile aggiornato' : 'Stile salvato');
}

function deleteStylePreset(presetId) {
  const preset = stylePresets.find(entry => entry.id === presetId);
  if (!preset) return;
  writeStylePresets(stylePresets.filter(entry => entry.id !== presetId));
  renderStylePresetPanel();
  toast(`Stile "${preset.name}" rimosso`);
}

function renderStylePresetPanel() {
  const panel = document.getElementById('stylePresetPanel');
  const list = document.getElementById('stylePresetList');
  if (!panel || !list) return;
  if (!editorMode || !editorStylePanelOpen) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = '';
  if (!stylePresets.length) {
    const empty = document.createElement('div');
    empty.className = 'style-preset-empty';
    empty.textContent = 'Salva uno stile qui e lo potrai riutilizzare su altri livelli.';
    list.appendChild(empty);
    return;
  }

  stylePresets.forEach(preset => {
    const item = document.createElement('div');
    item.className = 'style-preset-item';
    item.innerHTML = `
      <div class="style-preset-copy">
        <span class="style-preset-name">${preset.name}</span>
        <span class="style-preset-meta">${getThemeLabel(preset.baseLevel)} · ${getCharacterLabel(preset.characterId)}</span>
      </div>
    `;

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'style-preset-apply';
    applyBtn.textContent = 'Applica';
    applyBtn.addEventListener('click', () => applyStylePresetToCurrentEditor(preset.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'style-preset-delete';
    deleteBtn.textContent = 'Elimina';
    deleteBtn.addEventListener('click', () => deleteStylePreset(preset.id));

    item.appendChild(applyBtn);
    item.appendChild(deleteBtn);
    list.appendChild(item);
  });
}

async function applyCurrentStyleToSelectedLevel() {
  if (!LEVEL_EDITOR_ENABLED || !editorMode) return;
  const levelId = selectedEditorLevelId || currentCustomLevel?.id || null;
  if (!levelId || levelId === NEW_EDITOR_LEVEL_ID) {
    toast('Seleziona prima un livello salvato');
    return;
  }
  const levels = readCustomLevels();
  const idx = levels.findIndex(level => level.id === levelId);
  if (idx === -1) {
    toast('Livello non trovato');
    return;
  }
  const current = normalizeCustomLevel(levels[idx]);
  const updated = normalizeCustomLevel({
    ...current,
    baseLevel: getCurrentEditorThemeId(),
    characterId: getCurrentEditorCharacterId(),
    themeOverrides: getCurrentEditorThemeOverrides(),
    levelHints: getCurrentEditorLevelHints()
  });
  levels[idx] = updated;
  const persistResult = await persistEditorLevels(levels, { promptIfMissing: true });

  if (currentCustomLevel && currentCustomLevel.id === updated.id) {
    currentCustomLevel = cloneCustomLevel({
      ...currentCustomLevel,
      baseLevel: updated.baseLevel,
      characterId: updated.characterId,
      themeOverrides: updated.themeOverrides,
      levelHints: updated.levelHints
    });
    applyLevelSceneVars();
    applyEditorBoardChanges();
  } else {
    applyLevelSceneVars();
  }
  renderCustomLevels();
  renderThemeEditorPanel();
  toast(describePersistResult({
    projectMessage: 'Stile applicato e salvato nel progetto',
    browserMessage: 'Stile applicato e salvato nel browser',
    sessionMessage: 'Stile applicato solo in questa sessione'
  }, persistResult));
}

function resolveThemeLevelId(themeId) {
  const raw = (typeof themeId === 'string' ? themeId : '').trim();
  if (raw && LEVELS[raw]) return raw;
  if (LEVELS[CUSTOM_LEVEL_THEME]) return CUSTOM_LEVEL_THEME;
  return LEVELS.level1 ? 'level1' : Object.keys(LEVELS)[0];
}

function getThemeLabel(themeId) {
  const level = LEVELS[resolveThemeLevelId(themeId)];
  return level?.themeLabel || level?.name || 'Tema';
}

function getEditorThemeOptions() {
  const options = Object.values(LEVELS || {})
    .filter(level => level && level.themeSelectable)
    .map(level => ({
      id: level.id,
      label: level.themeLabel || level.name || level.id,
      hint: level.themeHint || ''
    }));
  if (options.length) return options;
  const fallbackId = resolveThemeLevelId(CUSTOM_LEVEL_THEME);
  return [{
    id: fallbackId,
    label: getThemeLabel(fallbackId),
    hint: ''
  }];
}

function getCurrentEditorThemeId() {
  if (currentCustomLevel?.baseLevel) return resolveThemeLevelId(currentCustomLevel.baseLevel);
  if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) return resolveThemeLevelId(tutorialSceneLevelId);
  if (editorMode && currentLevel === 'level1') return resolveThemeLevelId(tutorialSceneLevelId);
  return resolveThemeLevelId(CUSTOM_LEVEL_THEME);
}

function getActiveCharacterId() {
  if (currentCustomLevel?.characterId) return resolveCharacterId(currentCustomLevel.characterId);
  if (currentLevel === 'level1') {
    if (LEVEL_EDITOR_ENABLED) {
      const campaignLevel = findCustomLevel(getCampaignLevelIdForIndex(tutorialStepIndex));
      if (campaignLevel?.characterId) return resolveCharacterId(campaignLevel.characterId);
    }
    const campaignLevel = getCurrentCampaignLevel();
    if (campaignLevel?.characterId) return resolveCharacterId(campaignLevel.characterId);
  }
  const level = getLevel();
  return resolveCharacterId(level?.characterId);
}

function getCurrentEditorCharacterId() {
  if (currentCustomLevel?.characterId) return resolveCharacterId(currentCustomLevel.characterId);
  if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) return resolveCharacterId(pendingNewLevelCharacterId);
  const selectedLevel = findCustomLevel(selectedEditorLevelId || '');
  if (selectedLevel?.characterId) return resolveCharacterId(selectedLevel.characterId);
  return getActiveCharacterId();
}

function setCurrentEditorCharacterId(characterId) {
  const resolved = resolveCharacterId(characterId);
  if (currentCustomLevel) {
    currentCustomLevel.characterId = resolved;
    syncCurrentEditorLevelToSessionCache();
    return true;
  }
  if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) {
    pendingNewLevelCharacterId = resolved;
    return true;
  }
  const selectedLevel = findCustomLevel(selectedEditorLevelId || '');
  if (!selectedLevel) return false;
  const draft = collectCurrentEditorLevel();
  currentCustomLevel = normalizeCustomLevel({
    ...selectedLevel,
    ...draft,
    id: selectedLevel.id,
    number: selectedLevel.number,
    campaignIndex: selectedLevel.campaignIndex ?? selectedLevel.baseStepIndex ?? null,
    baseStepIndex: selectedLevel.baseStepIndex,
    name: selectedLevel.name,
    characterId: resolved
  });
  syncCurrentEditorLevelToSessionCache();
  return true;
}

function buildThemePreviewSVG(themeId) {
  const resolvedId = resolveThemeLevelId(themeId);
  if (resolvedId === 'level-city') {
    return `<svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true">
      <defs>
        <linearGradient id="themeCityBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d9e8f6"/>
          <stop offset="100%" stop-color="#bdd2e5"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="48" height="48" fill="url(#themeCityBg)"/>
      <rect x="0" y="20" width="48" height="10" fill="#5f748d" opacity="0.52"/>
      <rect x="20" y="0" width="8" height="48" fill="#526882" opacity="0.46"/>
      <rect x="4" y="7" width="7" height="13" rx="1.8" fill="#7f99b2"/>
      <rect x="13" y="4" width="8" height="16" rx="1.8" fill="#90a9c1"/>
      <rect x="28" y="6" width="8" height="14" rx="1.8" fill="#7f99b2"/>
      <rect x="38" y="3" width="7" height="17" rx="1.8" fill="#90a9c1"/>
      <circle cx="37" cy="13" r="2.2" fill="#fff2b8" opacity="0.82"/>
      <circle cx="11" cy="35" r="2" fill="#d8f2ff" opacity="0.72"/>
    </svg>`;
  }
  if (resolvedId === 'level-universe') {
    return `<svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true">
      <defs>
        <radialGradient id="themeSpaceBg" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stop-color="#3d3378"/>
          <stop offset="100%" stop-color="#1a1636"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="48" height="48" fill="url(#themeSpaceBg)"/>
      <circle cx="35" cy="11" r="6" fill="#89cfff"/>
      <circle cx="35" cy="11" r="3.6" fill="#dff3ff" opacity="0.7"/>
      <circle cx="10" cy="8" r="1.2" fill="#f9f4ff"/>
      <circle cx="14" cy="18" r="1.1" fill="#bbf0ff"/>
      <circle cx="27" cy="22" r="1" fill="#fff1ff"/>
      <circle cx="41" cy="31" r="1" fill="#c8b5ff"/>
      <circle cx="8" cy="34" r="1.1" fill="#c4f7ff"/>
      <ellipse cx="18" cy="33" rx="9" ry="3.4" fill="none" stroke="#a794ff" stroke-width="1.4" opacity="0.52"/>
    </svg>`;
  }
  if (resolvedId === 'level-thomas') {
    return `<svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true">
      <rect x="0" y="0" width="48" height="48" fill="#f5f2e7"/>
      <rect x="6" y="6" width="36" height="36" fill="#ecf0e3" stroke="#e2dbc8" stroke-width="1"/>
      <rect x="10" y="10" width="10" height="10" fill="#a9c8b9" stroke="#f1f4ec" stroke-width="1"/>
      <rect x="21" y="10" width="10" height="10" fill="#a2c2b4" stroke="#f1f4ec" stroke-width="1"/>
      <rect x="32" y="10" width="10" height="10" fill="#a9c8b9" stroke="#f1f4ec" stroke-width="1"/>
      <rect x="10" y="21" width="10" height="10" fill="#a2c2b4" stroke="#f1f4ec" stroke-width="1"/>
      <rect x="21" y="21" width="10" height="10" fill="#a9c8b9" stroke="#f1f4ec" stroke-width="1"/>
      <rect x="32" y="21" width="10" height="10" fill="#a2c2b4" stroke="#f1f4ec" stroke-width="1"/>
      <rect x="21" y="33" width="10" height="6" fill="#62c66f"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true">
    <defs>
      <linearGradient id="themeGrassBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d7efb7"/>
        <stop offset="100%" stop-color="#b4d983"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="48" height="48" fill="url(#themeGrassBg)"/>
    <rect x="6" y="6" width="36" height="36" rx="5" fill="#cce7a1" stroke="#95bc63" stroke-width="1.2"/>
    <circle cx="14" cy="32" r="3.1" fill="#74c560" opacity="0.65"/>
    <circle cx="24" cy="17" r="2.1" fill="#fff0a5" opacity="0.82"/>
    <circle cx="33" cy="26" r="2.6" fill="#a0dc80" opacity="0.72"/>
  </svg>`;
}

function applyEditorTheme(themeId) {
  if (!editorMode) return;
  const resolved = resolveThemeLevelId(themeId);
  let changed = false;
  if (currentCustomLevel) {
    if (currentCustomLevel.baseLevel !== resolved) {
      currentCustomLevel.baseLevel = resolved;
      changed = true;
    }
  } else if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) {
    if (tutorialSceneLevelId !== resolved) {
      tutorialSceneLevelId = resolved;
      changed = true;
    }
  } else {
    const selectedLevel = findCustomLevel(selectedEditorLevelId || '');
    if (selectedLevel) {
      const draft = collectCurrentEditorLevel();
      currentCustomLevel = normalizeCustomLevel({
        ...selectedLevel,
        ...draft,
        id: selectedLevel.id,
        number: selectedLevel.number,
        campaignIndex: selectedLevel.campaignIndex ?? selectedLevel.baseStepIndex ?? null,
        baseStepIndex: selectedLevel.baseStepIndex,
        name: selectedLevel.name,
        baseLevel: resolved
      });
      changed = true;
    }
  }
  if (!changed) return;
  syncCurrentEditorLevelToSessionCache();
  applyLevelSceneVars();
  applyEditorBoardChanges();
  renderThemeEditorPanel();
  renderCustomLevels();
}

function getThemeThumbnailPalette(themeId) {
  const resolved = resolveThemeLevelId(themeId);
  return LEVELS[resolved]?.thumbnailPalette || {};
}

function buildCustomLevelThumbnail(level) {
  const size = 96;
  const cell = size / COLS;
  const palette = getThemeThumbnailPalette(level.baseLevel);
  const overrides = sanitizeThemeOverrides(level.themeOverrides || {});
  const sceneFill = parseColorToHex(overrides['--scene-grid-wrap-bg']) || palette.scene || '#edf7d9';
  const cellA = parseColorToHex(overrides['--cell-bg']) || palette.cellA || '#d8efb6';
  const cellB = parseColorToHex(overrides['--cell-bg']) || palette.cellB || '#cae69f';
  const cellStroke = parseColorToHex(overrides['--cell-edge']) || palette.cellStroke || '#9dc56b';
  const obstacleFill = parseColorToHex(overrides['--obstacle-bg-top']) || palette.obstacleFill || '#cdb38c';
  const obstacleStroke = parseColorToHex(overrides['--obstacle-edge']) || palette.obstacleStroke || '#9d7b51';
  const goalFill = palette.goalFill || '#7fd765';
  const goalStroke = palette.goalStroke || '#3f8c33';
  const startFill = palette.startFill || '#fff7ef';
  const startStroke = palette.startStroke || '#5aa24e';
  const blocked = new Set((level.obstacles || []).map(o => `${o.x},${o.y}`));
  const cells = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const key = `${x},${y}`;
      const fill = blocked.has(key)
        ? obstacleFill
        : ((x + y) % 2 === 0 ? cellA : cellB);
      const stroke = blocked.has(key) ? obstacleStroke : cellStroke;
      cells.push(`<rect x="${x * cell}" y="${y * cell}" width="${cell - 1}" height="${cell - 1}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="0.8"/>`);
    }
  }

  const goalX = level.goal?.x * cell + cell / 2;
  const goalY = level.goal?.y * cell + cell / 2;
  const startX = level.start?.x * cell + cell / 2;
  const startY = level.start?.y * cell + cell / 2;
  const goalPreviewClipId = `goal-preview-${String(level.id || level.name || 'custom').toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}`;
  const goalMarkup = level.goal
    ? (
      window.BOKS_GOAL_CHARACTER?.previewSvgMarkup?.({
        x: goalX,
        y: goalY,
        size: cell * 0.58,
        clipId: goalPreviewClipId,
        rim: '#b55f72',
        glow: 'rgba(197, 96, 120, 0.18)',
        panelFill: '#ffe7ee'
      }) || `<circle cx="${goalX}" cy="${goalY}" r="${cell * 0.24}" fill="${goalFill}" stroke="${goalStroke}" stroke-width="2"/>`
    )
    : '';
  const startMarkup = level.start
    ? `
      <circle cx="${startX}" cy="${startY}" r="${cell * 0.22}" fill="${startFill}" stroke="${startStroke}" stroke-width="2.2"/>
      <circle cx="${startX - cell * 0.06}" cy="${startY - cell * 0.03}" r="${cell * 0.04}" fill="#2f2d2b"/>
      <circle cx="${startX + cell * 0.06}" cy="${startY - cell * 0.03}" r="${cell * 0.04}" fill="#2f2d2b"/>
      <path d="M ${startX - cell * 0.07} ${startY + cell * 0.07} Q ${startX} ${startY + cell * 0.13} ${startX + cell * 0.07} ${startY + cell * 0.07}" fill="none" stroke="#2f2d2b" stroke-width="1.4" stroke-linecap="round"/>
    `
    : '';

  return `
    <svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" aria-hidden="true">
      <rect x="0" y="0" width="${size}" height="${size}" rx="12" fill="${sceneFill}"/>
      ${cells.join('')}
      ${goalMarkup}
      ${startMarkup}
    </svg>
  `;
}

const levelStorage = window.BOKS_LEVEL_STORAGE({
  cols: COLS,
  customIcons: CUSTOM_ICONS,
  customLevelTheme: CUSTOM_LEVEL_THEME,
  editorLevelsFileHandleKey: EDITOR_LEVELS_FILE_HANDLE_KEY,
  editorLevelsFilePath: EDITOR_LEVELS_FILE_PATH,
  editorLevelsStorageKey: EDITOR_LEVELS_STORAGE_KEY,
  projectLevelsCacheKey: PROJECT_LEVELS_CACHE_KEY,
  editorLevelsSuggestedName: EDITOR_LEVELS_FILE_PICKER_SUGGESTED_NAME,
  fileHandleDbName: FILE_HANDLE_DB_NAME,
  fileHandleStoreName: FILE_HANDLE_STORE_NAME,
  fnSlots: FSLOTS,
  getTutorialStepIndex: () => tutorialStepIndex,
  // Keep campaign levels aligned between main and live by treating the
  // project file as the canonical source in gameplay/editor boot.
  preferProjectLevelsFile: true,
  rows: ROWS,
  resolveCharacterId,
  resolveDecorationAssetId,
  slots: SLOTS
});

function readCustomLevels() {
  return levelStorage.readCustomLevels();
}

function writeCustomLevels(levels) {
  return levelStorage.writeCustomLevels(levels);
}

function updateCachedLevel(level) {
  return levelStorage.updateCachedLevel(level);
}

function exportableLevelsPayload(levels = readCustomLevels()) {
  return levelStorage.exportableLevelsPayload(levels);
}

function normalizeSlotArray(source = [], length) {
  return levelStorage.normalizeSlotArray(source, length);
}

function normalizeEnabledBlocks(source = {}) {
  return levelStorage.normalizeEnabledBlocks(source);
}

function normalizeThemeOverrides(source = {}) {
  return levelStorage.normalizeThemeOverrides(source);
}

function normalizeLevelDecorations(source = []) {
  return levelStorage.normalizeDecorations(source).filter(entry => !!getDecorationAssetDef(entry.asset));
}

function normalizeCustomLevel(level) {
  return levelStorage.normalizeCustomLevel(level);
}

function syncCurrentEditorLevelToSessionCache() {
  if (!LEVEL_EDITOR_ENABLED || !currentCustomLevel?.id) return null;
  if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) return null;
  const savedLevel = findCustomLevel(currentCustomLevel.id) || currentCustomLevel;
  const draft = collectCurrentEditorLevel();
  const merged = normalizeCustomLevel({
    ...savedLevel,
    ...draft,
    id: savedLevel.id,
    number: savedLevel.number,
    campaignIndex: savedLevel.campaignIndex ?? savedLevel.baseStepIndex ?? null,
    baseStepIndex: savedLevel.baseStepIndex,
    name: savedLevel.name
  });
  updateCachedLevel(merged);
  currentCustomLevel = cloneCustomLevel(merged);
  return merged;
}

function findCustomLevel(levelId) {
  return levelStorage.findCustomLevel(levelId);
}

function getEditorLevelIdForTutorialStep(idx = tutorialStepIndex) {
  return levelStorage.getEditorLevelIdForTutorialStep(idx);
}

function getCampaignLevelIdForIndex(idx = tutorialStepIndex) {
  return levelStorage.getEditorLevelIdForTutorialStep(idx);
}

function editorLevelToTutorialStep(level) {
  return levelStorage.editorLevelToTutorialStep(level);
}

function editorLevelToCampaignLevel(level) {
  return levelStorage.editorLevelToTutorialStep(level);
}

function buildInitialEditorLevels() {
  return levelStorage.buildInitialEditorLevels();
}

async function loadEditorLevelsSource() {
  return levelStorage.loadEditorLevelsSource();
}

async function persistEditorLevels(levels, { promptIfMissing = false } = {}) {
  return levelStorage.persistEditorLevels(levels, { promptIfMissing });
}

function describePersistResult({
  projectMessage = 'Salvato nel progetto',
  browserMessage = 'Salvato nel browser',
  sessionMessage = 'Salvato solo in questa sessione'
} = {}, persistResult = {}) {
  if (persistResult?.projectFileSaved) return projectMessage;
  if (persistResult?.browserDraftSaved) return browserMessage;
  return sessionMessage;
}

function syncEditorStateAfterLevelsChange(levels, { preferredLevelId = null } = {}) {
  const normalizedLevels = levels.map(normalizeCustomLevel);
  const nextSelectedId = preferredLevelId || selectedEditorLevelId;
  const selectedLevel = normalizedLevels.find(level => level.id === nextSelectedId) || normalizedLevels[0] || null;

  if (selectedLevel) {
    selectedEditorLevelId = selectedLevel.id;
  } else {
    selectedEditorLevelId = null;
  }

  if (editorMode) {
    if (currentCustomLevel) {
      const currentId = currentCustomLevel.id;
      const refreshed = normalizedLevels.find(level => level.id === currentId);
      if (refreshed) applyCustomLevel(refreshed, { openEditor: true });
      else if (selectedLevel) applyCustomLevel(selectedLevel, { openEditor: true });
      else startBlankEditorLevel();
      renderCustomLevels();
      return;
    }
    if (currentLevel === 'level1') {
      applyCampaignLevel(tutorialStepIndex);
      renderCustomLevels();
      return;
    }
    if (selectedLevel) {
      applyCustomLevel(selectedLevel, { openEditor: true });
      renderCustomLevels();
      return;
    }
  }

  if (!editorMode && currentCustomLevel) {
    const refreshed = normalizedLevels.find(level => level.id === currentCustomLevel.id);
    if (refreshed) {
      applyCustomLevel(refreshed, { openEditor: false });
      renderCustomLevels();
      return;
    }
    currentCustomLevel = null;
    currentLevel = 'level1';
    applyCampaignLevel(tutorialStepIndex);
    renderCustomLevels();
    return;
  }

  updateDebugBadge();
  renderCustomLevels();
}

function exportEditorLevels() {
  const payload = exportableLevelsPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `boks-levels-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  toast('Livelli esportati in JSON');
}

async function importEditorLevelsFromText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_err) {
    toast('File JSON non valido');
    return false;
  }

  const rawLevels = Array.isArray(parsed) ? parsed : parsed?.levels;
  if (!Array.isArray(rawLevels) || !rawLevels.length) {
    toast('Nessun livello trovato nel file');
    return false;
  }

  const normalizedLevels = rawLevels.map(normalizeCustomLevel);
  const persistResult = await persistEditorLevels(normalizedLevels, { promptIfMissing: true });
  syncEditorStateAfterLevelsChange(normalizedLevels, {
    preferredLevelId: normalizedLevels[0]?.id || null
  });
  toast(describePersistResult({
    projectMessage: `Importati ${normalizedLevels.length} livelli nel progetto`,
    browserMessage: `Importati ${normalizedLevels.length} livelli nel browser`,
    sessionMessage: `Importati ${normalizedLevels.length} livelli solo in questa sessione`
  }, persistResult));
  return true;
}

function openImportLevelsPicker() {
  const input = document.getElementById('importLevelsInput');
  if (!input) return;
  input.value = '';
  input.click();
}

async function resetEditorLevels() {
  if (!window.confirm('Ripristinare i livelli originali? I livelli salvati in questo browser verranno sostituiti.')) {
    return;
  }
  const seeded = buildInitialEditorLevels();
  const persistResult = await persistEditorLevels(seeded, { promptIfMissing: true });
  currentCustomLevel = null;
  currentLevel = 'level1';
  tutorialStepIndex = 0;
  syncEditorStateAfterLevelsChange(seeded, {
    preferredLevelId: getCampaignLevelIdForIndex(0)
  });
  toast(describePersistResult({
    projectMessage: 'Livelli originali ripristinati nel progetto',
    browserMessage: 'Livelli originali ripristinati nel browser',
    sessionMessage: 'Livelli originali ripristinati solo in questa sessione'
  }, persistResult));
}

// ═══ PROCEDURAL BACKGROUND ═══

// ═══ LEVELS / THEMES ═══
const LEVEL_STORAGE_KEY = 'boks-current-level';
const LEVELS = window.BOKS_LEVELS || {};
let currentLevel = localStorage.getItem(LEVEL_STORAGE_KEY) || 'level1';
if (!LEVELS[currentLevel]) currentLevel = LEVELS.level1 ? 'level1' : Object.keys(LEVELS)[0];
tutorialSceneLevelId = resolveThemeLevelId(currentLevel === 'level1' ? CUSTOM_LEVEL_THEME : currentLevel);

function getLevel() {
  if (currentCustomLevel) {
    return LEVELS[resolveThemeLevelId(currentCustomLevel.baseLevel)] || LEVELS.level1 || null;
  }
  if (currentLevel === 'level1' && LEVELS[tutorialSceneLevelId]) {
    return LEVELS[tutorialSceneLevelId];
  }
  return LEVELS[currentLevel] || LEVELS.level1 || null;
}
function applyLevelSceneVars() {
  const lv = getLevel();
  if (!lv) return;
  const isThomas = lv.id === 'level-thomas';
  document.body?.classList.toggle('theme-thomas', isThomas);
  document.body?.setAttribute('data-active-theme', lv.id || '');
  const baseVars = { ...(lv.sceneVars || {}) };
  let activeOverrides = {};
  if (editorMode && selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) {
    activeOverrides = sanitizeThemeOverrides(pendingNewLevelThemeOverrides || {});
  } else if (currentCustomLevel) {
    activeOverrides = sanitizeThemeOverrides(currentCustomLevel.themeOverrides || {});
  } else if (currentLevel === 'level1') {
    const campaignLevel = findCustomLevel(getCampaignLevelIdForIndex(tutorialStepIndex));
    activeOverrides = sanitizeThemeOverrides(campaignLevel?.themeOverrides || {});
  }
  Object.entries(activeOverrides).forEach(([key, value]) => {
    if (EDITOR_THEME_COLOR_KEYS.has(key)) baseVars[key] = value;
  });
  const lockedVars = getCampaignLockedSceneVars();
  Object.entries(lockedVars).forEach(([key, value]) => {
    baseVars[key] = value;
  });
  Object.entries(baseVars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
}
function setLevel(levelId, { persist = true } = {}) {
  if (!LEVELS[levelId]) return false;
  if (levelId !== 'level1') {
    firstLevelOnboardingStage = 'idle';
    clearFirstLevelOnboardingDelay();
    clearAppSceneRevealWindow();
  }
  currentCustomLevel = null;
  currentLevel = levelId;
  tutorialSceneLevelId = resolveThemeLevelId(levelId === 'level1' ? CUSTOM_LEVEL_THEME : levelId);
  applyLevelSceneVars();
  if (persist) localStorage.setItem(LEVEL_STORAGE_KEY, levelId);
  updateDebugBadge();
  return true;
}
function ensureDebugBadge() {
  let badge = document.getElementById('debugBadge');
  if (badge) return badge;
  badge = document.createElement('div');
  badge.id = 'debugBadge';
  document.body.appendChild(badge);
  return badge;
}

function ensureAnimationDebugBadge() {
  let badge = document.getElementById('animationDebugBadge');
  if (badge) return badge;
  badge = document.createElement('div');
  badge.id = 'animationDebugBadge';
  document.body.appendChild(badge);
  return badge;
}

function trimBuildQuery(src = '') {
  const clean = String(src || '').trim();
  if (!clean) return '';
  return clean.split('?')[0];
}

function compactAssetLabel(src = '') {
  const clean = trimBuildQuery(src);
  if (!clean) return '-';
  const parts = clean.split('/');
  if (parts.length <= 3) return clean;
  return `${parts[parts.length - 3]}/${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}

function readCurrentAnimationState() {
  const sprite = document.getElementById('sprite');
  const hero = sprite?.querySelector('.boks-hero');
  const visualDirection = sprite?.dataset?.visualOrientation || ori;
  if (!hero) {
    return {
      visible: false,
      character: resolveRuntimeCharacterId(getActiveCharacterId()),
      requested: '-',
      resolved: '-',
      action: characterAction,
      direction: ori,
      visualDirection,
      mode: 'none',
      loop: '-',
      mounted: '-',
      asset: '-'
    };
  }

  const wrap = hero.querySelector('.boks-hero__lottie-wrap');
  const img = hero.querySelector('.boks-hero__img:not(.boks-hero__img--fallback)');
  const lottieSrc = wrap?.dataset?.lottieSrc || '';
  const imageSrc = img?.getAttribute?.('src') || '';
  const mode = wrap ? 'lottie' : (img ? 'image' : 'none');
  const loopRaw = wrap?.dataset?.lottieLoop;
  const loop = typeof loopRaw === 'string' ? (loopRaw === 'true' ? 'yes' : 'no') : '-';
  const mounted = wrap?.dataset?.lottieMounted === 'true' ? 'yes' : (wrap ? 'no' : '-');
  const ready = wrap?.dataset?.lottieReady === 'true' || wrap?.classList?.contains('is-ready') ? 'yes' : (wrap ? 'no' : '-');

  return {
    visible: true,
    character: hero.dataset.character || resolveRuntimeCharacterId(getActiveCharacterId()),
    requested: hero.dataset.state || '-',
    resolved: hero.dataset.resolvedState || '-',
    action: hero.dataset.action || characterAction,
    direction: hero.dataset.direction || ori,
    visualDirection,
    mode,
    loop,
    mounted,
    ready,
    asset: compactAssetLabel(lottieSrc || imageSrc),
    fallback: hero.dataset.fallback === 'true' ? 'yes' : 'no'
  };
}

function updateAnimationDebugBadge(extra = '') {
  if (!animationDebugVisible) return;
  const badge = ensureAnimationDebugBadge();
  const info = readCurrentAnimationState();
  const lines = [
    `Anim now  : ${info.resolved}`,
    `Requested : ${info.requested}`,
    `Char/pose : ${info.character} | ${info.action}:${info.direction} | visual:${info.visualDirection}`,
    `Mode      : ${info.mode} | loop:${info.loop} | mounted:${info.mounted} | ready:${info.ready ?? '-'} | fallback:${info.fallback ?? '-'}`,
    `Asset     : ${info.asset}`
  ];
  if (extra) lines.push(`Note      : ${extra}`);
  badge.textContent = lines.join('\n');
}

function updateRunAvailability() {
  const btn = document.getElementById('runBtn');
  if (!btn) return;
  const locked = !!(editorMode && (!playerPlaced || !goalPlaced));
  btn.classList.toggle('editor-run-locked', locked);
  btn.disabled = locked;
  btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
  queueFirstLevelOnboardingSync();
}
function updateDebugBadge() {
  const badge = ensureDebugBadge();
  if (editorMode) {
    badge.textContent = `Editor | Program ${countEnabledMainSlots()}/${SLOTS} | Function ${countEnabledFnSlots()}/${FSLOTS} | Soluzioni possibili: ${lastEditorSolutionCount}`;
    return;
  }
  if (currentCustomLevel) {
    badge.textContent = `${currentCustomLevel.name} | Livello custom`;
    return;
  }
  const lv = getLevel();
  const campaignLevels = getCampaignLevels();
  if (campaignLevels.length) {
    badge.textContent = `${lv?.name || currentLevel} | Livello ${tutorialStepIndex + 1}/${campaignLevels.length}`;
    return;
  }
  badge.textContent = `${lv?.name || currentLevel} | Livello singolo`;
}

function setSlotMasks(mainCount = SLOTS, fnCount = FSLOTS) {
  mainSlotEnabled = Array.from({ length: SLOTS }, (_, i) => i < mainCount);
  fnSlotEnabled = Array.from({ length: FSLOTS }, (_, i) => i < fnCount);
}
function toggleDebugBadge() {
  if (!DEBUG_TOOLS_ENABLED) return;
  debugVisible = !debugVisible;
  document.body.classList.toggle('debug-visible', debugVisible);
  if (debugVisible) {
    updateDebugBadge();
  }
}

function toggleAnimationDebugBadge(force = null) {
  if (!DEBUG_TOOLS_ENABLED) {
    animationDebugVisible = false;
    document.body.classList.remove('animation-debug-visible');
    return;
  }
  const next = typeof force === 'boolean' ? force : !animationDebugVisible;
  animationDebugVisible = next;
  document.body.classList.toggle('animation-debug-visible', animationDebugVisible);
  if (animationDebugVisible) {
    updateAnimationDebugBadge();
  }
}
function debugStepJump(delta) {
  if (!DEBUG_TOOLS_ENABLED) return;
  if (running || animating) return;
  if (editorMode) return;
  if (currentLevel !== 'level1') return;
  const campaignLevels = getCampaignLevels();
  if (!campaignLevels.length) return;
  applyCampaignLevel(tutorialStepIndex + delta);
}

function cellKey(x, y) {
  return `${x},${y}`;
}
function isBlockedCell(x, y) {
  return blockedCells.has(cellKey(x, y));
}
function setBlockedCells(obstacles = []) {
  blockedCells = new Set(obstacles.map(o => cellKey(o.x, o.y)));
}
function resetPrograms() {
  for (let j = 0; j < SLOTS; j++) prog[j] = null;
  for (let j = 0; j < FSLOTS; j++) fnProg[j] = null;
  refreshAvailableBlockGlowState();
}
function setAvailableBlocks(blocks = ['forward', 'right', 'left']) {
  avail.length = 0;
  blocks.forEach((dir, i) => {
    if (!POOL[dir]) return;
    avail.push({ id: `${dir}${idN + i}`, ...POOL[dir] });
  });
  idN += blocks.length;
}
let editorSolver = null;
let levelEditor = null;
let editorSupportReady = false;
let editorSupportPromise = null;

function createEditorSolver() {
  if (!window.BOKS_EDITOR_SOLVER) return null;
  return window.BOKS_EDITOR_SOLVER({
    getMainSlotEnabled: () => mainSlotEnabled,
    getFnSlotEnabled: () => fnSlotEnabled,
    setActiveMainSlots: value => { activeMainSlots = value; },
    setActiveFnSlots: value => { activeFnSlots = value; },
    getAvail: () => avail,
    getBoardMeta: () => ({ cols: COLS, rows: ROWS }),
    isBlockedCell,
    getGoal: () => GOAL,
    getPlayer: () => ({ pos, ori })
  });
}

function createLevelEditor() {
  if (!window.BOKS_LEVEL_EDITOR) return null;
  return window.BOKS_LEVEL_EDITOR({
    isEditorMode: () => editorMode,
    setEditorModeFlag: value => { editorMode = value; },
    isBusy: () => running || animating,
    getEditorBlockEnabled: () => editorBlockEnabled,
    resetEditorBlockEnabled: () => {
      editorBlockEnabled = { forward: false, left: false, right: false, function: false };
    },
    getMainSlotEnabled: () => mainSlotEnabled,
    getFnSlotEnabled: () => fnSlotEnabled,
    getProg: () => prog,
    getFnProg: () => fnProg,
    getActiveMainSlots: () => activeMainSlots,
    getActiveFnSlots: () => activeFnSlots,
    setSlotMasks,
    setAvailableBlocks,
    resetPrograms,
    setFnUnlockHintActive: value => { fnUnlockHintActive = value; },
    setStepStartHintActive: value => { stepStartHintActive = value; },
    renderAvail: () => renderAvail(),
    renderBoard: () => renderBoard(),
    renderFn: () => renderFn(),
    refreshEditorValues: () => refreshEditorValues(),
    refreshEditorDebug: () => refreshEditorDebug(),
    updateDebugBadge,
    mkB,
    bindDrag,
    getPool: () => POOL,
    getAvail: () => avail,
    goalSVG,
    initGrid,
    drawBackground,
    syncSprite,
    isBlockedCell,
    hasGoal: () => goalPlaced,
    getPlayer: () => ({ pos, ori }),
    setGoal: value => { GOAL = value; }
  });
}

function getEditorSolver() {
  if (!editorSolver && window.BOKS_EDITOR_SOLVER) {
    editorSolver = createEditorSolver();
  }
  return editorSolver;
}

function getLevelEditor() {
  if (!levelEditor && window.BOKS_LEVEL_EDITOR) {
    levelEditor = createLevelEditor();
  }
  return levelEditor;
}

function prepareEditorUi() {
  if (!LEVEL_EDITOR_ENABLED) return;
  const initialLevels = readCustomLevels();
  if (!selectedEditorLevelId && initialLevels.length) selectedEditorLevelId = initialLevels[0].id;
  renderCustomLevels();
  renderElementPalette();
  renderIconPicker();
}

async function ensureEditorSupportLoaded() {
  if (!LEVEL_EDITOR_ENABLED) return false;
  if (editorSupportReady) return true;
  if (editorSupportPromise) return editorSupportPromise;
  const loader = window.BOKS_RUNTIME_CONFIG?.ensureEditorSupport;
  editorSupportPromise = (async () => {
    markPerfMetricStart('editor-support-ready');
    if (typeof loader === 'function') {
      await loader();
    }
    editorSolver = getEditorSolver();
    levelEditor = getLevelEditor();
    setupGoalDrag();
    setupEditorElementPlacement();
    prepareEditorUi();
    editorSupportReady = true;
    markPerfMetricEnd('editor-support-ready', { type: 'editor' });
    return true;
  })().finally(() => {
    editorSupportPromise = null;
  });
  return editorSupportPromise;
}
function countEnabledMainSlots() {
  const solver = getEditorSolver();
  return solver ? solver.countEnabledMainSlots() : activeMainSlots;
}

function countEnabledFnSlots() {
  const solver = getEditorSolver();
  return solver ? solver.countEnabledFnSlots() : activeFnSlots;
}

function refreshEditorValues() {
  const solver = getEditorSolver();
  if (!solver) return;
  solver.refreshEditorValues();
}

function countEditorSolutions() {
  if (!playerPlaced || !goalPlaced) return 0;
  const solver = getEditorSolver();
  return solver ? solver.countEditorSolutions() : 0;
}

function refreshEditorDebug() {
  if (!editorMode) return;
  refreshEditorValues();
  lastEditorSolutionCount = countEditorSolutions();
  updateDebugBadge();
  updateRunAvailability();
  renderElementPalette();
}

function syncEditorAvailableBlocks() {
  getLevelEditor()?.syncEditorAvailableBlocks();
}

function toggleEditorBlock(dir) {
  getLevelEditor()?.toggleEditorBlock(dir);
}

function setEditorMode(enabled) {
  if (!LEVEL_EDITOR_ENABLED && enabled) return;
  getLevelEditor()?.setEditorMode(enabled);
  if (enabled) {
    setEditorStylePanelOpen(editorStylePanelOpen);
    refreshEditorDebug();
  } else {
    refreshAvailableBlockGlowState();
    renderAvail();
    renderBoard();
    renderFn();
    setEditorStylePanelOpen(false);
    selectedElementTool = null;
    lastEditorSolutionCount = 0;
    updateRunAvailability();
    renderElementPalette();
  }
  syncFirstLevelOnboardingDelayForCurrentView();
  updateQuickEditorButton();
  queueFirstLevelOnboardingSync();
}

function toggleEditorSlot(zone, idx) {
  getLevelEditor()?.toggleEditorSlot(zone, idx);
}
function getTutorialSteps() {
  if (currentCustomLevel) return [];
  if (currentLevel === 'level1') {
    const projectCampaignLevels = readCustomLevels().map(editorLevelToCampaignLevel);
    if (projectCampaignLevels.length) {
      return projectCampaignLevels;
    }
    return [];
  }
  const lv = getLevel();
  return lv?.tutorialSteps || [];
}

function getCampaignLevels() {
  return getTutorialSteps();
}

function getCurrentCampaignLevel() {
  return getCurrentTutorialStep();
}

function applyCampaignLevel(idx = 0) {
  return applyTutorialStep(idx);
}
function getCurrentTutorialStep() {
  const steps = getTutorialSteps();
  if (!steps.length) return null;
  return steps[tutorialStepIndex] || null;
}
function isFunctionTutorialStep() {
  const step = getCurrentCampaignLevel();
  if (!step) return false;
  const blocks = step.availableBlocks || [];
  return (step.fnSlots || 0) > 0 && blocks.includes('function');
}
function shouldShowAvailableBlockGlow(level = currentCustomLevel || getCurrentCampaignLevel()) {
  return !!level?.levelHints?.availableBlockGlow;
}
function hasAnyPlacedProgramBlock() {
  return prog.some(Boolean) || fnProg.some(Boolean);
}
function syncAvailableBlockGlowUI() {
  const row = document.getElementById('blocksRow');
  if (!row || editorMode) return;
  row.classList.toggle('available-block-guided', !!stepStartHintActive);
  row.querySelectorAll('.ablock').forEach((blockEl, idx) => {
    const shouldGlow = !!stepStartHintActive;
    blockEl.classList.toggle('tutorial-focus', shouldGlow);
    blockEl.style.setProperty('--available-block-glow-delay', shouldGlow ? `${(idx % 6) * 0.42}s` : '0s');
  });
}
function refreshAvailableBlockGlowState({ suspendForActiveDrag = false } = {}) {
  if (editorMode) {
    stepStartHintActive = false;
    syncAvailableBlockGlowUI();
    queueFirstLevelOnboardingSync();
    return stepStartHintActive;
  }
  const draggingAvailableBlock = suspendForActiveDrag && dg?.active && dg.src === 'avail';
  stepStartHintActive = shouldShowAvailableBlockGlow() && !hasAnyPlacedProgramBlock() && !draggingAvailableBlock;
  syncAvailableBlockGlowUI();
  queueFirstLevelOnboardingSync();
  return stepStartHintActive;
}
function renderFirstLevelOnboardingHandSvg(idSuffix = 'main') {
  return `
    <svg viewBox="0 0 128 128" aria-hidden="true">
      <image
        href="assets/props/hand_drag.png"
        width="128"
        height="128"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  `;
}
function ensureFirstLevelOnboardingRoot() {
  const bottom = document.getElementById('bottom');
  if (!bottom) return null;
  let root = document.getElementById('firstLevelOnboarding');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'firstLevelOnboarding';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <svg class="first-level-onboarding__path" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path></path>
    </svg>
    <div class="first-level-onboarding__drag-demo">
      <div class="first-level-onboarding__ghost"></div>
      <div class="first-level-onboarding__hand first-level-onboarding__hand--drag">
        ${renderFirstLevelOnboardingHandSvg('drag')}
      </div>
    </div>
    <div class="first-level-onboarding__tap-demo">
      <span class="first-level-onboarding__tap-ring first-level-onboarding__tap-ring--a"></span>
      <span class="first-level-onboarding__tap-ring first-level-onboarding__tap-ring--b"></span>
      <div class="first-level-onboarding__hand first-level-onboarding__hand--tap">
        ${renderFirstLevelOnboardingHandSvg('tap')}
      </div>
    </div>
  `;
  bottom.appendChild(root);
  return root;
}
function clearFirstLevelOnboardingTargets() {
  document.querySelectorAll('.pslot.first-level-onboarding-slot')
    .forEach(slot => slot.classList.remove('first-level-onboarding-slot'));
  document.getElementById('runBtn')?.classList.remove('first-level-onboarding-run');
}
function clearFirstLevelOnboardingDelay() {
  if (firstLevelOnboardingDelayTimer) {
    clearTimeout(firstLevelOnboardingDelayTimer);
    firstLevelOnboardingDelayTimer = null;
  }
  firstLevelOnboardingReadyAt = 0;
}
function clearAppSceneRevealWindow() {
  if (appSceneRevealTimer) {
    clearTimeout(appSceneRevealTimer);
    appSceneRevealTimer = null;
  }
  appSceneRevealReadyAt = 0;
}
function startAppSceneRevealWindow(durationMs = 4200) {
  clearAppSceneRevealWindow();
  appSceneRevealReadyAt = Date.now() + durationMs;
  appSceneRevealTimer = setTimeout(() => {
    appSceneRevealTimer = null;
    queueFirstLevelOnboardingSync();
    syncFirstLevelOnboardingDelayForCurrentView();
  }, durationMs + 16);
}
function scheduleFirstLevelOnboardingDelay(delayMs = 0) {
  clearFirstLevelOnboardingDelay();
  firstLevelOnboardingReadyAt = Date.now() + delayMs;
  firstLevelOnboardingDelayTimer = setTimeout(() => {
    firstLevelOnboardingDelayTimer = null;
    queueFirstLevelOnboardingSync();
  }, delayMs + 16);
}
function syncFirstLevelOnboardingDelayForCurrentView() {
  if (editorMode || !isFirstLevelOnboardingContext()) {
    clearFirstLevelOnboardingDelay();
    return;
  }
  if (document.body.classList.contains('prestart')) {
    clearFirstLevelOnboardingDelay();
    return;
  }
  if (Date.now() < appSceneRevealReadyAt) {
    clearFirstLevelOnboardingDelay();
    return;
  }
  if (firstLevelOnboardingStage === 'play' || hasAnyPlacedProgramBlock()) {
    clearFirstLevelOnboardingDelay();
    return;
  }
  scheduleFirstLevelOnboardingDelay(0);
}
function isFirstLevelOnboardingContext() {
  return !currentCustomLevel && currentLevel === 'level1' && tutorialStepIndex === 0;
}
function shouldShowFirstLevelOnboarding() {
  return gameStarted
    && !document.body.classList.contains('prestart')
    && !editorMode
    && isFirstLevelOnboardingContext()
    && Date.now() >= appSceneRevealReadyAt
    && (
      firstLevelOnboardingStage === 'play'
      || hasAnyPlacedProgramBlock()
      || Date.now() >= firstLevelOnboardingReadyAt
    );
}
function advanceFirstLevelOnboardingToPlay() {
  if (editorMode || !isFirstLevelOnboardingContext()) return;
  clearFirstLevelOnboardingDelay();
  firstLevelOnboardingStage = 'play';
  queueFirstLevelOnboardingSync();
}
function completeFirstLevelOnboarding() {
  if (editorMode || !isFirstLevelOnboardingContext()) return;
  clearFirstLevelOnboardingDelay();
  firstLevelOnboardingStage = 'done';
  queueFirstLevelOnboardingSync();
}
function syncFirstLevelOnboarding() {
  firstLevelOnboardingFrame = null;
  const root = ensureFirstLevelOnboardingRoot();
  const bottom = document.getElementById('bottom');
  const pathSvg = root?.querySelector('.first-level-onboarding__path');
  const path = root?.querySelector('.first-level-onboarding__path path');
  const ghost = root?.querySelector('.first-level-onboarding__ghost');
  const dragDemo = root?.querySelector('.first-level-onboarding__drag-demo');
  const tapDemo = root?.querySelector('.first-level-onboarding__tap-demo');
  if (!root || !bottom || !pathSvg || !path || !ghost || !dragDemo || !tapDemo) return;

  clearFirstLevelOnboardingTargets();
  root.classList.remove('active');
  root.dataset.stage = 'hidden';
  path.setAttribute('d', '');

  if (!shouldShowFirstLevelOnboarding()) return;

  const bottomRect = bottom.getBoundingClientRect();
  pathSvg.setAttribute('viewBox', `0 0 ${Math.max(1, Math.round(bottomRect.width))} ${Math.max(1, Math.round(bottomRect.height))}`);
  const clampX = (value, inset = 40) => Math.max(inset, Math.min(bottomRect.width - inset, value));
  const stage = hasAnyPlacedProgramBlock() ? 'play' : 'drag';
  firstLevelOnboardingStage = stage;

  if (stage === 'drag') {
    const sourceBlock = document.querySelector('#blocksRow .ablock:not(.disabled)');
    const targetSlot = Array.from(document.querySelectorAll('.pslot[data-zone="main"]:not(.locked)'))
      .find(slot => !slot.classList.contains('filled'));
    if (!sourceBlock || !targetSlot) return;

    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetSlot.getBoundingClientRect();
    const sourceX = sourceRect.left - bottomRect.left + (sourceRect.width * 0.5);
    const sourceY = sourceRect.top - bottomRect.top + (sourceRect.height * 0.5);
    const targetX = targetRect.left - bottomRect.left + (targetRect.width * 0.5);
    const targetY = targetRect.top - bottomRect.top + (targetRect.height * 0.5);
    const controlX = clampX(Math.min(sourceX, targetX) - Math.max(22, Math.min(42, targetRect.width * 0.8)));
    const controlY = sourceY + ((targetY - sourceY) * 0.46);

    ghost.innerHTML = sourceBlock.innerHTML;
    ghost.style.width = `${Math.round(sourceRect.width)}px`;
    ghost.style.height = `${Math.round(sourceRect.height)}px`;
    targetSlot.classList.add('first-level-onboarding-slot');
    root.dataset.stage = 'drag';
    root.style.setProperty('--first-onboarding-start-x', `${sourceX}px`);
    root.style.setProperty('--first-onboarding-start-y', `${sourceY}px`);
    root.style.setProperty('--first-onboarding-end-x', `${targetX}px`);
    root.style.setProperty('--first-onboarding-end-y', `${targetY}px`);
    path.setAttribute('d', `M ${sourceX.toFixed(2)} ${sourceY.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${targetX.toFixed(2)} ${targetY.toFixed(2)}`);
    root.classList.add('active');
    return;
  }

  const runBtn = document.getElementById('runBtn');
  if (!runBtn) return;
  const btnRect = runBtn.getBoundingClientRect();
  const targetX = btnRect.left - bottomRect.left + (btnRect.width * 0.5);
  const targetY = btnRect.top - bottomRect.top + (btnRect.height * 0.5);

  runBtn.classList.add('first-level-onboarding-run');
  root.dataset.stage = 'play';
  root.style.setProperty('--first-onboarding-end-x', `${targetX}px`);
  root.style.setProperty('--first-onboarding-end-y', `${targetY}px`);
  root.classList.add('active');
}
function queueFirstLevelOnboardingSync() {
  if (firstLevelOnboardingFrame) return;
  firstLevelOnboardingFrame = requestAnimationFrame(() => syncFirstLevelOnboarding());
}
function resetPlayerToStepStart() {
  const step = getCurrentCampaignLevel();
  pos = { ...START };
  ori = currentCustomLevel?.startOri || step?.startOri || 'right';
  resetSpritePresentation();
  syncSprite();
}
function applyTutorialStep(idx = 0) {
  const perfLabel = `level-load:campaign:${idx}`;
  markPerfMetricStart(perfLabel);
  const steps = getTutorialSteps();
  if (!steps.length) return false;
  tutorialStepIndex = ((idx % steps.length) + steps.length) % steps.length;
  rememberCurrentCampaignStep(tutorialStepIndex);
  firstLevelOnboardingStage = tutorialStepIndex === 0 ? 'drag' : 'idle';
  clearFirstLevelOnboardingDelay();
  if (tutorialStepIndex !== 0) clearAppSceneRevealWindow();
  selectedEditorLevelId = getCampaignLevelIdForIndex(tutorialStepIndex);
  const step = steps[tutorialStepIndex];
  tutorialSceneLevelId = resolveThemeLevelId(step.baseLevel);
  applyLevelSceneVars();
  activeMainSlots = Math.max(0, Math.min(SLOTS, step.mainSlots ?? SLOTS));
  activeFnSlots = Math.max(0, Math.min(FSLOTS, step.fnSlots ?? 0));
  setSlotMasks(activeMainSlots, activeFnSlots);
  fnUnlockHintActive = false;
  stepStartHintActive = shouldShowAvailableBlockGlow(step);
  selectedElementTool = null;
  selectedDecorationBrush = null;
  const normalizedStart = normalizePoint(step.start);
  const normalizedGoal = normalizePoint(step.goal);
  playerPlaced = !!normalizedStart;
  goalPlaced = !!normalizedGoal;
  START = normalizedStart || { x: 2, y: 2 };
  GOAL = normalizedGoal || { x: 5, y: 5 };
  pos = { ...START };
  animating = false;
  ori = step.startOri || 'right';
  setBlockedCells(step.obstacles || []);
  activeLevelDecorations = normalizeLevelDecorations(step.decorations || []);
  setAvailableBlocks(step.availableBlocks || ['forward', 'right', 'left']);
  resetPrograms();
  initGrid();
  renderAvail();
  renderBoard();
  renderFn();
  drawBackground();
  const sprite = resetSpritePresentation();
  syncSprite();
  requestAnimationFrame(() => {
    sizeGrid();
    drawBackground();
    if (sprite) {
      sprite.getAnimations().forEach(a => a.cancel());
    }
    setCharacterAction('idle');
    syncSprite();
  });
  syncFirstLevelOnboardingDelayForCurrentView();
  updateDebugBadge();
  renderElementPalette();
  markPerfMetricEnd(perfLabel, { type: 'level', mode: 'campaign', levelIndex: tutorialStepIndex });
  startFpsProbe(`campaign-${tutorialStepIndex}`);
  return true;
}

function applyCustomLevel(level, { openEditor = false } = {}) {
  const perfLabel = `level-load:custom:${level?.id || 'unknown'}`;
  markPerfMetricStart(perfLabel);
  const normalized = normalizeCustomLevel(level);
  firstLevelOnboardingStage = 'idle';
  clearFirstLevelOnboardingDelay();
  clearAppSceneRevealWindow();
  currentCustomLevel = cloneCustomLevel(normalized);
  selectedEditorLevelId = normalized.id;
  currentLevel = 'custom';
  applyLevelSceneVars();

  playerPlaced = !!normalized.start;
  goalPlaced = !!normalized.goal;
  START = normalized.start ? { ...normalized.start } : { x: 2, y: 2 };
  GOAL = normalized.goal ? { ...normalized.goal } : { x: 5, y: 5 };
  pos = { ...START };
  ori = normalized.startOri || 'right';
  animating = false;
  running = false;
  tutorialStepIndex = 0;
  fnUnlockHintActive = false;
  stepStartHintActive = !!normalized.levelHints?.availableBlockGlow;
  selectedElementTool = null;
  selectedDecorationBrush = null;
  mainSlotEnabled = normalizeSlotArray(normalized.mainSlotEnabled, SLOTS);
  fnSlotEnabled = normalizeSlotArray(normalized.fnSlotEnabled, FSLOTS);
  editorBlockEnabled = normalizeEnabledBlocks(normalized.enabledBlocks);
  refreshEditorValues();
  setBlockedCells(normalized.obstacles || []);
  activeLevelDecorations = normalizeLevelDecorations(normalized.decorations || []);
  resetPrograms();
  setAvailableBlocks(Object.keys(editorBlockEnabled).filter(dir => editorBlockEnabled[dir]));
  editorMode = !!openEditor;
  if (!editorMode) {
    editorStylePanelOpen = false;
  }
  document.body.classList.toggle('editor-mode', editorMode);
  document.body.classList.toggle('editor-style-open', !!(editorMode && editorStylePanelOpen));
  updateStyleEditorButtons();
  initGrid();
  renderAvail();
  renderBoard();
  renderFn();
  drawBackground();
  resetSpritePresentation();
  syncSprite();
  if (editorMode) refreshEditorDebug();
  else {
    lastEditorSolutionCount = 0;
    updateRunAvailability();
  }
  updateDebugBadge();
  renderElementPalette();
  markPerfMetricEnd(perfLabel, {
    type: 'level',
    mode: openEditor ? 'editor' : 'custom',
    levelId: normalized.id
  });
  startFpsProbe(openEditor ? `editor-${normalized.id}` : `custom-${normalized.id}`);
}

function collectCurrentEditorLevel() {
  return normalizeCustomLevel({
    id: currentCustomLevel?.id || selectedEditorLevelId || `custom-${Date.now()}`,
    number: currentCustomLevel?.number ?? null,
    campaignIndex: currentCustomLevel?.campaignIndex ?? currentCustomLevel?.baseStepIndex ?? null,
    baseStepIndex: currentCustomLevel?.baseStepIndex ?? null,
    name: currentCustomLevel?.name || 'Livello custom',
    icon: currentCustomLevel?.icon || selectedSaveIcon,
    baseLevel: getCurrentEditorThemeId(),
    characterId: getCurrentEditorCharacterId(),
    start: playerPlaced ? { ...pos } : null,
    goal: goalPlaced ? { ...GOAL } : null,
    startOri: ori,
    obstacles: parseBlockedCellsToArray(),
    decorations: normalizeLevelDecorations(activeLevelDecorations),
    mainSlotEnabled: [...mainSlotEnabled],
    fnSlotEnabled: [...fnSlotEnabled],
    enabledBlocks: { ...editorBlockEnabled },
    themeOverrides: getCurrentEditorThemeOverrides(),
    levelHints: getCurrentEditorLevelHints()
  });
}

function updateStyleEditorButtons() {
  const openBtn = document.getElementById('openStyleEditorBtn');
  if (openBtn) {
    openBtn.textContent = editorStylePanelOpen ? 'Editor' : 'Stile';
    openBtn.setAttribute('aria-pressed', editorStylePanelOpen ? 'true' : 'false');
  }
}

function setEditorStylePanelOpen(open) {
  const next = !!(editorMode && open);
  editorStylePanelOpen = next;
  document.body.classList.toggle('editor-style-open', next);
  updateStyleEditorButtons();
  renderElementPalette();
  renderThemeEditorPanel();
}

function resolveStyleTargetLabel() {
  if (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID) return 'Nuovo livello';
  if (currentCustomLevel?.name) return currentCustomLevel.name;
  const level = findCustomLevel(selectedEditorLevelId || '');
  return level?.name || 'Livello selezionato';
}

function renderEditorSetupControls(palette) {
  if (!palette || !editorMode) return;

  const card = document.createElement('div');
  card.className = 'editor-setup-card';

  const orientationLabels = {
    up: 'Su',
    right: 'Destra',
    down: 'Giu',
    left: 'Sinistra'
  };

  const setupHint = document.createElement('div');
  setupHint.className = 'editor-setup-hint';
  setupHint.innerHTML = playerPlaced
    ? `BÖKS e pronto. Tocca una cella libera per spostarlo e scegli la direzione iniziale: <strong>${orientationLabels[ori] || 'Destra'}</strong>.`
    : 'Seleziona <strong>BÖKS</strong> qui sopra e tocca una cella libera della griglia.';
  card.appendChild(setupHint);

  const orientationTitle = document.createElement('div');
  orientationTitle.className = 'editor-setup-title';
  orientationTitle.textContent = 'Direzione iniziale di BÖKS';
  card.appendChild(orientationTitle);

  const orientationGrid = document.createElement('div');
  orientationGrid.className = 'editor-orientation-grid';
  const orientationOptions = [
    { id: 'up', label: 'Su', glyph: '^' },
    { id: 'right', label: 'Destra', glyph: '>' },
    { id: 'down', label: 'Giu', glyph: 'v' },
    { id: 'left', label: 'Sinistra', glyph: '<' }
  ];

  orientationOptions.forEach(option => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'editor-orientation-btn' + (ori === option.id ? ' active' : '');
    btn.dataset.orientation = option.id;
    btn.innerHTML = `
      <span class="editor-orientation-glyph">${option.glyph}</span>
      <span class="editor-orientation-label">${option.label}</span>
    `;
    btn.addEventListener('click', () => {
      if (ori === option.id) return;
      ori = option.id;
      setCharacterAction('idle');
      syncSprite();
      renderElementPalette();
      refreshEditorDebug();
    });
    orientationGrid.appendChild(btn);
  });
  card.appendChild(orientationGrid);

  const characterTitle = document.createElement('div');
  characterTitle.className = 'editor-setup-title';
  characterTitle.textContent = 'Personaggio';
  card.appendChild(characterTitle);

  const characterRow = document.createElement('div');
  characterRow.className = 'editor-character-row';
  const selectedCharacterId = getCurrentEditorCharacterId();
  getCharacterOptions().forEach(option => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'editor-character-btn' + (selectedCharacterId === option.id ? ' active' : '');
    btn.dataset.characterId = option.id;
    btn.textContent = option.label;
    btn.title = option.hint || option.id;
    btn.addEventListener('click', () => {
      if (!setCurrentEditorCharacterId(option.id)) return;
      applyEditorBoardChanges();
      renderCustomLevels();
    });
    characterRow.appendChild(btn);
  });
  card.appendChild(characterRow);

  const levelRulesTitle = document.createElement('div');
  levelRulesTitle.className = 'editor-setup-title';
  levelRulesTitle.textContent = 'Caratteristiche livello';
  card.appendChild(levelRulesTitle);

  const hintControls = document.createElement('div');
  renderLevelHintControls(hintControls);
  card.appendChild(hintControls);

  palette.appendChild(card);
}

function renderTreeBrushControls(card) {
  if (!card || selectedDecorationBrush !== 'tree_small') return;
  const treeOptions = getDecorationBrushOptions('tree_small');

  const controls = document.createElement('div');
  controls.className = 'editor-decor-controls';

  const title = document.createElement('div');
  title.className = 'editor-setup-title';
  title.textContent = 'Editor alberello';
  controls.appendChild(title);

  const scaleWrap = document.createElement('label');
  scaleWrap.className = 'editor-decor-control';
  scaleWrap.innerHTML = `<span class="editor-decor-control-label">Scala</span><span class="editor-decor-control-value">${Math.round((treeOptions.scale || 1) * 100)}%</span>`;
  const scaleInput = document.createElement('input');
  scaleInput.type = 'range';
  scaleInput.min = '70';
  scaleInput.max = '180';
  scaleInput.step = '5';
  scaleInput.value = String(Math.round((treeOptions.scale || 1) * 100));
  scaleInput.addEventListener('input', () => {
    setDecorationBrushOptions('tree_small', {
      ...getDecorationBrushOptions('tree_small'),
      scale: Number(scaleInput.value) / 100
    });
    renderElementPalette();
  });
  scaleWrap.appendChild(scaleInput);
  controls.appendChild(scaleWrap);

  const foliageWrap = document.createElement('label');
  foliageWrap.className = 'editor-decor-control editor-decor-control--color';
  foliageWrap.innerHTML = '<span class="editor-decor-control-label">Chioma</span>';
  const foliageInput = document.createElement('input');
  foliageInput.type = 'color';
  foliageInput.value = parseColorToHex(treeOptions.foliageColor) || '#5dae61';
  foliageInput.addEventListener('input', () => {
    setDecorationBrushOptions('tree_small', {
      ...getDecorationBrushOptions('tree_small'),
      foliageColor: foliageInput.value
    });
    renderElementPalette();
  });
  foliageWrap.appendChild(foliageInput);
  controls.appendChild(foliageWrap);

  const trunkWrap = document.createElement('label');
  trunkWrap.className = 'editor-decor-control editor-decor-control--color';
  trunkWrap.innerHTML = '<span class="editor-decor-control-label">Tronco</span>';
  const trunkInput = document.createElement('input');
  trunkInput.type = 'color';
  trunkInput.value = parseColorToHex(treeOptions.trunkColor) || '#8f6136';
  trunkInput.addEventListener('input', () => {
    setDecorationBrushOptions('tree_small', {
      ...getDecorationBrushOptions('tree_small'),
      trunkColor: trunkInput.value
    });
    renderElementPalette();
  });
  trunkWrap.appendChild(trunkInput);
  controls.appendChild(trunkWrap);

  const note = document.createElement('div');
  note.className = 'editor-setup-hint';
  note.innerHTML = 'Dopo aver cambiato scala o colori, tocca la griglia per piazzare l alberello come se fosse un paint sopra la board.';
  controls.appendChild(note);

  card.appendChild(controls);
}

function renderBeeBrushControls(card) {
  if (!card || selectedDecorationBrush !== 'bee_hover') return;
  const beeOptions = getDecorationBrushOptions('bee_hover');
  const placedBeeDecorations = activeLevelDecorations.filter(entry => resolveDecorationAssetId(entry.asset) === 'bee_hover');

  const controls = document.createElement('div');
  controls.className = 'editor-decor-controls';

  const title = document.createElement('div');
  title.className = 'editor-setup-title';
  title.textContent = 'Editor api';
  controls.appendChild(title);

  const scaleWrap = document.createElement('label');
  scaleWrap.className = 'editor-decor-control';
  scaleWrap.innerHTML = `<span class="editor-decor-control-label">Scala</span><span class="editor-decor-control-value">${Math.round((beeOptions.scale || 1) * 100)}%</span>`;
  const scaleInput = document.createElement('input');
  scaleInput.type = 'range';
  scaleInput.min = '70';
  scaleInput.max = '160';
  scaleInput.step = '5';
  scaleInput.value = String(Math.round((beeOptions.scale || 1) * 100));
  scaleInput.addEventListener('input', () => {
    setDecorationBrushOptions('bee_hover', {
      ...getDecorationBrushOptions('bee_hover'),
      scale: Number(scaleInput.value) / 100
    });
    renderElementPalette();
  });
  scaleWrap.appendChild(scaleInput);
  controls.appendChild(scaleWrap);

  const countWrap = document.createElement('label');
  countWrap.className = 'editor-decor-control';
  countWrap.innerHTML = `<span class="editor-decor-control-label">Numero api</span><span class="editor-decor-control-value">${normalizeDecorationCount(beeOptions.count, 3)}</span>`;
  const countInput = document.createElement('input');
  countInput.type = 'range';
  countInput.min = '1';
  countInput.max = '10';
  countInput.step = '1';
  countInput.value = String(normalizeDecorationCount(beeOptions.count, 3));
  countInput.addEventListener('input', () => {
    setDecorationBrushOptions('bee_hover', {
      ...getDecorationBrushOptions('bee_hover'),
      count: normalizeDecorationCount(countInput.value, 3)
    });
    renderElementPalette();
  });
  countWrap.appendChild(countInput);
  controls.appendChild(countWrap);

  const note = document.createElement('div');
  note.className = 'editor-setup-hint';
  note.innerHTML = 'Piazzi uno stormo ancorato al punto cliccato. Per tenere leggero il livello, solo poche api usano Lottie completo e le altre restano istanze leggere.';
  controls.appendChild(note);

  if (placedBeeDecorations.length) {
    const list = document.createElement('div');
    list.className = 'editor-decor-list';

    const listTitle = document.createElement('div');
    listTitle.className = 'editor-setup-title';
    listTitle.textContent = 'Stormi presenti';
    list.appendChild(listTitle);

    placedBeeDecorations.forEach((entry, index) => {
      const item = document.createElement('div');
      item.className = 'editor-decor-list-item';

      const copy = document.createElement('div');
      copy.className = 'editor-decor-list-copy';
      const label = document.createElement('div');
      label.className = 'editor-decor-list-label';
      label.textContent = `Stormo ${index + 1}`;
      const meta = document.createElement('div');
      meta.className = 'editor-decor-list-meta';
      meta.textContent = `${getBeeDecorationCount(entry)} api • origine ${Math.round((entry.anchorX || 0.5) * 100)}% x ${Math.round((entry.anchorY || 0.5) * 100)}%`;
      copy.appendChild(label);
      copy.appendChild(meta);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'editor-decor-remove';
      removeBtn.textContent = 'Rimuovi';
      removeBtn.addEventListener('click', () => {
        activeLevelDecorations = normalizeLevelDecorations(
          activeLevelDecorations.filter(candidate => candidate.id !== entry.id)
        );
        applyEditorBoardChanges();
      });

      item.appendChild(copy);
      item.appendChild(removeBtn);
      list.appendChild(item);
    });

    controls.appendChild(list);
  }

  card.appendChild(controls);
}

function renderDecorationPalette(palette) {
  if (!palette || !editorMode) return;

  const card = document.createElement('div');
  card.className = 'editor-setup-card editor-decor-card';

  const title = document.createElement('div');
  title.className = 'editor-setup-title';
  title.textContent = 'Decorazioni';
  card.appendChild(title);

  const hint = document.createElement('div');
  hint.className = 'editor-setup-hint';
  hint.innerHTML = 'Qui scegli gli elementi decorativi del livello: <strong>alberello</strong>, <strong>margherita</strong>, <strong>stormo di api</strong> con istanze regolabili e <strong>ponte</strong> placeholder.';
  card.appendChild(hint);

  const summary = document.createElement('div');
  summary.className = 'editor-decor-summary';
  summary.textContent = `${activeLevelDecorations.length} elementi decorativi nel livello`;
  card.appendChild(summary);

  const grid = document.createElement('div');
  grid.className = 'editor-decor-grid';

  const eraseBtn = document.createElement('button');
  eraseBtn.type = 'button';
  eraseBtn.className = 'element-tool decor-tool' + (selectedDecorationBrush === DECORATION_ERASE_TOOL ? ' active' : '');
  eraseBtn.innerHTML = `
    <span class="element-tool-icon decor-tool-icon decor-tool-icon--erase">
      <svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true">
        <path d="M12 28 24 12l14 14-12 12H12z" fill="#f6d3b7" stroke="#c48763" stroke-width="2"/>
        <path d="M8 36h20" stroke="#996c52" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="element-tool-label">Gomma</span>
    <span class="element-tool-status">CLEAR</span>
    <span class="element-tool-hint">Rimuove la decorazione sotto il punto cliccato</span>
  `;
  eraseBtn.addEventListener('click', () => {
    selectedDecorationBrush = selectedDecorationBrush === DECORATION_ERASE_TOOL ? null : DECORATION_ERASE_TOOL;
    selectedElementTool = null;
    renderElementPalette();
  });
  grid.appendChild(eraseBtn);

  Object.entries(DECORATION_ASSET_DEFS).forEach(([assetId, def]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'element-tool decor-tool' + (selectedDecorationBrush === assetId ? ' active' : '');
    btn.dataset.assetId = assetId;
    btn.innerHTML = `
      <span class="element-tool-icon decor-tool-icon">${getDecorationPreviewMarkup(assetId)}</span>
      <span class="element-tool-label">${def.label}</span>
      <span class="element-tool-status">${def.layer.toUpperCase()}</span>
      <span class="element-tool-hint">${def.hint}</span>
    `;
    btn.addEventListener('click', () => {
      selectedDecorationBrush = selectedDecorationBrush === assetId ? null : assetId;
      selectedElementTool = null;
      renderElementPalette();
    });
    grid.appendChild(btn);
  });

  renderTreeBrushControls(card);
  renderBeeBrushControls(card);
  card.appendChild(grid);
  palette.appendChild(card);
}

function renderElementPalette() {
  const panel = document.getElementById('elementPalettePanel');
  const palette = document.getElementById('elementPalette');
  if (!panel || !palette) {
    renderThemeEditorPanel();
    return;
  }
  panel.style.display = (editorMode && !editorStylePanelOpen) ? 'block' : 'none';
  if (!editorMode) {
    palette.innerHTML = '';
    renderThemeEditorPanel();
    return;
  }

  const tools = [
    {
      key: 'player',
      label: 'BÖKS',
      present: playerPlaced,
      hint: playerPlaced
        ? (selectedElementTool === 'player'
          ? 'Tocca una cella libera per spostarlo'
          : 'Seleziona per spostarlo sulla griglia')
        : 'Seleziona e tocca una cella libera della griglia'
    },
    {
      key: 'goal',
      label: 'Goal',
      present: goalPlaced,
      hint: goalPlaced
        ? (selectedElementTool === 'goal'
          ? 'Tocca una cella libera per spostarlo'
          : 'Seleziona per spostarlo sulla griglia')
        : 'Seleziona e tocca una cella libera della griglia'
    },
    {
      key: 'brick',
      label: 'Mattone',
      present: false,
      hint: 'Tocca celle per aggiungere o rimuovere'
    }
  ];

  palette.innerHTML = '';
  tools.forEach(tool => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'element-tool' + (selectedElementTool === tool.key ? ' active' : '') + (tool.present ? ' placed' : '');
    btn.dataset.tool = tool.key;
    const status = tool.key === 'brick'
      ? 'TOGGLE'
      : (tool.present ? (selectedElementTool === tool.key ? 'MOVE' : 'SET') : 'PLACE');
    btn.innerHTML = `
      <span class="element-tool-icon">${elementPaletteIcon(tool.key)}</span>
      <span class="element-tool-label">${tool.label}</span>
      <span class="element-tool-status">${status}</span>
      <span class="element-tool-hint">${tool.hint}</span>
    `;
    btn.addEventListener('click', () => {
      selectedElementTool = selectedElementTool === tool.key ? null : tool.key;
      selectedDecorationBrush = null;
      renderElementPalette();
    });
    palette.appendChild(btn);
  });
  renderDecorationPalette(palette);
  renderEditorSetupControls(palette);
  renderThemeEditorPanel();
}

function renderThemePicker() {
  const picker = document.getElementById('themePicker');
  if (!picker) return;
  if (!editorMode || !editorStylePanelOpen) {
    picker.innerHTML = '';
    return;
  }

  const selectedThemeId = getCurrentEditorThemeId();
  const options = getEditorThemeOptions();
  picker.innerHTML = '';
  options.forEach(theme => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-choice' + (selectedThemeId === theme.id ? ' active' : '');
    btn.dataset.theme = theme.id;
    btn.innerHTML = `
      <span class="theme-choice-art">${buildThemePreviewSVG(theme.id)}</span>
      <span class="theme-choice-copy">
        <span class="theme-choice-title">${theme.label}</span>
        <span class="theme-choice-hint">${theme.hint}</span>
      </span>
    `;
    btn.addEventListener('click', () => applyEditorTheme(theme.id));
    picker.appendChild(btn);
  });
}

function getCharacterOptions() {
  return getCharacterIds()
    .filter(id => isCharacterEditorApproved(id))
    .map(id => {
    const manifest = getCharacterDefs()[id] || {};
    return {
      id,
      label: getCharacterLabel(id),
      hint: manifest.hint || ''
    };
  });
}

function buildCharacterPreviewMarkup(characterId) {
  const markup = window.BOKS_CHARACTER_RENDERER?.render({
    characterId: resolveRuntimeCharacterId(characterId),
    action: 'idle',
    direction: 'right'
  }) || '';
  if (markup) return markup;
  return `<span class="character-choice-title">${getCharacterLabel(characterId)}</span>`;
}

function renderCharacterPicker() {
  const picker = document.getElementById('characterPicker');
  if (!picker) return;
  if (!editorMode || !editorStylePanelOpen) {
    window.BOKS_CHARACTER_RENDERER?.destroyIn?.(picker);
    picker.innerHTML = '';
    return;
  }

  window.BOKS_CHARACTER_RENDERER?.destroyIn?.(picker);
  const selectedCharacterId = getCurrentEditorCharacterId();
  const options = getCharacterOptions();
  picker.innerHTML = '';

  options.forEach(option => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'character-choice' + (selectedCharacterId === option.id ? ' active' : '');
    btn.dataset.characterId = option.id;
    btn.innerHTML = `
      <span class="character-choice-art">${buildCharacterPreviewMarkup(option.id)}</span>
      <span class="character-choice-copy">
        <span class="character-choice-title">${option.label}</span>
        <span class="character-choice-hint">${option.hint || `ID: ${option.id}`}</span>
      </span>
    `;
    btn.addEventListener('click', () => {
      if (!setCurrentEditorCharacterId(option.id)) return;
      applyEditorBoardChanges();
      renderThemeEditorPanel();
      renderCustomLevels();
    });
    picker.appendChild(btn);
  });

  window.BOKS_CHARACTER_RENDERER?.mountIn?.(picker);
}

function renderLevelHintControls(controls) {
  if (!controls) return;
  if (!editorMode) {
    controls.innerHTML = '';
    return;
  }

  const hints = getCurrentEditorLevelHints();
  controls.innerHTML = '';

  const item = document.createElement('div');
  item.className = 'level-hint-item';
  item.innerHTML = `
    <div class="level-hint-copy">
      <span class="level-hint-label">Blocchi iniziali con glow</span>
      <span class="level-hint-hint">Accende il bagliore sui blocchi disponibili all'apertura del livello, finche non ne inserisci uno.</span>
    </div>
  `;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'level-hint-toggle' + (hints.availableBlockGlow ? ' active' : '');
  toggle.setAttribute('aria-pressed', hints.availableBlockGlow ? 'true' : 'false');
  toggle.textContent = hints.availableBlockGlow ? 'On' : 'Off';
  toggle.addEventListener('click', () => {
    const currentValue = !!getCurrentEditorLevelHints().availableBlockGlow;
    const nextHints = {
      ...getCurrentEditorLevelHints(),
      availableBlockGlow: !currentValue
    };
    if (!setCurrentEditorLevelHints(nextHints)) return;
    if (currentCustomLevel?.campaignIndex != null || currentCustomLevel?.baseStepIndex != null) {
      refreshAvailableBlockGlowState();
    }
    renderElementPalette();
    renderThemeEditorPanel();
    renderAvail();
    renderCustomLevels();
  });

  item.appendChild(toggle);
  controls.appendChild(item);
}

function renderThemeColorControls() {
  const controls = document.getElementById('themeColorControls');
  if (!controls) return;
  if (!editorMode || !editorStylePanelOpen) {
    controls.innerHTML = '';
    return;
  }
  const themeId = getCurrentEditorThemeId();
  const themeVars = LEVELS[resolveThemeLevelId(themeId)]?.sceneVars || {};
  const overrides = getCurrentEditorThemeOverrides();
  controls.innerHTML = '';

  EDITOR_THEME_COLOR_CONTROLS.forEach(control => {
    const baseColor = parseColorToHex(themeVars[control.key]) || '#cccccc';
    const currentColor = parseColorToHex(overrides[control.key]) || baseColor;
    const item = document.createElement('div');
    item.className = 'theme-color-item';
    item.innerHTML = `
      <div class="theme-color-copy">
        <span class="theme-color-label">${control.label}</span>
        <span class="theme-color-key">${control.key}</span>
      </div>
    `;
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'theme-color-input';
    picker.value = currentColor;
    picker.setAttribute('aria-label', `Colore ${control.label}`);
    picker.addEventListener('input', () => {
      const nextOverrides = getCurrentEditorThemeOverrides();
      nextOverrides[control.key] = picker.value;
      if (!setCurrentEditorThemeOverrides(nextOverrides)) return;
      clearBtn.disabled = false;
      applyLevelSceneVars();
      renderCustomLevels();
    });
    item.appendChild(picker);

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'theme-color-reset';
    clearBtn.textContent = 'Reset';
    clearBtn.disabled = !overrides[control.key];
    clearBtn.addEventListener('click', () => {
      const nextOverrides = getCurrentEditorThemeOverrides();
      delete nextOverrides[control.key];
      if (!setCurrentEditorThemeOverrides(nextOverrides)) return;
      applyLevelSceneVars();
      renderThemeColorControls();
      renderCustomLevels();
    });
    item.appendChild(clearBtn);
    controls.appendChild(item);
  });
}

function renderThemeEditorPanel() {
  const panel = document.getElementById('levelThemePanel');
  const target = document.getElementById('themeTargetInfo');
  const actions = document.getElementById('themeColorActions');
  const applyBtn = document.getElementById('applyThemeStyleBtn');
  if (!panel) return;
  const visible = !!(editorMode && editorStylePanelOpen);
  panel.style.display = visible ? 'block' : 'none';
  if (target) {
    target.textContent = visible ? `Stai modificando: ${resolveStyleTargetLabel()}` : '';
  }
  if (actions) actions.style.display = visible ? 'flex' : 'none';
  if (applyBtn) {
    const selected = selectedEditorLevelId || currentCustomLevel?.id || '';
    const canApply = visible && selected && selected !== NEW_EDITOR_LEVEL_ID && !!findCustomLevel(selected);
    applyBtn.disabled = !canApply;
    applyBtn.setAttribute('aria-disabled', canApply ? 'false' : 'true');
    applyBtn.title = canApply ? `Applica stile a ${resolveStyleTargetLabel()}` : 'Seleziona un livello salvato';
  }
  renderThemePicker();
  renderCharacterPicker();
  renderThemeColorControls();
  renderStylePresetPanel();
}

function applyEditorBoardChanges() {
  initGrid();
  drawBackground();
  syncSprite();
  if (editorMode) renderElementPalette();
  refreshEditorDebug();
}

function startBlankEditorLevel() {
  selectedEditorLevelId = NEW_EDITOR_LEVEL_ID;
  currentCustomLevel = null;
  pendingNewLevelThemeOverrides = {};
  currentLevel = resolveThemeLevelId(CUSTOM_LEVEL_THEME);
  tutorialSceneLevelId = currentLevel;
  pendingNewLevelCharacterId = resolveCharacterId(getLevel()?.characterId);
  pendingNewLevelHints = {};
  applyLevelSceneVars();
  playerPlaced = false;
  goalPlaced = false;
  selectedElementTool = null;
  selectedDecorationBrush = null;
  START = { x: 2, y: 2 };
  GOAL = { x: 5, y: 5 };
  pos = { ...START };
  ori = 'right';
  setCharacterAction('idle');
  setBlockedCells([]);
  activeLevelDecorations = [];
  resetPrograms();
  mainSlotEnabled = Array(SLOTS).fill(false);
  fnSlotEnabled = Array(FSLOTS).fill(false);
  editorBlockEnabled = { forward: false, left: false, right: false, function: false };
  setAvailableBlocks([]);
  refreshEditorValues();
  applyEditorBoardChanges();
  renderAvail();
  renderBoard();
  renderFn();
  renderCustomLevels();
  renderThemeEditorPanel();
}

function setupEditorElementPlacement() {
  const grid = document.getElementById('gameGrid');
  const sprite = document.getElementById('sprite');
  if (!grid || grid.dataset.editorPlacementBound === 'true') return;
  grid.dataset.editorPlacementBound = 'true';
  let suppressNextClick = false;

  function moveBrick(fromX, fromY, toX, toY) {
    const fromKey = cellKey(fromX, fromY);
    const toKey = cellKey(toX, toY);
    const isPlayerCell = playerPlaced && pos.x === toX && pos.y === toY;
    const isGoalCell = goalPlaced && GOAL.x === toX && GOAL.y === toY;
    if (!blockedCells.has(fromKey) || isPlayerCell || isGoalCell || blockedCells.has(toKey)) return;
    blockedCells.delete(fromKey);
    blockedCells.add(toKey);
    applyEditorBoardChanges();
  }

  function setupBrickDrag(startX, startY, clientX, clientY) {
    if (!editorMode || running || animating || !isBlockedCell(startX, startY)) return false;
    const sourceCell = getGridCell(startX, startY);
    const size = sourceCell?.getBoundingClientRect().width || 48;
    const ghost = document.getElementById('ghost');
    ghost.innerHTML = elementPaletteIcon('brick');
    ghost.style.cssText = `display:block;width:${size}px;height:${size}px;left:${clientX}px;top:${clientY}px;`;
    if (sourceCell) sourceCell.style.opacity = '0.25';
    return true;
  }

  function moveBrickGhost(clientX, clientY) {
    const ghost = document.getElementById('ghost');
    ghost.style.left = clientX + 'px';
    ghost.style.top = clientY + 'px';
    ghost.style.display = 'none';
    const under = document.elementFromPoint(clientX, clientY);
    ghost.style.display = 'block';
    document.querySelectorAll('.cell.hi').forEach(c => c.classList.remove('hi'));
    under?.closest('.cell')?.classList.add('hi');
  }

  function endBrickDrag(startX, startY, clientX, clientY, moved) {
    document.getElementById('ghost').style.display = 'none';
    document.querySelectorAll('.cell.hi').forEach(c => c.classList.remove('hi'));
    getGridCell(startX, startY)?.style.removeProperty('opacity');
    if (!moved) return;
    suppressNextClick = true;
    const under = document.elementFromPoint(clientX, clientY);
    const cell = under?.closest('.cell');
    if (!cell) return;
    const toX = Number(cell.dataset.cx);
    const toY = Number(cell.dataset.cy);
    if (toX === startX && toY === startY) return;
    moveBrick(startX, startY, toX, toY);
  }

  function updateDecorations(nextDecorations) {
    activeLevelDecorations = normalizeLevelDecorations(nextDecorations);
    applyEditorBoardChanges();
  }

  function placeDecorationAtPoint(clientX, clientY, assetId) {
    const def = getDecorationAssetDef(assetId);
    if (!def) return false;
    const anchor = getGridPointerAnchor(clientX, clientY);
    if (!anchor) return false;
    const layer = normalizeDecorationLayer(def.layer);
    const options = getDecorationBrushOptions(assetId);
    const next = [
      ...activeLevelDecorations,
      {
        id: `decor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        asset: resolveDecorationAssetId(assetId),
        layer,
        ...anchor,
        ...options
      }
    ];
    updateDecorations(next);
    return true;
  }

  function eraseDecorationAtPoint(clientX, clientY) {
    const hit = getDecorationHitAtPoint(clientX, clientY);
    if (!hit) return false;
    updateDecorations(activeLevelDecorations.filter(entry => entry.id !== hit.id));
    return true;
  }

  grid.addEventListener('click', e => {
    if (!editorMode || running || animating) return;
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    if (selectedDecorationBrush) {
      if (selectedDecorationBrush === DECORATION_ERASE_TOOL) {
        eraseDecorationAtPoint(e.clientX, e.clientY);
      } else {
        placeDecorationAtPoint(e.clientX, e.clientY, selectedDecorationBrush);
      }
      return;
    }

    const cell = e.target?.closest('.cell');
    if (!cell) return;

    const x = Number(cell.dataset.cx);
    const y = Number(cell.dataset.cy);
    const isPlayerCell = playerPlaced && pos.x === x && pos.y === y;
    const isGoalCell = goalPlaced && GOAL.x === x && GOAL.y === y;
    const isBlocked = isBlockedCell(x, y);

    if (selectedElementTool === 'player') {
      if (isBlocked || isGoalCell) return;
      if (playerPlaced && isPlayerCell) {
        selectedElementTool = null;
        renderElementPalette();
        return;
      }
      playerPlaced = true;
      START = { x, y };
      pos = { x, y };
      selectedElementTool = null;
      applyEditorBoardChanges();
      return;
    }

    if (selectedElementTool === 'goal') {
      if (goalPlaced && isGoalCell) {
        goalPlaced = false;
        selectedElementTool = null;
        applyEditorBoardChanges();
        return;
      }
      if (isBlocked || isPlayerCell) return;
      goalPlaced = true;
      GOAL = { x, y };
      selectedElementTool = null;
      applyEditorBoardChanges();
      return;
    }

    if (selectedElementTool === 'brick') {
      if (isPlayerCell || isGoalCell) return;
      const key = cellKey(x, y);
      if (isBlocked) blockedCells.delete(key);
      else blockedCells.add(key);
      applyEditorBoardChanges();
      return;
    }

    if (isBlocked) {
      blockedCells.delete(cellKey(x, y));
      applyEditorBoardChanges();
    }
  });

  sprite?.addEventListener('click', () => {
    if (!editorMode || !playerPlaced || selectedElementTool !== 'player' || running || animating) return;
    playerPlaced = false;
    selectedElementTool = null;
    applyEditorBoardChanges();
  });

  grid.addEventListener('touchstart', e => {
    if (selectedDecorationBrush || (selectedElementTool && selectedElementTool !== 'brick')) return;
    const cell = e.target?.closest('.cell.obstacle-cell');
    if (!cell) return;
    const startX = Number(cell.dataset.cx);
    const startY = Number(cell.dataset.cy);
    const touch = e.touches[0];
    if (!setupBrickDrag(startX, startY, touch.clientX, touch.clientY)) return;
    let moved = false;
    e.preventDefault();
    e.stopPropagation();
    const mm = ev => {
      ev.preventDefault();
      moved = true;
      moveBrickGhost(ev.touches[0].clientX, ev.touches[0].clientY);
    };
    const mu = ev => {
      ev.preventDefault();
      endBrickDrag(startX, startY, ev.changedTouches[0].clientX, ev.changedTouches[0].clientY, moved);
      grid.removeEventListener('touchmove', mm);
      grid.removeEventListener('touchend', mu);
      grid.removeEventListener('touchcancel', mu);
    };
    grid.addEventListener('touchmove', mm, { passive: false });
    grid.addEventListener('touchend', mu, { passive: false });
    grid.addEventListener('touchcancel', mu, { passive: false });
  }, { passive: false });

  grid.addEventListener('mousedown', e => {
    if (selectedDecorationBrush || (selectedElementTool && selectedElementTool !== 'brick')) return;
    const cell = e.target?.closest('.cell.obstacle-cell');
    if (!cell) return;
    const startX = Number(cell.dataset.cx);
    const startY = Number(cell.dataset.cy);
    if (!setupBrickDrag(startX, startY, e.clientX, e.clientY)) return;
    let moved = false;
    e.preventDefault();
    const mm = ev => {
      moved = true;
      moveBrickGhost(ev.clientX, ev.clientY);
    };
    const mu = ev => {
      endBrickDrag(startX, startY, ev.clientX, ev.clientY, moved);
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup', mu);
    };
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
  });
}

function renderIconPicker() {
  const picker = document.getElementById('iconPicker');
  if (!picker) return;
  picker.innerHTML = '';
  CUSTOM_ICONS.forEach(icon => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-choice' + (selectedSaveIcon === icon ? ' active' : '');
    btn.dataset.icon = icon;
    btn.innerHTML = customIconSVG(icon);
    btn.addEventListener('click', () => {
      selectedSaveIcon = icon;
      renderIconPicker();
    });
    picker.appendChild(btn);
  });
}

function openSaveLevelModal() {
  if (!LEVEL_EDITOR_ENABLED) return;
  void saveCurrentEditorLevel();
}

function closeSaveLevelModal() {
  const modal = document.getElementById('saveLevelModal');
  modal?.classList.remove('show');
  modal?.setAttribute('aria-hidden', 'true');
}

async function saveCurrentEditorLevel() {
  if (!LEVEL_EDITOR_ENABLED || !editorMode) return;
  const levelId = currentCustomLevel?.id
    || selectedEditorLevelId
    || (currentLevel === 'level1' ? getCampaignLevelIdForIndex(tutorialStepIndex) : null);
  if (!levelId) {
    toast('Seleziona un livello');
    return;
  }
  const level = collectCurrentEditorLevel();
  const levels = readCustomLevels();
  if (levelId === NEW_EDITOR_LEVEL_ID) {
    const newLevel = normalizeCustomLevel({
      ...level,
      id: `custom-${Date.now()}`,
      number: levels.length + 1,
      baseStepIndex: null,
      name: `Livello ${levels.length + 1}`
    });
    levels.push(newLevel);
    const persistResult = await persistEditorLevels(levels, { promptIfMissing: true });
    currentCustomLevel = cloneCustomLevel(newLevel);
    selectedEditorLevelId = newLevel.id;
    applyCustomLevel(newLevel, { openEditor: true });
    renderCustomLevels();
    renderElementPalette();
    toast(describePersistResult({
      projectMessage: 'Livello salvato nel progetto: ora puoi fare commit',
      browserMessage: 'Livello salvato nel browser di questo dispositivo',
      sessionMessage: 'Livello salvato solo in questa sessione'
    }, persistResult));
    return newLevel;
  }
  const idx = levels.findIndex(entry => entry.id === levelId);
  if (idx === -1) {
    toast('Livello non trovato');
    return;
  }
  levels[idx] = normalizeCustomLevel({
    ...levels[idx],
    ...level,
    id: levels[idx].id,
    number: levels[idx].number,
    campaignIndex: levels[idx].campaignIndex ?? levels[idx].baseStepIndex ?? null,
    baseStepIndex: levels[idx].baseStepIndex,
    name: levels[idx].name
  });
  const persistResult = await persistEditorLevels(levels, { promptIfMissing: true });
  const savedLevel = levels[idx];
  selectedEditorLevelId = savedLevel.id;
  const savedCampaignIndex = savedLevel.campaignIndex ?? savedLevel.baseStepIndex;
  if (savedCampaignIndex != null) {
    currentCustomLevel = null;
    currentLevel = 'level1';
    applyLevelSceneVars();
    tutorialStepIndex = savedCampaignIndex;
    applyCampaignLevel(savedCampaignIndex);
    refreshEditorDebug();
  } else {
    currentCustomLevel = cloneCustomLevel(savedLevel);
    applyCustomLevel(savedLevel, { openEditor: true });
  }
  renderCustomLevels();
  renderElementPalette();
  toast(describePersistResult({
    projectMessage: 'Livello salvato nel progetto: ora puoi fare commit',
    browserMessage: 'Livello salvato nel browser di questo dispositivo',
    sessionMessage: 'Livello salvato solo in questa sessione'
  }, persistResult));
  return savedLevel;
}

async function reorderEditorLevels(draggedLevelId, targetLevelId) {
  if (!draggedLevelId || !targetLevelId || draggedLevelId === targetLevelId) return false;
  const current = readCustomLevels();
  const from = current.findIndex(entry => entry.id === draggedLevelId);
  const to = current.findIndex(entry => entry.id === targetLevelId);
  if (from === -1 || to === -1) return false;

  const reordered = current.map(normalizeCustomLevel);
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);

  const persistResult = await persistEditorLevels(reordered, { promptIfMissing: true });
  syncEditorStateAfterLevelsChange(reordered, { preferredLevelId: moved.id });
  toast(describePersistResult({
    projectMessage: `Livello spostato in posizione ${to + 1}`,
    browserMessage: `Livello spostato in posizione ${to + 1} nel browser`,
    sessionMessage: `Livello spostato in posizione ${to + 1} solo in questa sessione`
  }, persistResult));
  return true;
}

async function deleteEditorLevel(levelId) {
  if (!levelId || levelId === NEW_EDITOR_LEVEL_ID) return false;
  const levels = readCustomLevels();
  const target = levels.find(entry => entry.id === levelId);
  if (!target) {
    toast('Livello non trovato');
    return false;
  }
  const normalized = normalizeCustomLevel(target);
  if (normalized.campaignIndex != null || normalized.baseStepIndex != null) {
    toast('I livelli campagna non si eliminano da qui');
    return false;
  }
  const confirmed = window.confirm(`Eliminare "${normalized.name}"?`);
  if (!confirmed) return false;
  const remaining = levels
    .filter(entry => entry.id !== levelId)
    .map((entry, index) => normalizeCustomLevel({
      ...entry,
      number: index + 1
    }));
  const persistResult = await persistEditorLevels(remaining, { promptIfMissing: true });
  syncEditorStateAfterLevelsChange(remaining, {
    preferredLevelId: remaining[0]?.id || NEW_EDITOR_LEVEL_ID
  });
  renderElementPalette();
  toast(describePersistResult({
    projectMessage: `Livello "${normalized.name}" eliminato`,
    browserMessage: `Livello "${normalized.name}" eliminato nel browser`,
    sessionMessage: `Livello "${normalized.name}" eliminato solo in questa sessione`
  }, persistResult));
  return true;
}

function renderCustomLevels() {
  const list = document.getElementById('customLevelsList');
  if (!list || !LEVEL_EDITOR_ENABLED) return;
  const levels = readCustomLevels();
  list.innerHTML = '';
  if (!levels.length) return;

  levels.forEach((level, index) => {
    const normalized = normalizeCustomLevel(level);
    const themeId = resolveThemeLevelId(normalized.baseLevel);
    const deletable = normalized.campaignIndex == null && normalized.baseStepIndex == null;
    const item = document.createElement('div');
    item.className = 'editor-level-tile-item';
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'editor-level-tile ' + normalizeThemeClassName(themeId) + (selectedEditorLevelId === normalized.id ? ' active' : '');
    tile.draggable = true;
    tile.dataset.levelId = normalized.id;
    tile.textContent = String(index + 1);
    tile.title = `Livello ${index + 1} - ${getThemeLabel(themeId)}`;
    tile.addEventListener('click', () => {
      selectedEditorLevelId = normalized.id;
      if (editorMode) {
        applyCustomLevel(normalized, { openEditor: true });
        renderCustomLevels();
        return;
      }
      openAppFromGate({
        openEditor: true,
        onOpen: () => {
          selectedEditorLevelId = normalized.id;
          applyCustomLevel(normalized, { openEditor: true });
          renderCustomLevels();
        }
      });
    });
    tile.addEventListener('dragstart', () => {
      draggingEditorLevelId = normalized.id;
      tile.classList.add('dragging');
    });
    tile.addEventListener('dragend', () => {
      draggingEditorLevelId = null;
      tile.classList.remove('dragging');
      list.querySelectorAll('.editor-level-tile').forEach(el => el.classList.remove('drop-target'));
    });
    tile.addEventListener('dragover', e => {
      e.preventDefault();
      if (!draggingEditorLevelId || draggingEditorLevelId === normalized.id) return;
      tile.classList.add('drop-target');
    });
    tile.addEventListener('dragleave', () => tile.classList.remove('drop-target'));
    tile.addEventListener('drop', async e => {
      e.preventDefault();
      tile.classList.remove('drop-target');
      if (!draggingEditorLevelId || draggingEditorLevelId === normalized.id) return;
      const draggedId = draggingEditorLevelId;
      draggingEditorLevelId = null;
      tile.classList.remove('dragging');
      list.querySelectorAll('.editor-level-tile').forEach(el => el.classList.remove('drop-target', 'dragging'));
      await reorderEditorLevels(draggedId, normalized.id);
    });
    item.appendChild(tile);

    if (deletable) {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'editor-level-delete';
      deleteBtn.setAttribute('aria-label', `Elimina ${normalized.name}`);
      deleteBtn.title = `Elimina ${normalized.name}`;
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', async e => {
        e.preventDefault();
        e.stopPropagation();
        await deleteEditorLevel(normalized.id);
      });
      item.appendChild(deleteBtn);
    }

    list.appendChild(item);
  });

  const emptyTile = document.createElement('button');
  emptyTile.type = 'button';
  emptyTile.className = 'editor-level-tile editor-level-tile-empty' + (selectedEditorLevelId === NEW_EDITOR_LEVEL_ID ? ' active' : '');
  emptyTile.dataset.levelId = NEW_EDITOR_LEVEL_ID;
  emptyTile.textContent = '+';
  emptyTile.title = 'Nuovo livello';
  emptyTile.addEventListener('click', () => {
    startBlankEditorLevel();
    toast('Slot nuovo livello selezionato');
  });
  list.appendChild(emptyTile);
}

function goalSVG() { const lv = getLevel(); return lv?.renderGoal ? lv.renderGoal() : ''; }
function svgRobot(o) { const lv = getLevel(); return lv?.renderSprite ? lv.renderSprite(o) : ''; }
function drawBackground() { const lv = getLevel(); if (lv?.renderBackground) lv.renderBackground(); }


function renderAvail() {
  const row = document.getElementById('blocksRow');
  row.innerHTML = '';
  const sz = 52;

  if (editorMode) {
    getLevelEditor()?.renderEditorAvail(row, sz);
    return;
  }

  row.classList.remove('editor-blocks-row');
  const showAvailableBlockGlow = !editorMode && stepStartHintActive && shouldShowAvailableBlockGlow();
  row.classList.toggle('available-block-guided', showAvailableBlockGlow);

  avail.forEach((block, i) => {
    const el = mkB(block, sz, sz, 'ablock');
    el.dataset.blockDir = block.dir || block.direction || '';
    if (showAvailableBlockGlow) {
      el.classList.add('tutorial-focus');
    }
    el.style.setProperty('--available-block-glow-delay', showAvailableBlockGlow ? `${(i % 6) * 0.42}s` : '0s');
    el.dataset.ai = i;
    el.style.position = 'absolute';
    el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    bindDrag(el, 'avail', i, sz);
    row.appendChild(el);
  });
  alignAvailBlocksToSlots();
  queueFirstLevelOnboardingSync();
}

function alignAvailBlocksToSlots() {
  const row = document.getElementById('blocksRow');
  if (!row) return;
  if (editorMode) return;
  const blocks = Array.from(row.querySelectorAll('.ablock'));
  if (!blocks.length) return;
  const rowRect = row.getBoundingClientRect();

  if (blocks.length === 1) {
    blocks[0].style.left = `${rowRect.width / 2}px`;
    return;
  }

  const firstRowSlots = Array.from(document.querySelectorAll('#boardSlots .board-row:first-child .pslot:not(.locked)'));

  if (firstRowSlots.length < blocks.length) {
    // fallback finche il board non e pronto
    blocks.forEach((b, i) => {
      b.style.left = `${((i + 0.5) / blocks.length) * rowRect.width}px`;
    });
    return;
  }
  const startIdx = Math.max(0, Math.floor((firstRowSlots.length - blocks.length) / 2));
  blocks.forEach((_, i) => {
    const slot = firstRowSlots[startIdx + i];
    const sr = slot.getBoundingClientRect();
    const centerX = sr.left + sr.width / 2 - rowRect.left;
    blocks[i].style.left = `${centerX}px`;
  });
}

// ═══ RENDER BOARD ═══
// Block/slot sizes computed dynamically in renderBoard
const BSIZ = 28; // fallback
const SLOT_H = 38; // fallback

function getBoardSizes() {
  const board = document.getElementById('boardRow');
  const app   = document.getElementById('app');
  const compact = document.body.classList.contains('compact-ui');
  const boardW = board.clientWidth || (app.clientWidth - 20);
  const innerW = boardW - 16;
  const rowPadX = compact ? 10 : 12;
  const gapX = compact ? 8 : 11;
  const slotW  = Math.floor((innerW - rowPadX * 2 - gapX * 3) / 4);
  const slotHMin = compact ? 30 : 36;
  const slotHMax = compact ? 42 : 50;
  const slotH  = Math.max(slotHMin, Math.min(slotW - (compact ? 7 : 5), slotHMax));
  const bsiz   = Math.max(32, Math.min(slotH - 6, slotW - 8));
  return { slotH, slotW, bsiz, innerW, rowPadX, gapX, compact };
}

function renderBoard() {
  const g = document.getElementById('boardGrid');
  g.innerHTML = '';
  const { slotH, slotW, bsiz, innerW, rowPadX, gapX, compact } = getBoardSizes();

  const gapH = compact ? 16 : 22;
  const totalH = 3 * slotH + 2 * gapH;

  // SVG per il connettore tra riga1 e riga2
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('id','boardTrack');
  svg.setAttribute('viewBox',`0 0 ${innerW} ${totalH}`);
  svg.setAttribute('preserveAspectRatio','none');
  svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:0;';
  g.style.position = 'relative';
  g.appendChild(svg);

  const slotsWrap = document.createElement('div');
  slotsWrap.id = 'boardSlots';
  slotsWrap.style.position = 'relative';
  slotsWrap.style.zIndex = '1';
  g.style.height = totalH + 'px';

  const rowDefs = [
    { idxs:[0,1,2,3], reverse:false, zone:'main' },
    { idxs:[4,5,6,7], reverse:false, zone:'main' },
    { idxs:[0,1,2,3], reverse:false, zone:'fn'   },
  ];

    rowDefs.forEach(({ idxs, reverse, zone }, rowIdx) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'board-row' + (reverse ? ' reverse' : '');
      rowEl.style.cssText = `height:${slotH}px; gap:${gapX}px; padding:0 ${rowPadX}px;`;
      if(rowIdx > 0) rowEl.style.marginTop = gapH + 'px';

    idxs.forEach(i => {
      const arr = zone === 'fn' ? fnProg : prog;
      const slot = document.createElement('div');
      slot.className = 'pslot';
      slot.dataset.slot = i; slot.dataset.zone = zone;
      const enabled = zone === 'main' ? mainSlotEnabled[i] : fnSlotEnabled[i];
      if (!enabled) slot.classList.add('locked');
      slot.style.height = slotH + 'px';
      const wellSize = Math.max(28, Math.round(bsiz * 0.96));
      const blockSize = Math.max(30, Math.round(wellSize * 1.06));
      slot.style.setProperty('--well-size', `${wellSize}px`);
      if (editorMode) {
        slot.addEventListener('click', e => {
          if (dg.active) return;
          if (e.target.closest('.pblock')) return;
          toggleEditorSlot(zone, i);
        });
      }

      const inn = document.createElement('div');
      inn.className = 'sinner';
      inn.style.cssText = `width:${blockSize}px;height:${blockSize}px;`;

      if(enabled && arr[i]) {
        slot.classList.add('filled');
        const be = mkB(arr[i], blockSize, blockSize, 'pblock');
        be.dataset.si = i; be.dataset.zone = zone;
        bindDrag(be, zone === 'fn' ? 'fn' : 'prog', i, blockSize);
        inn.appendChild(be);
      }
      slot.appendChild(inn);
      rowEl.appendChild(slot);
    });
    slotsWrap.appendChild(rowEl);
  });

  g.appendChild(slotsWrap);
  alignAvailBlocksToSlots();
  queueFirstLevelOnboardingSync();

  // Traccia completa: riga1 → connettore → riga2
  requestAnimationFrame(() => {
    const y1  = slotH / 2;
    const yM = slotH + gapH / 2;
    const y2  = slotH + gapH + slotH / 2;
    const r   = gapH * 0.9;
    const as = slotH * 0.28;
    const arrowX = rowPadX - as - 4;
    const startX = rowPadX + slotW / 2;
    const endX = startX + 3 * (slotW + gapX);
    const leftX = startX;
    const leftR = Math.max(3, Math.min(r, 10));
    const y3 = 2 * (slotH + gapH) + slotH / 2;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const trackMask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    trackMask.setAttribute('id', 'trackSlotMask');
    trackMask.setAttribute('maskUnits', 'userSpaceOnUse');
    trackMask.setAttribute('x', '0');
    trackMask.setAttribute('y', '0');
    trackMask.setAttribute('width', String(innerW));
    trackMask.setAttribute('height', String(totalH));

    const keepAll = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    keepAll.setAttribute('x', '0');
    keepAll.setAttribute('y', '0');
    keepAll.setAttribute('width', String(innerW));
    keepAll.setAttribute('height', String(totalH));
    keepAll.setAttribute('fill', 'white');
    trackMask.appendChild(keepAll);

    const rowYs = [0, slotH + gapH, 2 * (slotH + gapH)];
    rowYs.forEach((rowY) => {
      for (let i = 0; i < 4; i++) {
        const cut = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cut.setAttribute('x', String(rowPadX + i * (slotW + gapX)));
        cut.setAttribute('y', String(rowY));
        cut.setAttribute('width', String(slotW));
        cut.setAttribute('height', String(slotH));
        cut.setAttribute('rx', '10');
        cut.setAttribute('fill', 'black');
        trackMask.appendChild(cut);
      }
    });
    defs.appendChild(trackMask);
    svg.appendChild(defs);

    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',
      `M ${startX} ${y1}` +
      ` H ${endX}` +
      ` L ${endX} ${yM - r}` +
      ` Q ${endX} ${yM} ${endX - r} ${yM}` +
      ` L ${leftX + leftR} ${yM}` +
      ` Q ${leftX} ${yM} ${leftX} ${yM + leftR}` +
      ` L ${leftX} ${y2}` +
      ` H ${endX}`
    );
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'rgba(180,140,80,0.35)');
    p.setAttribute('stroke-width', '3');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('mask', 'url(#trackSlotMask)');
    svg.appendChild(p);

    // Freccia inizio traccia main (sinistra riga1)
    function arrow(x, y, color) {
      const a = document.createElementNS('http://www.w3.org/2000/svg','path');
      a.setAttribute('d', `M ${x} ${y - as} Q ${x + as*0.3} ${y - as} ${x + as} ${y} Q ${x + as*0.3} ${y + as} ${x} ${y + as} Q ${x + as*0.5} ${y} ${x} ${y - as}`);
      a.setAttribute('fill', color);
      a.setAttribute('stroke', 'none');
      svg.appendChild(a);
    }
    arrow(arrowX, y1, 'rgba(180,140,80,0.5)');

    // Traccia riga fn
    const pFn = document.createElementNS('http://www.w3.org/2000/svg','path');
    pFn.setAttribute('d', `M ${startX} ${y3} H ${endX}`);
    pFn.setAttribute('fill', 'none');
    pFn.setAttribute('stroke', 'rgba(43,143,212,0.35)');
    pFn.setAttribute('stroke-width', '3');
    pFn.setAttribute('stroke-linecap', 'round');
    pFn.setAttribute('mask', 'url(#trackSlotMask)');
    svg.appendChild(pFn);

    // Freccia inizio traccia fn
    arrow(arrowX, y3, 'rgba(43,143,212,0.55)');
    const ySep = 2 * slotH + 2 * gapH - gapH / 2;
    const sep = document.createElementNS('http://www.w3.org/2000/svg','line');
    sep.setAttribute('x1', String(Math.max(8, rowPadX - 10))); sep.setAttribute('x2', String(Math.min(innerW - 8, innerW - rowPadX + 10)));
    sep.setAttribute('y1', ySep); sep.setAttribute('y2', ySep);
    sep.setAttribute('stroke', 'rgba(77,182,255,0.92)');
    sep.setAttribute('stroke-width', '2.6');
    sep.setAttribute('stroke-dasharray', '9 6');
    sep.setAttribute('stroke-linecap', 'round');
    sep.setAttribute('mask', 'url(#trackSlotMask)');
    svg.appendChild(sep);
    alignAvailBlocksToSlots();
    queueFirstLevelOnboardingSync();
  });
}

// Legacy hook: board rendering is centralized in renderBoard().
function renderFn() {}

function drawTrack(svg, slotH, gapH, totalH, W, mainActive, fnActive) {
  svg.innerHTML = '';
  const pad = 8;
  const cR = gapH / 2 + 2;

  const y1 = slotH / 2;
  const y2 = slotH + gapH + slotH / 2;
  const y3 = 2 * (slotH + gapH) + slotH / 2;

  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  defs.innerHTML = `
    <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glowFn"><feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  svg.appendChild(defs);

  function path(d, lit, violet) {
    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d', d); p.setAttribute('fill','none');
    p.setAttribute('stroke', lit ? (violet ? 'rgba(124,58,237,0.75)' : 'rgba(60,210,160,0.7)') : (violet ? 'rgba(124,58,237,0.18)' : 'rgba(180,140,80,0.18)'));
    p.setAttribute('stroke-width','2'); p.setAttribute('stroke-linecap','round');
    if(lit) p.setAttribute('filter', violet ? 'url(#glowFn)' : 'url(#glow)');
    return p;
  }

  const m = mainActive; // active main slot index
  const f = fnActive;   // active fn slot index

  // ── main row 1 (→) ──
  svg.appendChild(path(`M ${pad} ${y1} H ${W-pad}`, m > 0, false));

  // ── main row 2 (→) ──
  svg.appendChild(path(`M ${pad} ${y2} H ${W-pad}`, m >= 4, false));

  // ── divisore sottile tra main e fn ──
  const ydiv = y2 + (y3 - y2) / 2;
  const divLine = document.createElementNS('http://www.w3.org/2000/svg','line');
  divLine.setAttribute('x1', '8'); divLine.setAttribute('x2', String(Math.max(8, W - 8)));
  divLine.setAttribute('y1', ydiv); divLine.setAttribute('y2', ydiv);
  divLine.setAttribute('stroke', 'rgba(77,182,255,0.92)');
  divLine.setAttribute('stroke-width', '2.6');
  divLine.setAttribute('stroke-dasharray', '9 6');
  divLine.setAttribute('stroke-linecap', 'round');
  svg.appendChild(divLine);

  // ── fn row (→) ──
  svg.appendChild(path(`M ${pad} ${y3} H ${W-pad}`, f >= 0, true));
}

// ═══ DRAG ═══
let dg = {active:false, block:null, src:null, si:null, hover:null, hoverValidKey:null};

function bindDrag(el, src, idx, sz) {
  el.addEventListener('touchstart',e=>{
    if(running) return; e.preventDefault(); e.stopPropagation();
    startDg(e.touches[0].clientX,e.touches[0].clientY,src,idx,sz);
  },{passive:false});
  el.addEventListener('touchmove', e=>{e.preventDefault();moveDg(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  el.addEventListener('touchend',  e=>{e.preventDefault();endDg(e.changedTouches[0].clientX,e.changedTouches[0].clientY);},{passive:false});
  el.addEventListener('mousedown',e=>{
    if(running) return; e.preventDefault();
    startDg(e.clientX,e.clientY,src,idx,sz);
    const mm=e=>moveDg(e.clientX,e.clientY);
    const mu=e=>{endDg(e.clientX,e.clientY);document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
    document.addEventListener('mousemove',mm);
    document.addEventListener('mouseup',mu);
  });
}

function startDg(cx,cy,src,idx,sz) {
  const block = src==='avail' ? avail[idx] : src==='fn' ? fnProg[idx] : prog[idx];
  if(!block) return;
  dg = {active:true, block, src, si:idx, hover:null, hoverValidKey:null};
  playBlockDragStartSfx();
  if(src==='avail') refreshAvailableBlockGlowState({ suspendForActiveDrag: true });
  const g = document.getElementById('ghost');
  g.innerHTML=''; g.appendChild(mkB(block,sz,sz));
  g.style.cssText=`display:block;width:${sz}px;height:${sz}px;left:${cx}px;top:${cy}px;border-radius:5px;`;
  if(src==='avail') {
    document.querySelectorAll('.ablock').forEach(el=>{
      if(+el.dataset.ai===idx) {
        el.style.opacity='0';
        el.classList.add('drag-source-hidden');
      }
    });
  } else {
    const zone = src==='fn' ? 'fn' : 'main';
    const s=document.querySelector(`.pslot[data-zone="${zone}"][data-slot="${idx}"] .sinner`);
    if(s) s.style.opacity='0.3';
  }
}

function getDragHoverValidSlotKey(slot) {
  if (!slot || !dg.active) return '';
  const ti = +slot.dataset.slot;
  const zone = slot.dataset.zone;
  if (zone === 'main') {
    if (!mainSlotEnabled[ti]) return '';
    if (dg.src === 'prog' && dg.si === ti) return '';
    return `main:${ti}`;
  }
  if (zone === 'fn') {
    if (!fnSlotEnabled[ti]) return '';
    if (dg.block?.dir === 'function') return '';
    if (dg.src === 'fn' && dg.si === ti) return '';
    return `fn:${ti}`;
  }
  return '';
}

const slotCaptureEffectTimers = new Map();

function triggerSlotCaptureEffect(zone, idx) {
  const slot = document.querySelector(`.pslot[data-zone="${zone}"][data-slot="${idx}"]`);
  if (!slot) return;
  const timerKey = `${zone}:${idx}`;
  const existingTimer = slotCaptureEffectTimers.get(timerKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
    slotCaptureEffectTimers.delete(timerKey);
  }
  slot.classList.remove('slot-capture');
  void slot.offsetWidth;
  slot.classList.add('slot-capture');
  const timer = setTimeout(() => {
    slot.classList.remove('slot-capture');
    slotCaptureEffectTimers.delete(timerKey);
  }, 420);
  slotCaptureEffectTimers.set(timerKey, timer);
}

function moveDg(cx,cy) {
  if(!dg.active) return;
  const g = document.getElementById('ghost');
  g.style.left=cx+'px'; g.style.top=cy+'px';
  g.style.display='none';
  const u=document.elementFromPoint(cx,cy);
  g.style.display='block';
  const slot=u?.closest('.pslot');
  const validHoverKey = getDragHoverValidSlotKey(slot);
  if(dg.hover&&dg.hover!==slot) dg.hover.classList.remove('over');
  if(slot){slot.classList.add('over');dg.hover=slot;} else dg.hover=null;
  if (validHoverKey && validHoverKey !== dg.hoverValidKey) playBlockHoverSlotSfx();
  dg.hoverValidKey = validHoverKey || null;
}

function endDg(cx,cy) {
  if(!dg.active) return;
  const hadPlacedProgramBlocks = hasAnyPlacedProgramBlock();
  let didDropSuccessfully = false;
  document.getElementById('ghost').style.display='none';
  if(dg.hover) dg.hover.classList.remove('over');
  document.querySelectorAll('.ablock,.pblock').forEach(e=>{
    e.style.opacity='1';
    e.classList.remove('drag-source-hidden');
  });
  document.querySelectorAll('.sinner').forEach(e=>e.style.opacity='1');
  const u=document.elementFromPoint(cx,cy);
  const slot=u?.closest('.pslot');
  if(slot) {
    const ti = +slot.dataset.slot;
    const zone = slot.dataset.zone;
    if(zone === 'main' && !mainSlotEnabled[ti]) {
      dg.active=false;
      renderAvail(); renderBoard(); renderFn();
      return;
    }
    if(zone === 'fn' && !fnSlotEnabled[ti]) {
      dg.active=false;
      renderAvail(); renderBoard(); renderFn();
      return;
    }
    if(zone === 'fn') {
      // blocchi function non possono stare nella fn zone
      if(dg.block.dir === 'function') { dg.active=false; renderAvail(); renderBoard(); renderFn(); return; }
      if(dg.src==='avail') { fnProg[ti]={id:`${dg.block.dir}${idN++}`,...POOL[dg.block.dir]}; didDropSuccessfully = true; }
      else if(dg.src==='fn'&&dg.si!==ti){ const tmp=fnProg[ti];fnProg[ti]=dg.block;fnProg[dg.si]=tmp; didDropSuccessfully = true; }
      else if(dg.src==='prog'){ fnProg[ti]={...dg.block}; prog[dg.si]=null; didDropSuccessfully = true; }
    } else {
      if(dg.src==='avail') { prog[ti]={id:`${dg.block.dir}${idN++}`,...POOL[dg.block.dir]}; didDropSuccessfully = true; }
      else if(dg.src==='prog'&&dg.si!==ti){ const tmp=prog[ti];prog[ti]=dg.block;prog[dg.si]=tmp; didDropSuccessfully = true; }
      else if(dg.src==='fn'){ prog[ti]={...dg.block}; fnProg[dg.si]=null; didDropSuccessfully = true; }
    }
    if (!hadPlacedProgramBlocks && zone === 'main' && prog[ti] && firstLevelOnboardingStage === 'drag') {
      advanceFirstLevelOnboardingToPlay();
    }
  } else {
    if(dg.src==='prog') prog[dg.si]=null;
    else if(dg.src==='fn') fnProg[dg.si]=null;
  }
  if (isFunctionTutorialStep() && !fnUnlockHintActive) {
    const firstFnForwardPlaced = fnProg.some(b => (b?.dir || b?.direction) === 'forward');
    if (firstFnForwardPlaced) fnUnlockHintActive = true;
  }
  if (didDropSuccessfully) playBlockDropSuccessSfx();
  dg.active=false;
  refreshAvailableBlockGlowState();
  renderAvail(); renderBoard(); renderFn();
  if (didDropSuccessfully && slot) triggerSlotCaptureEffect(slot.dataset.zone, +slot.dataset.slot);
  refreshEditorDebug();
}

// ═══ GAME LOGIC ═══
function hlSlot(i, zone='main') {
  if(zone === 'main') {
    document.querySelectorAll('.pslot[data-zone="main"]').forEach(s => s.classList.remove('active','done'));
    for(let j = 0; j < i; j++)
      document.querySelector(`.pslot[data-zone="main"][data-slot="${j}"]`)?.classList.add('done');
    document.querySelector(`.pslot[data-zone="main"][data-slot="${i}"]`)?.classList.add('active');
  } else {
    document.querySelectorAll('.pslot[data-zone="fn"]').forEach(s => s.classList.remove('fn-active','fn-done'));
    for(let j = 0; j < i; j++)
      document.querySelector(`.pslot[data-zone="fn"][data-slot="${j}"]`)?.classList.add('fn-done');
    document.querySelector(`.pslot[data-zone="fn"][data-slot="${i}"]`)?.classList.add('fn-active');
  }
  // no SVG track to redraw
}

function clearEmptyRunHintTimers() {
  emptyRunHintTimers.forEach(timer => clearTimeout(timer));
  emptyRunHintTimers = [];
  document.querySelectorAll('#blocksRow .ablock.empty-play-block-hint')
    .forEach(block => block.classList.remove('empty-play-block-hint'));
}

function triggerEmptyRunHint() {
  const now = Date.now();
  if (now - lastEmptyRunHintAt < 800) return;
  lastEmptyRunHintAt = now;
  clearEmptyRunHintTimers();

  const blocks = Array.from(document.querySelectorAll('#blocksRow .ablock'))
    .filter(block => !block.classList.contains('disabled'));
  if (!blocks.length) return;

  blocks.forEach((block, idx) => {
    const startMs = idx * 85;
    const startTimer = setTimeout(() => {
      block.classList.add('empty-play-block-hint');
    }, startMs);
    const endTimer = setTimeout(() => {
      block.classList.remove('empty-play-block-hint');
    }, startMs + 540);
    emptyRunHintTimers.push(startTimer, endTimer);
  });
}

async function moveChar(dir) {
  syncSprite();
  const activeCharacterId = resolveRuntimeCharacterId(getActiveCharacterId());
  const containerDriven = isContainerDrivenCharacter(activeCharacterId);
  if(dir==='forward') {
    playStepSfx();
    const p={...pos};
    if(ori==='up')        p.y=Math.max(0,p.y-1);
    else if(ori==='down') p.y=Math.min(ROWS-1,p.y+1);
    else if(ori==='left') p.x=Math.max(0,p.x-1);
    else                   p.x=Math.min(COLS-1,p.x+1);
    if (isBlockedCell(p.x, p.y)) {
      await sleep(120);
      return;
    }
    if (!containerDriven) {
      setCharacterAction('move');
      syncSprite();
    }
    await animTo(p.x,p.y);
    if (goalPlaced && p.x === GOAL.x && p.y === GOAL.y) {
      return;
    }
    await sleep(80);
  } else {
    playTurnSfx(dir);
    const previousOri = ori;
    const newOri = dir==='left'
      ? {up:'left',left:'down',down:'right',right:'up'}[ori]
      : {up:'right',right:'down',down:'left',left:'up'}[ori];
    if (!containerDriven) {
      setCharacterAction('turn');
      syncSprite({ direction: newOri, action: 'turn' });
      await nextFrame();
    } else {
      await nextFrame();
    }
    await animateTurnInterpolation(previousOri, newOri, TURN_MS);
    ori = newOri;
    if (!containerDriven) {
      setCharacterAction('idle');
    }
    syncSprite();
  }
}
async function run() {
  if(!gameStarted || running || animating) return;
  if (!playerPlaced || !goalPlaced) return;
  if (firstLevelOnboardingStage === 'play') completeFirstLevelOnboarding();
  const runStartState = editorMode ? { pos: { ...pos }, ori } : null;
  const runStartPrograms = editorMode ? {
    prog: prog.map(block => block ? { ...block } : null),
    fnProg: fnProg.map(block => block ? { ...block } : null)
  } : null;
  requestAppFullscreen();
  sizeGrid();
  drawBackground();
  syncSprite();
  await nextFrame();
  syncSprite();
  let last=-1;
  const activeMainIndexes = mainSlotEnabled
    .map((enabled, idx) => enabled ? idx : -1)
    .filter(idx => idx !== -1);
  const activeFnIndexes = fnSlotEnabled
    .map((enabled, idx) => enabled ? idx : -1)
    .filter(idx => idx !== -1);
  for (const i of activeMainIndexes) if (prog[i]) last = i;
  if(last===-1){
    triggerEmptyRunHint();
    return;
  }
  running=true;
  playRunPressSfx();
  const btn=document.getElementById('runBtn');
  btn.innerHTML = PAUSE_ICON_SVG;
  toast(''); await sleep(200);
  let won = false;

  for (const i of activeMainIndexes) {
    if (i > last) break;
    hlSlot(i, 'main'); await sleep(STEP_MS);
    if(prog[i]) {
      if(prog[i].dir === 'function') {
        // ── esegui sub-routine ──
        let fnLast = -1;
        for(const f of activeFnIndexes) if(fnProg[f]) fnLast=f;
        if(fnLast === -1) { await sleep(300); }
        else {
          for (const f of activeFnIndexes) {
            if (f > fnLast) break;
            hlSlot(f, 'fn'); await sleep(STEP_MS);
            if(fnProg[f]) {
              await moveChar(fnProg[f].dir||fnProg[f].direction);
              if(goalPlaced && pos.x===GOAL.x&&pos.y===GOAL.y) {
                won=true;
                break;
              }
              await sleep(STEP_MS);
            }
          }
          document.querySelectorAll('.pslot[data-zone="fn"]').forEach(s=>s.classList.remove('fn-active','fn-done'));
          if(won) break;
        }
      } else {
        await moveChar(prog[i].dir||prog[i].direction);
        if(goalPlaced && pos.x===GOAL.x&&pos.y===GOAL.y) {
          won=true;
          break;
        }
        await sleep(STEP_MS);
      }
    } else { await sleep(STEP_MS); }
  }

  document.querySelectorAll('.pslot[data-zone="main"]').forEach(s=>s.classList.remove('active','done'));
  document.querySelectorAll('.pslot[data-zone="fn"]').forEach(s=>s.classList.remove('fn-active','fn-done'));
  btn.classList.remove('running'); btn.innerHTML = PLAY_ICON_SVG; running=false;
  if (!editorMode) resetPrograms();

  if(won) {
    if (!currentCustomLevel && currentLevel === 'level1') {
      rememberCompletedCampaignLevel();
      const campaignLevels = getCampaignLevels();
      const isFinalCampaignLevel = campaignLevels.length > 0 && tutorialStepIndex >= campaignLevels.length - 1;
      await sleep(260);
      if (isFinalCampaignLevel) {
        await playEndingCinematic();
        returnToMainMenu();
        return;
      }
      const transitionAnchor = getWinBurstAnchor();
      await fadeTransition(1850, async () => {
        if (campaignLevels.length) {
          applyCampaignLevel((tutorialStepIndex + 1) % campaignLevels.length);
        } else {
          resetPrograms();
          initGrid();
          renderAvail();
          renderBoard(); renderFn();
          drawBackground();
          syncSprite();
          moveGoal();
        }
      }, transitionAnchor);
      return;
    }
    if (editorMode) {
      if (runStartPrograms) {
        prog = runStartPrograms.prog.map(block => block ? { ...block } : null);
        fnProg = runStartPrograms.fnProg.map(block => block ? { ...block } : null);
      }
      if (runStartState) {
        pos = { ...runStartState.pos };
        ori = runStartState.ori;
        syncSprite();
      }
      renderBoard(); renderFn();
      return;
    }
    resetPrograms();
    resetPlayerToStepStart();
    renderBoard(); renderFn();
  } else {
    playErrorSfx();
    await sleep(400);
    if (editorMode && runStartPrograms) {
      prog = runStartPrograms.prog.map(block => block ? { ...block } : null);
      fnProg = runStartPrograms.fnProg.map(block => block ? { ...block } : null);
    }
    if (editorMode && runStartState) {
      pos = { ...runStartState.pos };
      ori = runStartState.ori;
      syncSprite();
    } else {
      resetPlayerToStepStart();
    }
    renderBoard(); renderFn();
  }
}

// ═══ INIT ═══
async function init() {
  markPerfMetricStart('game-init');
  await loadEditorLevelsSource();
  syncViewportHeight();
  currentLevel = 'level1';
  setLevel('level1', { persist: false });
  document.getElementById('gridWrap').style.position = 'relative';
  if (!applyCampaignLevel(progressState.currentCampaignStep || 0)) {
    activeMainSlots = SLOTS;
    activeFnSlots = FSLOTS;
    setSlotMasks(activeMainSlots, activeFnSlots);
    setAvailableBlocks(['forward', 'right', 'left', 'function']);
    initGrid();
    renderAvail();
    renderBoard();
    renderFn();
  }

  requestAnimationFrame(() => requestAnimationFrame(() => {
    sizeGrid();
    requestAnimationFrame(() => {
      renderBoard();
      renderFn();
      drawBackground();
      syncSprite();
      setupSpriteDrag();
      startFpsProbe('initial-scene');
    });
  }));
  updateDebugBadge();
  refreshEditorValues();
  updateRunAvailability();
  markPerfMetricEnd('game-init', { type: 'startup' });
}

void init();

function showStartGate() {
  document.body.classList.add('prestart');
  document.getElementById('startGate')?.classList.add('show');
  queueFirstLevelOnboardingSync();
}
function dismissSplash() {
  const splash = document.getElementById('splash');
  if (!splash) {
    showStartGate();
    return;
  }
  showStartGate();
  splash.classList.add('hide');
  setTimeout(() => splash.remove(), 120);
}
function openAppFromGate({ openEditor = false, onOpen = null } = {}) {
  if (gameStarted) return;
  gameStarted = true;
  markPerfMetricStart('app-open-to-interactive');
  const shouldOpenEditor = LEVEL_EDITOR_ENABLED && openEditor;
  const shouldPlayLevelOneIntro = !shouldOpenEditor && !currentCustomLevel && currentLevel === 'level1';
  const gate = document.getElementById('startGate');
  const gateFadeMs = 1650;
  const backgroundHoldMs = 850;
  gate?.classList.add('hiding');
  requestAppFullscreen();
  if (shouldPlayLevelOneIntro) playLevelOneIntroAndQueueBgm();
  else {
    stopLevelOneIntro();
    clearLevelOneIntroBgmTimer();
    startBackgroundMusicLoop();
  }
  setTimeout(() => gate?.classList.remove('show', 'hiding'), gateFadeMs);
  setTimeout(() => {
    document.body.classList.remove('prestart');
    startAppSceneRevealWindow(4200);
    consumeHardRefreshNotice();
    if (onOpen) onOpen();
    else setEditorMode(shouldOpenEditor);
    syncFirstLevelOnboardingDelayForCurrentView();
    queueFirstLevelOnboardingSync();
    markPerfMetricEnd('app-open-to-interactive', { type: 'interactive', editor: shouldOpenEditor });
    startFpsProbe(shouldOpenEditor ? 'editor-open' : 'game-open');
  }, gateFadeMs + backgroundHoldMs);
}
function startGameFromGate() {
  openAppFromGate({ openEditor: false });
}
async function startEditorFromGate() {
  if (!LEVEL_EDITOR_ENABLED) return;
  await ensureEditorSupportLoaded();
  openAppFromGate({ openEditor: true });
}
function returnToMainMenu() {
  if (document.body.classList.contains('prestart')) return;
  if (running || animating) {
    toast('Aspetta che il movimento finisca');
    return;
  }
  closeSettingsPanel();
  closeSaveLevelModal();
  if (editorMode) exitEditorMode();
  setEditorStylePanelOpen(false);
  gameStarted = false;
  stopLevelOneIntro();
  pauseBackgroundMusicLoop();
  clearFirstLevelOnboardingDelay();
  clearAppSceneRevealWindow();
  const gate = document.getElementById('startGate');
  gate?.classList.remove('hiding');
  showStartGate();
  updateQuickEditorButton();
  queueFirstLevelOnboardingSync();
}
function openSpritePreviewTool() {
  const targetUrl = new URL('tools/sprite-preview.html', window.location.href).toString();
  const opened = window.open(targetUrl, '_blank', 'noopener');
  if (!opened) window.location.href = targetUrl;
}
function openLottieInspectorTool() {
  const targetUrl = new URL('tools/lottie-inspector.html', window.location.href).toString();
  const opened = window.open(targetUrl, '_blank', 'noopener');
  if (!opened) window.location.href = targetUrl;
}
function openVfxTool() {
  const targetUrl = new URL('tools/vfx-tool.html', window.location.href).toString();
  const opened = window.open(targetUrl, '_blank', 'noopener');
  if (!opened) window.location.href = targetUrl;
}
function toggleStyleEditorPanel() {
  if (!editorMode) return;
  setEditorStylePanelOpen(!editorStylePanelOpen);
}
function updateQuickEditorButton() {
  const btn = document.getElementById('quickEditorBtn');
  if (!btn) return;
  btn.textContent = editorMode ? 'Gioco' : 'Editor';
  btn.setAttribute(
    'aria-label',
    editorMode ? 'Torna al livello in gioco' : 'Apri editor con il livello corrente'
  );
}
async function toggleEditorFromCurrentLevel() {
  if (!LEVEL_EDITOR_ENABLED) return;
  if (editorMode) {
    exitEditorMode();
    return;
  }
  await enterEditorFromCurrentLevel();
}
async function enterEditorFromCurrentLevel() {
  if (!LEVEL_EDITOR_ENABLED) return;
  if (running || animating) {
    toast('Aspetta che il movimento finisca');
    return;
  }
  await ensureEditorSupportLoaded();
  closeSaveLevelModal();
  if (currentCustomLevel) {
    applyCustomLevel(currentCustomLevel, { openEditor: true });
    return;
  }
  if (currentLevel === 'level1') {
    const campaignLevel = findCustomLevel(getCampaignLevelIdForIndex(tutorialStepIndex));
    if (campaignLevel) {
      applyCustomLevel(campaignLevel, { openEditor: true });
      return;
    }
  }
  setEditorMode(true);
}
function exitEditorMode() {
  if (!editorMode || running || animating) return;
  closeSaveLevelModal();
  if (currentCustomLevel?.campaignIndex != null || currentCustomLevel?.baseStepIndex != null) {
    const stepIndex = currentCustomLevel.campaignIndex ?? currentCustomLevel.baseStepIndex;
    currentCustomLevel = null;
    currentLevel = 'level1';
    applyLevelSceneVars();
    setEditorMode(false);
    applyCampaignLevel(stepIndex);
    return;
  }
  if (currentCustomLevel) {
    applyCustomLevel(currentCustomLevel, { openEditor: false });
    return;
  }
  setEditorMode(false);
  if (getCampaignLevels().length) {
    applyCampaignLevel(tutorialStepIndex);
    return;
  }
  renderAvail();
  renderBoard();
  renderFn();
  drawBackground();
  syncSprite();
  updateDebugBadge();
}

// ── Splash dismiss ──
setTimeout(dismissSplash, 0);

// tap to skip
document.getElementById('startGameBtn')?.addEventListener('click', startGameFromGate);
document.getElementById('startEditorBtn')?.addEventListener('click', startEditorFromGate);
document.getElementById('openSpritePreviewBtn')?.addEventListener('click', openSpritePreviewTool);
document.getElementById('openVfxToolBtn')?.addEventListener('click', openVfxTool);
document.getElementById('openLottieInspectorBtn')?.addEventListener('click', openLottieInspectorTool);
document.getElementById('openLottieInspectorBtnEditor')?.addEventListener('click', openLottieInspectorTool);
document.getElementById('header')?.addEventListener('click', toggleSettingsPanel);
document.getElementById('header')?.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  toggleSettingsPanel();
});
document.getElementById('closeSettingsBtn')?.addEventListener('click', closeSettingsPanel);
document.getElementById('settingsSfxBtn')?.addEventListener('click', () => setSoundEffectsEnabled(!soundEffectsEnabled));
document.getElementById('settingsMusicVolume')?.addEventListener('input', e => {
  const nextValue = Number(e.target?.value);
  setBackgroundMusicVolume(nextValue / 100);
});
document.getElementById('settingsLanguageBtn')?.addEventListener('click', openLanguageComingSoonNotice);
document.getElementById('settingsCreditsBtn')?.addEventListener('click', toggleSettingsCredits);
document.getElementById('settingsResetProgressBtn')?.addEventListener('click', toggleResetProgressPanel);
document.getElementById('cancelResetProgressBtn')?.addEventListener('click', toggleResetProgressPanel);
document.getElementById('confirmResetProgressBtn')?.addEventListener('click', resetJourneyProgress);
document.getElementById('settingsMenuBtn')?.addEventListener('click', goToMainMenuFromSettings);
document.getElementById('settingsModal')?.addEventListener('click', e => {
  if (e.target?.id === 'settingsModal' || e.target?.classList?.contains('settings-shell')) closeSettingsPanel();
});
document.getElementById('quickEditorBtn')?.addEventListener('click', toggleEditorFromCurrentLevel);
document.getElementById('saveLevelBtn')?.addEventListener('click', openSaveLevelModal);
document.getElementById('openStyleEditorBtn')?.addEventListener('click', toggleStyleEditorPanel);
document.getElementById('openVfxEditorBtn')?.addEventListener('click', openVfxTool);
document.getElementById('closeStyleEditorBtn')?.addEventListener('click', () => setEditorStylePanelOpen(false));
document.getElementById('applyThemeStyleBtn')?.addEventListener('click', () => { void applyCurrentStyleToSelectedLevel(); });
document.getElementById('resetThemeColorsBtn')?.addEventListener('click', resetCurrentEditorThemeOverrides);
document.getElementById('saveStylePresetBtn')?.addEventListener('click', saveCurrentStylePreset);
document.getElementById('stylePresetNameInput')?.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  saveCurrentStylePreset();
});
document.getElementById('exportLevelsBtn')?.addEventListener('click', exportEditorLevels);
document.getElementById('importLevelsBtn')?.addEventListener('click', openImportLevelsPicker);
document.getElementById('resetLevelsBtn')?.addEventListener('click', resetEditorLevels);
document.getElementById('exitEditorBtn')?.addEventListener('click', exitEditorMode);
document.getElementById('cancelSaveLevelBtn')?.addEventListener('click', closeSaveLevelModal);
document.getElementById('confirmSaveLevelBtn')?.addEventListener('click', saveCurrentEditorLevel);
document.getElementById('importLevelsInput')?.addEventListener('change', async e => {
  const file = e.target?.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    await importEditorLevelsFromText(text);
  } catch (_err) {
    toast('Impossibile leggere il file');
  }
});
document.getElementById('saveLevelModal')?.addEventListener('click', e => {
  if (e.target?.id === 'saveLevelModal') closeSaveLevelModal();
});
document.getElementById('levelNameInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveCurrentEditorLevel();
});
document.addEventListener('keydown', e => {
  const tag = e.target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
  const key = (e.key || '').toLowerCase();
  if (key === 'escape') {
    if (settingsOpen) {
      closeSettingsPanel();
      return;
    }
    if (editorStylePanelOpen) {
      setEditorStylePanelOpen(false);
      return;
    }
    closeSaveLevelModal();
    return;
  }
  if (key === 'e' && !document.body.classList.contains('prestart')) {
    e.preventDefault();
    toggleEditorFromCurrentLevel();
    return;
  }
  if (key === 'l') {
    toggleDebugBadge();
    return;
  }
  if (key === 'a') {
    e.preventDefault();
    toggleAnimationDebugBadge();
    return;
  }
  if (e.key === 'ArrowRight') {
    debugStepJump(1);
    return;
  }
  if (e.key === 'ArrowLeft') {
    debugStepJump(-1);
  }
});

updateQuickEditorButton();
updateStyleEditorButtons();
syncSettingsPanelUi();
window.BOKS_PREVIEW_ENDING = () => previewEndingCinematic();

let sceneRefreshRaf = 0;
function scheduleSceneRefresh({ syncOnboarding = true, label = 'scene-refresh' } = {}) {
  if (sceneRefreshRaf) return;
  sceneRefreshRaf = requestAnimationFrame(() => {
    sceneRefreshRaf = 0;
    syncViewportHeight();
    renderAvail();
    sizeGrid();
    renderBoard();
    renderFn();
    drawBackground();
    syncSprite();
    refreshEditorDebug();
    if (syncOnboarding) {
      syncFirstLevelOnboardingDelayForCurrentView();
      queueFirstLevelOnboardingSync();
    }
    startFpsProbe(label);
  });
}

function refreshSceneAfterAppResume() {
  ensureGoalIdleCanvasLoop();
  renderGridDecorations();
  scheduleSceneRefresh({ label: 'resume' });
}

// ri-entra in fullscreen se l'utente torna sull'app (es. dopo notifica)
document.addEventListener('visibilitychange', () => {
  appSceneVisible = document.visibilityState === 'visible';
  if (appSceneVisible) {
    if (gameStarted) {
      resumeBackgroundMusicLoop();
      requestAppFullscreen();
    }
    ensureGoalIdleCanvasLoop();
    renderGridDecorations();
    refreshSceneAfterAppResume();
  } else {
    stopFpsProbe();
    stopBeeDecorationLoop();
    if (goalIdleCanvasFrame) {
      cancelAnimationFrame(goalIdleCanvasFrame);
      goalIdleCanvasFrame = null;
    }
    pauseBackgroundMusicLoop();
  }
});
window.addEventListener('pageshow', () => {
  refreshSceneAfterAppResume();
});
window.addEventListener('resize', () => {
  scheduleSceneRefresh({ syncOnboarding: true, label: 'resize' });
});
window.visualViewport?.addEventListener('resize', () => scheduleSceneRefresh({ syncOnboarding: false, label: 'viewport' }));
window.visualViewport?.addEventListener('scroll', () => scheduleSceneRefresh({ syncOnboarding: false, label: 'viewport' }));
window.addEventListener('orientationchange', () => scheduleSceneRefresh({ syncOnboarding: true, label: 'orientation' }));
