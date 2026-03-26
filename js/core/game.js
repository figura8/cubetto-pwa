// ═══ CONSTANTS ═══
const COLS = 6, ROWS = 6, SLOTS = 8, FSLOTS = 4;
let GOAL = {x:5,y:5};
let START = {x:2,y:2};

function moveGoal() {
  const old = document.querySelector('.goal-cell');
  if(old) { old.classList.remove('goal-cell'); old.innerHTML = ''; old.style.position=''; old.style.overflow=''; }
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
  const cell = document.querySelector(`.cell[data-cx="${nx}"][data-cy="${ny}"]`);
  if(cell) {
    cell.classList.remove(...DECOR_CLASSES);
    cell.classList.add('goal-cell');
    cell.innerHTML = goalSVG();
    cell.style.position = 'relative';
    cell.style.overflow = 'hidden';
  }
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
const EDITOR_LEVELS_FILE_PATH = './data/editor-levels.json';
const EDITOR_LEVELS_FILE_PICKER_SUGGESTED_NAME = 'editor-levels.json';
const FILE_HANDLE_DB_NAME = 'boks-file-handles';
const FILE_HANDLE_STORE_NAME = 'handles';
const EDITOR_LEVELS_FILE_HANDLE_KEY = 'editor-levels-project-file';
const CUSTOM_LEVEL_THEME = 'level1';
const CUSTOM_ICONS = ['leaf', 'star', 'turtle', 'sun', 'moon', 'flower'];
const DEFAULT_CHARACTER_ID = 'boks_black';
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
const RUNTIME_CONFIG = window.BOKS_RUNTIME_CONFIG || {};
const LEVEL_EDITOR_ENABLED = RUNTIME_CONFIG.editorEnabled !== false;
const DEBUG_TOOLS_ENABLED = RUNTIME_CONFIG.debugToolsEnabled !== false;

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
let animationDebugVisible = true;
let editorMode = false;
let currentCustomLevel = null;
let tutorialSceneLevelId = CUSTOM_LEVEL_THEME;
let selectedSaveIcon = CUSTOM_ICONS[0];
let lastEditorSolutionCount = 0;
let selectedEditorLevelId = null;
let draggingEditorLevelId = null;
const NEW_EDITOR_LEVEL_ID = '__new_editor_level__';
let playerPlaced = true;
let goalPlaced = true;
let selectedElementTool = null;
let editorStylePanelOpen = false;
let pendingNewLevelThemeOverrides = {};
let pendingNewLevelCharacterId = DEFAULT_CHARACTER_ID;
let emptyRunHintTimers = [];
let lastEmptyRunHintAt = 0;
document.body?.classList.add('prestart');
if (DEBUG_TOOLS_ENABLED) document.body?.classList.add('debug-visible');
if (animationDebugVisible) document.body?.classList.add('animation-debug-visible');
if (animationDebugVisible) requestAnimationFrame(() => updateAnimationDebugBadge());

// ═══ UTILS ═══
const sleep = ms => new Promise(r => setTimeout(r, ms));
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
let fxAc;
let bgmBus;
let bgmTicker = null;
let bgmStarted = false;
let bgmStep = 0;
let bgmNextNoteTime = 0;
const BGM_TARGET_GAIN = 0.02;
const FX = () => {
  if (!fxAc) fxAc = new (window.AudioContext || window.webkitAudioContext)();
  if (fxAc.state === 'suspended') fxAc.resume();
  return fxAc;
};
const BGM_TEMPO = 104;
const BGM_STEP = (60 / BGM_TEMPO) / 2;
const BGM_CHORDS = [
  [57, 64, 69, 72], // A minor
  [53, 60, 65, 69], // F major
  [55, 62, 67, 71], // G major
  [52, 59, 64, 67]  // E minor
];
const BGM_ARP = [0, 1, 2, 1, 3, 2, 1, 2];
const midiToFreq = midi => 440 * Math.pow(2, (midi - 69) / 12);
function getBgmBus() {
  if (bgmBus) return bgmBus;
  const c = FX();
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -30;
  comp.knee.value = 8;
  comp.ratio.value = 3;
  comp.attack.value = 0.006;
  comp.release.value = 0.18;
  bgmBus = c.createGain();
  bgmBus.gain.value = 0.0001;
  bgmBus.connect(comp);
  comp.connect(c.destination);
  return bgmBus;
}
function fadeInPizzicatoBgm(ms = 2200) {
  const c = FX();
  const bus = getBgmBus();
  const t = c.currentTime;
  const now = Math.max(0.0001, bus.gain.value);
  bus.gain.cancelScheduledValues(t);
  bus.gain.setValueAtTime(now, t);
  bus.gain.exponentialRampToValueAtTime(BGM_TARGET_GAIN, t + (ms / 1000));
}
function playPizzicatoNote(time, midi, accent = false) {
  const c = FX();
  const f = midiToFreq(midi);

  const osc1 = c.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(f, time);
  osc1.frequency.exponentialRampToValueAtTime(f * 0.995, time + 0.18);

  const osc2 = c.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(f * 2, time);
  osc2.detune.setValueAtTime(4, time);

  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(5200, time);
  lp.frequency.exponentialRampToValueAtTime(1200, time + 0.2);

  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(170, time);

  const amp = c.createGain();
  const peak = accent ? 0.095 : 0.062;
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(peak, time + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);

  osc1.connect(lp);
  osc2.connect(lp);
  lp.connect(hp);
  hp.connect(amp);
  amp.connect(getBgmBus());

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + 0.27);
  osc2.stop(time + 0.27);
}
function scheduleBgmStep(step, time) {
  const chord = BGM_CHORDS[Math.floor(step / 8) % BGM_CHORDS.length];
  const pos = step % 8;
  const accent = pos === 0 || pos === 4;

  playPizzicatoNote(time + 0.002, chord[BGM_ARP[pos]], accent);
  if (accent) playPizzicatoNote(time + 0.008, chord[0] - 12, true);
  if (pos === 2 || pos === 6) playPizzicatoNote(time + 0.014, chord[2] + 12, false);
}
function scheduleBgmLookahead() {
  const c = FX();
  while (bgmNextNoteTime < c.currentTime + 0.24) {
    scheduleBgmStep(bgmStep, bgmNextNoteTime);
    bgmNextNoteTime += BGM_STEP;
    bgmStep = (bgmStep + 1) % (BGM_CHORDS.length * 8);
  }
}
function startPizzicatoBgm() {
  if (bgmStarted) return;
  bgmStarted = true;
  const c = FX();
  getBgmBus();
  bgmStep = 0;
  bgmNextNoteTime = c.currentTime + 0.05;
  scheduleBgmLookahead();
  bgmTicker = setInterval(scheduleBgmLookahead, 70);
}
function pausePizzicatoBgm() {
  if (!bgmTicker) return;
  clearInterval(bgmTicker);
  bgmTicker = null;
}
function resumePizzicatoBgm() {
  if (!bgmStarted || bgmTicker) return;
  const c = FX();
  bgmNextNoteTime = c.currentTime + 0.05;
  bgmTicker = setInterval(scheduleBgmLookahead, 70);
  fadeInPizzicatoBgm(800);
}
function playLevelTransitionSfx() {
  try {
    const c = FX();
    const notes = [740, 988, 1319];
    notes.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, c.currentTime + i * 0.09);
      g.gain.setValueAtTime(0.0001, c.currentTime + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.08, c.currentTime + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + i * 0.09 + 0.22);
      o.connect(g); g.connect(c.destination);
      o.start(c.currentTime + i * 0.09);
      o.stop(c.currentTime + i * 0.09 + 0.25);
    });
  } catch (_) {}
}
function playWinSfx() {
  try {
    const c = FX();
    const t = c.currentTime;
    const notes = [784, 988, 1175, 1568];
    notes.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      const lp = c.createBiquadFilter();
      o.type = i % 2 === 0 ? 'triangle' : 'square';
      o.frequency.setValueAtTime(f, t + i * 0.07);
      o.frequency.exponentialRampToValueAtTime(f * 1.012, t + i * 0.07 + 0.12);
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2200 + i * 180, t + i * 0.07);
      g.gain.setValueAtTime(0.0001, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.06, t + i * 0.07 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.24);
      o.connect(lp);
      lp.connect(g);
      g.connect(c.destination);
      o.start(t + i * 0.07);
      o.stop(t + i * 0.07 + 0.26);
    });
  } catch (_) {}
}
function playRunPressSfx() {
  try {
    const c = FX();
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + 0.14);
  } catch (_) {}
}
function playStepSfx() {
  try {
    const c = FX();
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    const lp = c.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.setValueAtTime(185, t);
    o.frequency.exponentialRampToValueAtTime(132, t + 0.08);
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1100, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.042, t + 0.007);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(lp);
    lp.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + 0.12);
  } catch (_) {}
}
function playTurnSfx(dir = 'right') {
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
async function fadeTransition(ms = 560) {
  const fade = document.getElementById('levelFade');
  if (!fade) { await sleep(ms); return; }
  fade.classList.add('show');
  await sleep(ms);
  fade.classList.remove('show');
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
  startPizzicatoBgm();
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
  return el;
}

// ═══ GRID ═══
function initGrid() {
  const g = document.getElementById('gameGrid');
  g.innerHTML = '';
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
      c.innerHTML = goalSVG();
      c.style.position = 'relative';
      c.style.overflow = 'hidden';
    }
    g.appendChild(c);
  }
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
}

// ═══ SPRITE ═══

function cellPos(x, y) {
  const cell = document.querySelector(`.cell[data-cx="${x}"][data-cy="${y}"]`);
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
  const characterId = resolveCharacterId(overrides.characterId || getActiveCharacterId());
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
  // Evita che un transform inline lasciato da WAAPI/commitStyles blocchi la rotazione via CSS var.
  spriteEl.style.removeProperty('transform');
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
    updateAnimationDebugBadge();
    return;
  }
  if (!playerPlaced) {
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
    updateAnimationDebugBadge();
    return;
  }
  const markup = svgRobot(renderState);
  if (!markup) {
    clearSpriteSwapTimer(s);
    window.BOKS_CHARACTER_RENDERER?.destroyIn?.(s);
    delete s.dataset.heroRenderToken;
    s.innerHTML = '';
    updateAnimationDebugBadge();
    return;
  }
  const preservePlayback = renderInfo?.resolved?.state?.restartPlayback !== true;
  applySpriteMarkup(s, markup, renderToken, { animate: true, preservePlayback });
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
  const activeCharacterId = resolveCharacterId(getActiveCharacterId());
  if (isContainerDrivenCharacter(activeCharacterId)) {
    const spriteEl = document.getElementById('sprite');
    if (!spriteEl) {
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
    const turnAnim = spriteEl.animate(
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
  const a = s.animate(
    [{left:sfr.l+'px',top:sfr.t+'px'},{left:sto.l+'px',top:sto.t+'px'}],
    {duration:MOVE_MS, easing:'cubic-bezier(.2,.9,.2,1)', fill:'forwards'}
  );
  await a.finished.catch(()=>{});
  if (typeof a.commitStyles === 'function') {
    try { a.commitStyles(); } catch (_) {}
  }
  s.style.left=sto.l+'px'; s.style.top=sto.t+'px';
  a.cancel();
  pos={x:tx,y:ty};
  setCharacterAction('idle');
  syncSprite();
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
    refreshEditorDebug();
  }
  s.addEventListener('touchstart',e=>{
    e.preventDefault(); e.stopPropagation();
    const t=e.touches[0]; if(!start(t.clientX,t.clientY)) return;
    const mm=e=>{e.preventDefault();move(e.touches[0].clientX,e.touches[0].clientY);};
    const mu=e=>{e.preventDefault();end(e.changedTouches[0].clientX,e.changedTouches[0].clientY);s.removeEventListener('touchmove',mm);s.removeEventListener('touchend',mu);};
    s.addEventListener('touchmove',mm,{passive:false});
    s.addEventListener('touchend',mu,{passive:false});
  },{passive:false});
  s.addEventListener('mousedown',e=>{
    e.preventDefault(); if(!start(e.clientX,e.clientY)) return;
    const mm=e=>move(e.clientX,e.clientY);
    const mu=e=>{end(e.clientX,e.clientY);document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
    document.addEventListener('mousemove',mm);
    document.addEventListener('mouseup',mu);
  });
}

function setupGoalDrag() {
  levelEditor.setupGoalDrag();
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
  const ids = Object.keys(getCharacterDefs()).filter(id => typeof id === 'string' && id.trim());
  if (!ids.includes(DEFAULT_CHARACTER_ID)) ids.unshift(DEFAULT_CHARACTER_ID);
  return [...new Set(ids)];
}

function resolveCharacterId(characterId) {
  const raw = typeof characterId === 'string' ? characterId.trim() : '';
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
    turtle: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><ellipse cx="24" cy="24" rx="12" ry="10" fill="#97dd75" stroke="#58a44a" stroke-width="2"/><circle cx="37" cy="24" r="4" fill="#97dd75" stroke="#58a44a" stroke-width="2"/><circle cx="18" cy="15" r="2.2" fill="#58a44a"/><circle cx="30" cy="15" r="2.2" fill="#58a44a"/><circle cx="17" cy="34" r="2.5" fill="#58a44a"/><circle cx="31" cy="34" r="2.5" fill="#58a44a"/></svg>',
    sun: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><circle cx="24" cy="24" r="9" fill="#ffcf40" stroke="#d79a14" stroke-width="2"/><g stroke="#d79a14" stroke-width="2.5" stroke-linecap="round"><path d="M24 5v7"/><path d="M24 36v7"/><path d="M5 24h7"/><path d="M36 24h7"/><path d="m10 10 5 5"/><path d="m33 33 5 5"/><path d="m38 10-5 5"/><path d="m15 33-5 5"/></g></svg>',
    moon: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><path d="M31 7c-8 2-14 10-14 19 0 6 3 11 8 14-9 1-18-6-18-16C7 14 16 6 27 6c1 0 3 0 4 1Z" fill="#7ea6df" stroke="#4f78b8" stroke-width="2"/></svg>',
    flower: '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><circle cx="24" cy="24" r="4.5" fill="#f5c542"/><circle cx="24" cy="13" r="6" fill="#ffb3c8"/><circle cx="35" cy="24" r="6" fill="#ffd79d"/><circle cx="24" cy="35" r="6" fill="#d2f0ff"/><circle cx="13" cy="24" r="6" fill="#fff0a8"/></svg>'
  };
  return icons[icon] || icons.leaf;
}

function elementPaletteIcon(type) {
  if (type === 'player') {
    return customIconSVG('turtle').replace('width="24" height="24"', 'width="38" height="38"');
  }
  if (type === 'goal') {
    return '<svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true"><path d="M39 9C26 10 13 18 11 31c-1 7 6 10 12 8 10-2 18-14 16-30Z" fill="#71c85f" stroke="#3f8c33" stroke-width="2"/><path d="M16 32c6-4 12-10 18-18" fill="none" stroke="#3f8c33" stroke-width="2.2" stroke-linecap="round"/></svg>';
  }
  return '<svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true"><rect x="10" y="12" width="28" height="22" rx="5" fill="#c8a271" stroke="#8c6744" stroke-width="2.2"/><path d="M13 20h22M13 26h22" stroke="#8c6744" stroke-width="2" stroke-linecap="round" opacity="0.65"/></svg>';
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

function setCurrentEditorThemeOverrides(overrides) {
  const normalized = sanitizeThemeOverrides(overrides);
  if (currentCustomLevel) {
    currentCustomLevel.themeOverrides = normalized;
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
    baseStepIndex: selectedLevel.baseStepIndex,
    name: selectedLevel.name,
    themeOverrides: normalized
  });
  return true;
}

function resetCurrentEditorThemeOverrides() {
  if (!setCurrentEditorThemeOverrides({})) return;
  applyLevelSceneVars();
  renderThemeEditorPanel();
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
    themeOverrides: getCurrentEditorThemeOverrides()
  });
  levels[idx] = updated;
  const persistResult = await persistEditorLevels(levels, { promptIfMissing: true });

  if (currentCustomLevel && currentCustomLevel.id === updated.id) {
    currentCustomLevel = cloneCustomLevel({
      ...currentCustomLevel,
      baseLevel: updated.baseLevel,
      characterId: updated.characterId,
      themeOverrides: updated.themeOverrides
    });
    applyLevelSceneVars();
    applyEditorBoardChanges();
  } else {
    applyLevelSceneVars();
  }
  renderCustomLevels();
  renderThemeEditorPanel();
  toast(persistResult.projectFileSaved
    ? 'Stile applicato e salvato nel progetto'
    : 'Stile applicato in questa sessione');
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
    const stepLevel = findCustomLevel(getEditorLevelIdForTutorialStep(tutorialStepIndex));
    if (stepLevel?.characterId) return resolveCharacterId(stepLevel.characterId);
    const step = getCurrentTutorialStep();
    if (step?.characterId) return resolveCharacterId(step.characterId);
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
    baseStepIndex: selectedLevel.baseStepIndex,
    name: selectedLevel.name,
    characterId: resolved
  });
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
        baseStepIndex: selectedLevel.baseStepIndex,
        name: selectedLevel.name,
        baseLevel: resolved
      });
      changed = true;
    }
  }
  if (!changed) return;
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
  const goalMarkup = level.goal
    ? `<circle cx="${goalX}" cy="${goalY}" r="${cell * 0.24}" fill="${goalFill}" stroke="${goalStroke}" stroke-width="2"/>`
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
  customIcons: CUSTOM_ICONS,
  customLevelTheme: CUSTOM_LEVEL_THEME,
  editorLevelsFileHandleKey: EDITOR_LEVELS_FILE_HANDLE_KEY,
  editorLevelsFilePath: EDITOR_LEVELS_FILE_PATH,
  editorLevelsStorageKey: EDITOR_LEVELS_STORAGE_KEY,
  editorLevelsSuggestedName: EDITOR_LEVELS_FILE_PICKER_SUGGESTED_NAME,
  fileHandleDbName: FILE_HANDLE_DB_NAME,
  fileHandleStoreName: FILE_HANDLE_STORE_NAME,
  fnSlots: FSLOTS,
  getOfficialTutorialSteps,
  getTutorialStepIndex: () => tutorialStepIndex,
  pool: POOL,
  resolveCharacterId,
  slots: SLOTS
});

function readCustomLevels() {
  return levelStorage.readCustomLevels();
}

function writeCustomLevels(levels) {
  return levelStorage.writeCustomLevels(levels);
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

function normalizeCustomLevel(level) {
  return levelStorage.normalizeCustomLevel(level);
}

function findCustomLevel(levelId) {
  return levelStorage.findCustomLevel(levelId);
}

function getEditorLevelIdForTutorialStep(idx = tutorialStepIndex) {
  return levelStorage.getEditorLevelIdForTutorialStep(idx);
}

function tutorialStepToEditorLevel(step, idx) {
  return levelStorage.tutorialStepToEditorLevel(step, idx);
}

function editorLevelToTutorialStep(level) {
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
      applyTutorialStep(tutorialStepIndex);
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
    applyTutorialStep(tutorialStepIndex);
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
  toast(persistResult.projectFileSaved
    ? `Importati ${normalizedLevels.length} livelli nel progetto`
    : `Importati ${normalizedLevels.length} livelli solo in questa sessione`);
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
    preferredLevelId: getEditorLevelIdForTutorialStep(0)
  });
  toast(persistResult.projectFileSaved
    ? 'Livelli originali ripristinati nel progetto'
    : 'Livelli originali ripristinati solo in questa sessione');
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
function getOfficialTutorialSteps() {
  return LEVELS.level1?.tutorialSteps || [];
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
    const stepLevel = findCustomLevel(getEditorLevelIdForTutorialStep(tutorialStepIndex));
    activeOverrides = sanitizeThemeOverrides(stepLevel?.themeOverrides || {});
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
      character: resolveCharacterId(getActiveCharacterId()),
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
    character: hero.dataset.character || resolveCharacterId(getActiveCharacterId()),
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
  const steps = getTutorialSteps();
  if (steps.length) {
    badge.textContent = `${lv?.name || currentLevel} | Step ${tutorialStepIndex + 1}/${steps.length}`;
    return;
  }
  badge.textContent = `${lv?.name || currentLevel} | Single level`;
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
  const steps = getTutorialSteps();
  if (!steps.length) return;
  applyTutorialStep(tutorialStepIndex + delta);
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
}
function setAvailableBlocks(blocks = ['forward', 'right', 'left']) {
  avail.length = 0;
  blocks.forEach((dir, i) => {
    if (!POOL[dir]) return;
    avail.push({ id: `${dir}${idN + i}`, ...POOL[dir] });
  });
  idN += blocks.length;
}
const editorSolver = window.BOKS_EDITOR_SOLVER({
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
const levelEditor = window.BOKS_LEVEL_EDITOR({
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
function countEnabledMainSlots() {
  return editorSolver.countEnabledMainSlots();
}

function countEnabledFnSlots() {
  return editorSolver.countEnabledFnSlots();
}

function refreshEditorValues() {
  editorSolver.refreshEditorValues();
}

function countEditorSolutions() {
  if (!playerPlaced || !goalPlaced) return 0;
  return editorSolver.countEditorSolutions();
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
  levelEditor.syncEditorAvailableBlocks();
}

function toggleEditorBlock(dir) {
  levelEditor.toggleEditorBlock(dir);
}

function setEditorMode(enabled) {
  if (!LEVEL_EDITOR_ENABLED && enabled) return;
  levelEditor.setEditorMode(enabled);
  if (enabled) {
    setEditorStylePanelOpen(editorStylePanelOpen);
    refreshEditorDebug();
  } else {
    setEditorStylePanelOpen(false);
    selectedElementTool = null;
    lastEditorSolutionCount = 0;
    updateRunAvailability();
    renderElementPalette();
  }
  updateQuickEditorButton();
}

function toggleEditorSlot(zone, idx) {
  levelEditor.toggleEditorSlot(zone, idx);
}
function getTutorialSteps() {
  if (currentCustomLevel) return [];
  if (currentLevel === 'level1') {
    return readCustomLevels().map(editorLevelToTutorialStep);
  }
  const lv = getLevel();
  return lv?.tutorialSteps || [];
}
function getCurrentTutorialStep() {
  const steps = getTutorialSteps();
  if (!steps.length) return null;
  return steps[tutorialStepIndex] || null;
}
function isFunctionTutorialStep() {
  const step = getCurrentTutorialStep();
  if (!step) return false;
  const blocks = step.availableBlocks || [];
  return (step.fnSlots || 0) > 0 && blocks.includes('function');
}
function resetPlayerToStepStart() {
  const step = getCurrentTutorialStep();
  pos = { ...START };
  ori = currentCustomLevel?.startOri || step?.startOri || 'right';
  resetSpritePresentation();
  syncSprite();
}
function applyTutorialStep(idx = 0) {
  const steps = getTutorialSteps();
  if (!steps.length) return false;
  tutorialStepIndex = ((idx % steps.length) + steps.length) % steps.length;
  selectedEditorLevelId = getEditorLevelIdForTutorialStep(tutorialStepIndex);
  const step = steps[tutorialStepIndex];
  tutorialSceneLevelId = resolveThemeLevelId(step.baseLevel);
  applyLevelSceneVars();
  activeMainSlots = Math.max(0, Math.min(SLOTS, step.mainSlots ?? SLOTS));
  activeFnSlots = Math.max(0, Math.min(FSLOTS, step.fnSlots ?? 0));
  setSlotMasks(activeMainSlots, activeFnSlots);
  fnUnlockHintActive = false;
  stepStartHintActive = true;
  selectedElementTool = null;
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
  updateDebugBadge();
  renderElementPalette();
  return true;
}

function applyCustomLevel(level, { openEditor = false } = {}) {
  const normalized = normalizeCustomLevel(level);
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
  stepStartHintActive = false;
  selectedElementTool = null;
  mainSlotEnabled = normalizeSlotArray(normalized.mainSlotEnabled, SLOTS);
  fnSlotEnabled = normalizeSlotArray(normalized.fnSlotEnabled, FSLOTS);
  editorBlockEnabled = normalizeEnabledBlocks(normalized.enabledBlocks);
  refreshEditorValues();
  setBlockedCells(normalized.obstacles || []);
  resetPrograms();
  setAvailableBlocks(Object.keys(editorBlockEnabled).filter(dir => editorBlockEnabled[dir]));
  editorMode = !!openEditor;
  if (!editorMode) editorStylePanelOpen = false;
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
}

function collectCurrentEditorLevel() {
  return normalizeCustomLevel({
    id: currentCustomLevel?.id || selectedEditorLevelId || `custom-${Date.now()}`,
    number: currentCustomLevel?.number ?? null,
    baseStepIndex: currentCustomLevel?.baseStepIndex ?? null,
    name: currentCustomLevel?.name || 'Livello custom',
    icon: currentCustomLevel?.icon || selectedSaveIcon,
    baseLevel: getCurrentEditorThemeId(),
    characterId: getCurrentEditorCharacterId(),
    start: playerPlaced ? { ...pos } : null,
    goal: goalPlaced ? { ...GOAL } : null,
    startOri: ori,
    obstacles: parseBlockedCellsToArray(),
    mainSlotEnabled: [...mainSlotEnabled],
    fnSlotEnabled: [...fnSlotEnabled],
    enabledBlocks: { ...editorBlockEnabled },
    themeOverrides: getCurrentEditorThemeOverrides()
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

  const orientationTitle = document.createElement('div');
  orientationTitle.className = 'editor-setup-title';
  orientationTitle.textContent = 'Orientamento iniziale';
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
      refreshEditorDebug();
    });
    orientationGrid.appendChild(btn);
  });
  card.appendChild(orientationGrid);

  const characterTitle = document.createElement('div');
  characterTitle.className = 'editor-setup-title';
  characterTitle.textContent = 'Personaggio test';
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
      label: 'Giocatore',
      present: playerPlaced,
      hint: playerPlaced ? 'Presente: sposta o tocca per rimuovere' : 'Tocca e piazza sulla griglia'
    },
    {
      key: 'goal',
      label: 'Foglia',
      present: goalPlaced,
      hint: goalPlaced ? 'Presente: sposta o tocca per rimuovere' : 'Tocca e piazza sulla griglia'
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
    btn.innerHTML = `
      <span class="element-tool-icon">${elementPaletteIcon(tool.key)}</span>
      <span class="element-tool-label">${tool.label}</span>
      <span class="element-tool-status">${tool.key === 'brick' ? 'TOGGLE' : (tool.present ? 'PRESENTE' : 'AGGIUNGI')}</span>
      <span class="element-tool-hint">${tool.hint}</span>
    `;
    btn.addEventListener('click', () => {
      selectedElementTool = selectedElementTool === tool.key ? null : tool.key;
      renderElementPalette();
    });
    palette.appendChild(btn);
  });
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
  return getCharacterIds().map(id => {
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
    characterId: resolveCharacterId(characterId),
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
}

function applyEditorBoardChanges() {
  initGrid();
  drawBackground();
  syncSprite();
  refreshEditorDebug();
}

function startBlankEditorLevel() {
  selectedEditorLevelId = NEW_EDITOR_LEVEL_ID;
  currentCustomLevel = null;
  pendingNewLevelThemeOverrides = {};
  currentLevel = resolveThemeLevelId(CUSTOM_LEVEL_THEME);
  tutorialSceneLevelId = currentLevel;
  pendingNewLevelCharacterId = resolveCharacterId(getLevel()?.characterId);
  applyLevelSceneVars();
  playerPlaced = false;
  goalPlaced = false;
  selectedElementTool = null;
  START = { x: 2, y: 2 };
  GOAL = { x: 5, y: 5 };
  pos = { ...START };
  ori = 'right';
  setCharacterAction('idle');
  setBlockedCells([]);
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
    const sourceCell = document.querySelector(`.cell[data-cx="${startX}"][data-cy="${startY}"]`);
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
    document.querySelector(`.cell[data-cx="${startX}"][data-cy="${startY}"]`)?.style.removeProperty('opacity');
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

  grid.addEventListener('click', e => {
    if (!editorMode || running || animating) return;
    if (suppressNextClick) {
      suppressNextClick = false;
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
      if (playerPlaced) {
        if (isPlayerCell) {
          playerPlaced = false;
          selectedElementTool = null;
          applyEditorBoardChanges();
        }
        return;
      }
      if (isBlocked || isGoalCell) return;
      playerPlaced = true;
      START = { x, y };
      pos = { x, y };
      selectedElementTool = null;
      applyEditorBoardChanges();
      return;
    }

    if (selectedElementTool === 'goal') {
      if (goalPlaced) {
        if (isGoalCell) {
          goalPlaced = false;
          selectedElementTool = null;
          applyEditorBoardChanges();
        }
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
    || (currentLevel === 'level1' ? getEditorLevelIdForTutorialStep(tutorialStepIndex) : null);
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
    toast(persistResult.projectFileSaved
      ? 'Livello salvato nel progetto: ora puoi fare commit'
      : 'Livello salvato solo in questa sessione');
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
    baseStepIndex: levels[idx].baseStepIndex,
    name: levels[idx].name
  });
  const persistResult = await persistEditorLevels(levels, { promptIfMissing: true });
  const savedLevel = levels[idx];
  selectedEditorLevelId = savedLevel.id;
  if (savedLevel.baseStepIndex != null) {
    currentCustomLevel = null;
    currentLevel = 'level1';
    applyLevelSceneVars();
    tutorialStepIndex = savedLevel.baseStepIndex;
    applyTutorialStep(savedLevel.baseStepIndex);
    refreshEditorDebug();
  } else {
    currentCustomLevel = cloneCustomLevel(savedLevel);
    applyCustomLevel(savedLevel, { openEditor: true });
  }
  renderCustomLevels();
  renderElementPalette();
  toast(persistResult.projectFileSaved
    ? 'Livello salvato nel progetto: ora puoi fare commit'
    : 'Livello salvato solo in questa sessione');
  return savedLevel;
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
    tile.addEventListener('drop', e => {
      e.preventDefault();
      tile.classList.remove('drop-target');
      if (!draggingEditorLevelId || draggingEditorLevelId === normalized.id) return;
      const current = readCustomLevels();
      const from = current.findIndex(entry => entry.id === draggingEditorLevelId);
      const to = current.findIndex(entry => entry.id === normalized.id);
      if (from === -1 || to === -1) return;
      const [moved] = current.splice(from, 1);
      current.splice(to, 0, moved);
      writeCustomLevels(current);
      renderCustomLevels();
    });
    list.appendChild(tile);
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
    levelEditor.renderEditorAvail(row, sz);
    return;
  }

  row.classList.remove('editor-blocks-row');

  avail.forEach((block, i) => {
    const el = mkB(block, sz, sz, 'ablock');
    if (!editorMode && currentLevel === 'level1' && stepStartHintActive) {
      el.classList.add('tutorial-focus');
    } else if (!editorMode && currentLevel === 'level1' && isFunctionTutorialStep()) {
      if (!fnUnlockHintActive && block.dir === 'forward') {
        el.classList.add('tutorial-focus');
      }
      if (fnUnlockHintActive && block.dir === 'function') {
        el.classList.add('tutorial-focus', 'function-hint');
      }
    }
    el.dataset.ai = i;
    el.style.position = 'absolute';
    el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    bindDrag(el, 'avail', i, sz);
    row.appendChild(el);
  });
  alignAvailBlocksToSlots();
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
    sep.setAttribute('x1', String(startX)); sep.setAttribute('x2', String(endX));
    sep.setAttribute('y1', ySep); sep.setAttribute('y2', ySep);
    sep.setAttribute('stroke', 'rgba(43,143,212,0.3)');
    sep.setAttribute('stroke-width', '1.5');
    sep.setAttribute('stroke-dasharray', '5 4');
    sep.setAttribute('mask', 'url(#trackSlotMask)');
    svg.appendChild(sep);
    alignAvailBlocksToSlots();
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
  divLine.setAttribute('x1', '0'); divLine.setAttribute('x2', W);
  divLine.setAttribute('y1', ydiv); divLine.setAttribute('y2', ydiv);
  divLine.setAttribute('stroke', 'rgba(124,58,237,0.2)');
  divLine.setAttribute('stroke-width', '1.5');
  divLine.setAttribute('stroke-dasharray', '4 4');
  svg.appendChild(divLine);

  // ── fn row (→) ──
  svg.appendChild(path(`M ${pad} ${y3} H ${W-pad}`, f >= 0, true));
}

// ═══ DRAG ═══
let dg = {active:false, block:null, src:null, si:null, hover:null};

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
  dg = {active:true, block, src, si:idx, hover:null};
  const g = document.getElementById('ghost');
  g.innerHTML=''; g.appendChild(mkB(block,sz,sz));
  g.style.cssText=`display:block;width:${sz}px;height:${sz}px;left:${cx}px;top:${cy}px;border-radius:5px;`;
  if(src==='avail') {
    document.querySelectorAll('.ablock').forEach(el=>{ if(+el.dataset.ai===idx) el.style.opacity='0.3'; });
  } else {
    const zone = src==='fn' ? 'fn' : 'main';
    const s=document.querySelector(`.pslot[data-zone="${zone}"][data-slot="${idx}"] .sinner`);
    if(s) s.style.opacity='0.3';
  }
}

function moveDg(cx,cy) {
  if(!dg.active) return;
  const g = document.getElementById('ghost');
  g.style.left=cx+'px'; g.style.top=cy+'px';
  g.style.display='none';
  const u=document.elementFromPoint(cx,cy);
  g.style.display='block';
  const slot=u?.closest('.pslot');
  if(dg.hover&&dg.hover!==slot) dg.hover.classList.remove('over');
  if(slot){slot.classList.add('over');dg.hover=slot;} else dg.hover=null;
}

function endDg(cx,cy) {
  if(!dg.active) return;
  document.getElementById('ghost').style.display='none';
  if(dg.hover) dg.hover.classList.remove('over');
  document.querySelectorAll('.ablock,.pblock').forEach(e=>e.style.opacity='1');
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
      if(dg.src==='avail') fnProg[ti]={id:`${dg.block.dir}${idN++}`,...POOL[dg.block.dir]};
      else if(dg.src==='fn'&&dg.si!==ti){ const tmp=fnProg[ti];fnProg[ti]=dg.block;fnProg[dg.si]=tmp; }
      else if(dg.src==='prog'){ fnProg[ti]={...dg.block}; prog[dg.si]=null; }
    } else {
      if(dg.src==='avail') prog[ti]={id:`${dg.block.dir}${idN++}`,...POOL[dg.block.dir]};
      else if(dg.src==='prog'&&dg.si!==ti){ const tmp=prog[ti];prog[ti]=dg.block;prog[dg.si]=tmp; }
      else if(dg.src==='fn'){ prog[ti]={...dg.block}; fnProg[dg.si]=null; }
    }
  } else {
    if(dg.src==='prog') prog[dg.si]=null;
    else if(dg.src==='fn') fnProg[dg.si]=null;
  }
  if (isFunctionTutorialStep() && !fnUnlockHintActive) {
    const firstFnForwardPlaced = fnProg.some(b => (b?.dir || b?.direction) === 'forward');
    if (firstFnForwardPlaced) fnUnlockHintActive = true;
  }
  if (stepStartHintActive) {
    const hasAnyPlacedBlock = prog.some(Boolean) || fnProg.some(Boolean);
    if (hasAnyPlacedBlock) stepStartHintActive = false;
  }
  dg.active=false;
  renderAvail(); renderBoard(); renderFn();
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
  const activeCharacterId = resolveCharacterId(getActiveCharacterId());
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
    await animTo(p.x,p.y); await sleep(80);
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
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="4" height="16" rx="1" fill="#00aa50"/><rect x="15" y="4" width="4" height="16" rx="1" fill="#00aa50"/></svg>';
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
              await moveChar(fnProg[f].dir||fnProg[f].direction); await sleep(STEP_MS);
              if(goalPlaced && pos.x===GOAL.x&&pos.y===GOAL.y) { won=true; break; }
            }
          }
          document.querySelectorAll('.pslot[data-zone="fn"]').forEach(s=>s.classList.remove('fn-active','fn-done'));
          if(won) break;
        }
      } else {
        await moveChar(prog[i].dir||prog[i].direction); await sleep(STEP_MS);
        if(goalPlaced && pos.x===GOAL.x&&pos.y===GOAL.y) { won=true; break; }
      }
    } else { await sleep(STEP_MS); }
  }

  document.querySelectorAll('.pslot[data-zone="main"]').forEach(s=>s.classList.remove('active','done'));
  document.querySelectorAll('.pslot[data-zone="fn"]').forEach(s=>s.classList.remove('fn-active','fn-done'));
  btn.classList.remove('running'); btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 12 L12 7.5 A4.5 4.5 0 0 1 16.5 12 Z" fill="#2B8FD4"/><path d="M12 12 L16.5 12 A4.5 4.5 0 0 1 12 16.5 Z" fill="#FFD31A"/><path d="M12 12 L12 16.5 A4.5 4.5 0 0 1 7.5 12 Z" fill="#FF3B3B"/><path d="M12 12 L7.5 12 A4.5 4.5 0 0 1 12 7.5 Z" fill="#3F9A62"/></svg>'; running=false;
  if (!editorMode) resetPrograms();

  if(won) {
    playWinSfx();
    if (editorMode) {
      await sleep(900);
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
    if (!currentCustomLevel && currentLevel === 'level1') {
      playLevelTransitionSfx();
      await fadeTransition(620);
      const steps = getTutorialSteps();
      if (steps.length) {
        applyTutorialStep((tutorialStepIndex + 1) % steps.length);
      } else {
        resetPrograms();
        initGrid();
        renderAvail();
        renderBoard(); renderFn();
        drawBackground();
        syncSprite();
        moveGoal();
      }
      return;
    }
    await sleep(1200);
    resetPrograms();
    resetPlayerToStepStart();
    renderBoard(); renderFn();
  } else {
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
  await loadEditorLevelsSource();
  syncViewportHeight();
  currentLevel = 'level1';
  setLevel('level1', { persist: false });
  document.getElementById('gridWrap').style.position = 'relative';
  if (!applyTutorialStep(0)) {
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
      setupGoalDrag();
      setupEditorElementPlacement();
    });
  }));
  updateDebugBadge();
  refreshEditorValues();
  updateRunAvailability();
  if (LEVEL_EDITOR_ENABLED) {
    const initialLevels = readCustomLevels();
    if (!selectedEditorLevelId && initialLevels.length) selectedEditorLevelId = initialLevels[0].id;
    renderCustomLevels();
    renderElementPalette();
    renderIconPicker();
  }
}

void init();

function showStartGate() {
  document.body.classList.add('prestart');
  if (LEVEL_EDITOR_ENABLED) renderCustomLevels();
  document.getElementById('startGate')?.classList.add('show');
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
  const shouldOpenEditor = LEVEL_EDITOR_ENABLED && openEditor;
  const gate = document.getElementById('startGate');
  const gateFadeMs = 1100;
  const backgroundHoldMs = 500;
  gate?.classList.add('hiding');
  requestAppFullscreen();
  setTimeout(() => gate?.classList.remove('show', 'hiding'), gateFadeMs);
  setTimeout(() => {
    document.body.classList.remove('prestart');
    if (onOpen) onOpen();
    else setEditorMode(shouldOpenEditor);
    fadeInPizzicatoBgm(2200);
  }, gateFadeMs + backgroundHoldMs);
}
function startGameFromGate() {
  openAppFromGate({ openEditor: false });
}
function startEditorFromGate() {
  if (!LEVEL_EDITOR_ENABLED) return;
  openAppFromGate({ openEditor: true });
}
function returnToMainMenu() {
  if (document.body.classList.contains('prestart')) return;
  if (running || animating) {
    toast('Aspetta che il movimento finisca');
    return;
  }
  closeSaveLevelModal();
  if (editorMode) exitEditorMode();
  setEditorStylePanelOpen(false);
  gameStarted = false;
  const gate = document.getElementById('startGate');
  gate?.classList.remove('hiding');
  showStartGate();
  updateQuickEditorButton();
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
function toggleEditorFromCurrentLevel() {
  if (!LEVEL_EDITOR_ENABLED) return;
  if (editorMode) {
    exitEditorMode();
    return;
  }
  enterEditorFromCurrentLevel();
}
function enterEditorFromCurrentLevel() {
  if (!LEVEL_EDITOR_ENABLED) return;
  if (running || animating) {
    toast('Aspetta che il movimento finisca');
    return;
  }
  closeSaveLevelModal();
  if (currentCustomLevel) {
    applyCustomLevel(currentCustomLevel, { openEditor: true });
    return;
  }
  if (currentLevel === 'level1') {
    const tutorialLevel = findCustomLevel(getEditorLevelIdForTutorialStep(tutorialStepIndex));
    if (tutorialLevel) {
      applyCustomLevel(tutorialLevel, { openEditor: true });
      return;
    }
  }
  setEditorMode(true);
}
function exitEditorMode() {
  if (!editorMode || running || animating) return;
  closeSaveLevelModal();
  if (currentCustomLevel?.baseStepIndex != null) {
    const stepIndex = currentCustomLevel.baseStepIndex;
    currentCustomLevel = null;
    currentLevel = 'level1';
    applyLevelSceneVars();
    setEditorMode(false);
    applyTutorialStep(stepIndex);
    return;
  }
  if (currentCustomLevel) {
    applyCustomLevel(currentCustomLevel, { openEditor: false });
    return;
  }
  setEditorMode(false);
  if (getTutorialSteps().length) {
    applyTutorialStep(tutorialStepIndex);
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
document.getElementById('openLottieInspectorBtn')?.addEventListener('click', openLottieInspectorTool);
document.getElementById('openLottieInspectorBtnEditor')?.addEventListener('click', openLottieInspectorTool);
document.getElementById('header')?.addEventListener('click', returnToMainMenu);
document.getElementById('header')?.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  returnToMainMenu();
});
document.getElementById('quickEditorBtn')?.addEventListener('click', toggleEditorFromCurrentLevel);
document.getElementById('saveLevelBtn')?.addEventListener('click', openSaveLevelModal);
document.getElementById('openStyleEditorBtn')?.addEventListener('click', toggleStyleEditorPanel);
document.getElementById('closeStyleEditorBtn')?.addEventListener('click', () => setEditorStylePanelOpen(false));
document.getElementById('applyThemeStyleBtn')?.addEventListener('click', () => { void applyCurrentStyleToSelectedLevel(); });
document.getElementById('resetThemeColorsBtn')?.addEventListener('click', resetCurrentEditorThemeOverrides);
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

window.addEventListener('resize', () => {
  syncViewportHeight();
  renderAvail();
  requestAnimationFrame(() => {
    sizeGrid();
    renderBoard();
    renderFn();
    drawBackground();
    syncSprite();
    refreshEditorDebug();
  });
});
window.visualViewport?.addEventListener('resize', syncViewportHeight);
window.visualViewport?.addEventListener('scroll', syncViewportHeight);
window.addEventListener('orientationchange', syncViewportHeight);
updateQuickEditorButton();
updateStyleEditorButtons();

// ri-entra in fullscreen se l'utente torna sull'app (es. dopo notifica)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (gameStarted) {
      resumePizzicatoBgm();
      requestAppFullscreen();
    }
  } else {
    pausePizzicatoBgm();
  }
});
