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
const MOVE_MS = 650, TURN_MS = 320, STEP_MS = 380;
const POOL = {
  forward:  {dir:'forward',  color:'#5BC85A', dark:'#3a8a39', light:'#8de88c'},
  left:     {dir:'left',     color:'#F5C842', dark:'#b8920a', light:'#ffe87a'},
  right:    {dir:'right',    color:'#E8504A', dark:'#a02820', light:'#ff8a84'},
  function: {dir:'function', color:'#2B8FD4', dark:'#1a5a8a', light:'#8fd1ff'}
};

// ═══ STATE ═══
let pos = {...START};
let running = false, animating = false, idN = 0;
const avail = [];
const prog  = Array(SLOTS).fill(null);
const fnProg = Array(FSLOTS).fill(null);
const DECOR_CLASSES = ['decor-grass', 'decor-flower', 'decor-stone', 'decor-space-dust', 'decor-space-crater'];
let tutorialStepIndex = 0;
let blockedCells = new Set();
let activeMainSlots = SLOTS;
let activeFnSlots = FSLOTS;
let fnUnlockHintActive = false;
let stepStartHintActive = false;
let gameStarted = false;
let debugVisible = true;
document.body?.classList.add('prestart');
document.body?.classList.add('debug-visible');

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
  document.documentElement.style.setProperty('--app-vh', `${h}px`);
  document.documentElement.style.setProperty('--app-vw', `${w}px`);
  document.body.classList.toggle('compact-ui', h < 740 || w < 360);
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
  if (document.fullscreenElement) return;
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } catch (_) {}
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

  const blockShape = `M4,8 Q4,4 8,4 L32,4 Q36,4 36,8 L36,24 Q36,28 32,28 L8,28 Q4,28 4,24 Z`;

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
    if(x===GOAL.x && y===GOAL.y) {
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

  // Measure what bottom actually needs
  const appH  = app.clientHeight;
  const botH  = bot.offsetHeight;
  const availH = appH - botH - 6 - 6 - 6; // gaps + padding
  const availW = wrap.clientWidth;
  const sq = Math.max(120, Math.floor(Math.min(availH, availW)));

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

function syncSprite() {
  const r = cellPos(pos.x, pos.y);
  const s = document.getElementById('sprite');
  if(!r || !s) return;
  s.style.left = r.l+'px'; s.style.top = r.t+'px';
  s.style.width = r.w+'px'; s.style.height = r.h+'px';
  s.innerHTML = svgRobot(ori);
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
  if(!fr || !to) { pos={x:tx,y:ty}; syncSprite(); animating=false; return; }
  s.classList.add('moving');
  const a = s.animate(
    [{left:fr.l+'px',top:fr.t+'px'},{left:to.l+'px',top:to.t+'px'}],
    {duration:MOVE_MS, easing:'cubic-bezier(.2,.9,.2,1)', fill:'forwards'}
  );
  await a.finished.catch(()=>{});
  s.style.left=to.l+'px'; s.style.top=to.t+'px';
  a.cancel();
  s.classList.remove('moving');
  pos={x:tx,y:ty}; animating=false;
}

// ═══ SPRITE DRAG ═══
function setupSpriteDrag() {
  const s = document.getElementById('sprite');
  function start(cx,cy) {
    if(running||animating) return false;
    const g = document.getElementById('ghost');
    const w = s.offsetWidth;
    g.innerHTML = svgRobot(ori);
    g.style.cssText = `display:block;width:${w}px;height:${w}px;left:${cx}px;top:${cy}px;`;
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
    s.style.opacity='1';
    document.querySelectorAll('.cell.hi').forEach(c=>c.classList.remove('hi'));
    const u = document.elementFromPoint(cx,cy);
    const cell = u?.closest('.cell');
    if(cell) await animTo(+cell.dataset.cx, +cell.dataset.cy);
    syncSprite();
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

// ═══ PROCEDURAL BACKGROUND ═══

// ═══ LEVELS / THEMES ═══
const LEVEL_STORAGE_KEY = 'boks-current-level';
const LEVELS = window.BOKS_LEVELS || {};
let currentLevel = localStorage.getItem(LEVEL_STORAGE_KEY) || 'level1';
if (!LEVELS[currentLevel]) currentLevel = LEVELS.level1 ? 'level1' : Object.keys(LEVELS)[0];

function getLevel() {
  return LEVELS[currentLevel] || LEVELS.level1 || null;
}
function applyLevelSceneVars() {
  const lv = getLevel();
  if (!lv) return;
  const vars = lv.sceneVars || {};
  Object.entries(vars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
}
function setLevel(levelId, { persist = true } = {}) {
  if (!LEVELS[levelId]) return false;
  currentLevel = levelId;
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
function updateDebugBadge() {
  const badge = ensureDebugBadge();
  const lv = getLevel();
  const steps = getTutorialSteps();
  if (steps.length) {
    badge.textContent = `${lv?.name || currentLevel} | Step ${tutorialStepIndex + 1}/${steps.length}`;
    return;
  }
  badge.textContent = `${lv?.name || currentLevel} | Single level`;
}
function toggleDebugBadge() {
  debugVisible = !debugVisible;
  document.body.classList.toggle('debug-visible', debugVisible);
  if (debugVisible) updateDebugBadge();
}
function debugStepJump(delta) {
  if (running || animating) return;
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
function getTutorialSteps() {
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
  ori = step?.startOri || 'right';
  const sprite = document.getElementById('sprite');
  if (sprite) {
    sprite.getAnimations().forEach(a => a.cancel());
    sprite.classList.remove('moving');
  }
  syncSprite();
}
function applyTutorialStep(idx = 0) {
  const steps = getTutorialSteps();
  if (!steps.length) return false;
  tutorialStepIndex = ((idx % steps.length) + steps.length) % steps.length;
  const step = steps[tutorialStepIndex];
  activeMainSlots = Math.max(1, Math.min(SLOTS, step.mainSlots || SLOTS));
  activeFnSlots = Math.max(0, Math.min(FSLOTS, step.fnSlots ?? 0));
  fnUnlockHintActive = false;
  stepStartHintActive = true;
  START = { ...(step.start || { x: 2, y: 2 }) };
  GOAL = { ...(step.goal || { x: 5, y: 5 }) };
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
  const sprite = document.getElementById('sprite');
  if (sprite) {
    sprite.getAnimations().forEach(a => a.cancel());
    sprite.classList.remove('moving');
  }
  syncSprite();
  requestAnimationFrame(() => {
    sizeGrid();
    drawBackground();
    if (sprite) {
      sprite.getAnimations().forEach(a => a.cancel());
      sprite.classList.remove('moving');
    }
    syncSprite();
  });
  updateDebugBadge();
  return true;
}

function goalSVG() { const lv = getLevel(); return lv?.renderGoal ? lv.renderGoal() : ''; }
function svgRobot(o) { const lv = getLevel(); return lv?.renderSprite ? lv.renderSprite(o) : ''; }
function drawBackground() { const lv = getLevel(); if (lv?.renderBackground) lv.renderBackground(); }


function renderAvail() {
  const row = document.getElementById('blocksRow');
  row.innerHTML = '';
  const sz = 52;

  avail.forEach((block, i) => {
    const el = mkB(block, sz, sz, 'ablock');
    if (currentLevel === 'level1' && stepStartHintActive) {
      el.classList.add('tutorial-focus');
    } else if (currentLevel === 'level1' && isFunctionTutorialStep()) {
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
  const boardW = board.clientWidth || (app.clientWidth - 20);
  const innerW = boardW - 16;
  const rowPadX = 12;
  const gapX = 11;
  const slotW  = Math.floor((innerW - rowPadX * 2 - gapX * 3) / 4);
  const slotH  = Math.max(36, Math.min(slotW - 5, 50));
  const bsiz   = Math.max(32, Math.min(slotH - 6, slotW - 8));
  return { slotH, slotW, bsiz, innerW, rowPadX, gapX };
}

function renderBoard() {
  const g = document.getElementById('boardGrid');
  g.innerHTML = '';
  const { slotH, slotW, bsiz, innerW, rowPadX, gapX } = getBoardSizes();

  const gapH = 22;
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
      if (zone === 'main' && i >= activeMainSlots) slot.classList.add('locked');
      if (zone === 'fn' && i >= activeFnSlots) slot.classList.add('locked');
      slot.style.height = slotH + 'px';
      const wellSize = Math.max(28, Math.round(bsiz * 0.96));
      const blockSize = Math.max(30, Math.round(wellSize * 1.06));
      slot.style.setProperty('--well-size', `${wellSize}px`);

      const inn = document.createElement('div');
      inn.className = 'sinner';
      inn.style.cssText = `width:${blockSize}px;height:${blockSize}px;`;

      if(arr[i]) {
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
    if(zone === 'main' && ti >= activeMainSlots) {
      dg.active=false;
      renderAvail(); renderBoard(); renderFn();
      return;
    }
    if(zone === 'fn' && ti >= activeFnSlots) {
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
async function moveChar(dir) {
  syncSprite();
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
    await animTo(p.x,p.y); await sleep(80);
  } else {
    playTurnSfx(dir);
    const newOri = dir==='left'
      ? {up:'left',left:'down',down:'right',right:'up'}[ori]
      : {up:'right',right:'down',down:'left',left:'up'}[ori];
    const deg = dir==='left' ? -90 : 90;
    const s = document.getElementById('sprite');
    // animate rotation
    const anim = s.animate(
      [{transform:'rotate(0deg)'},{transform:`rotate(${deg}deg)`}],
      {duration: TURN_MS, easing:'cubic-bezier(0.4,0,0.2,1)', fill:'forwards'}
    );
    await anim.finished.catch(()=>{});
    anim.cancel(); // reset transform so syncSprite takes over
    ori = newOri;
    syncSprite();
  }
}
async function run() {
  if(!gameStarted || running || animating) return;
  requestAppFullscreen();
  sizeGrid();
  drawBackground();
  syncSprite();
  await nextFrame();
  syncSprite();
  let last=-1;
  for(let i=0;i<activeMainSlots;i++) if(prog[i]) last=i;
  if(last===-1){return;}
  running=true;
  playRunPressSfx();
  const btn=document.getElementById('runBtn');
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="4" height="16" rx="1" fill="#00aa50"/><rect x="15" y="4" width="4" height="16" rx="1" fill="#00aa50"/></svg>';
  toast(''); await sleep(200);
  let won = false;

  for(let i=0;i<=last;i++) {
    hlSlot(i, 'main'); await sleep(STEP_MS);
    if(prog[i]) {
      if(prog[i].dir === 'function') {
        // ── esegui sub-routine ──
        let fnLast = -1;
        for(let f=0;f<FSLOTS;f++) if(fnProg[f]) fnLast=f;
        if(fnLast === -1) { await sleep(300); }
        else {
          for(let f=0;f<=fnLast;f++) {
            hlSlot(f, 'fn'); await sleep(STEP_MS);
            if(fnProg[f]) {
              await moveChar(fnProg[f].dir||fnProg[f].direction); await sleep(STEP_MS);
              if(pos.x===GOAL.x&&pos.y===GOAL.y) { won=true; break; }
            }
          }
          document.querySelectorAll('.pslot[data-zone="fn"]').forEach(s=>s.classList.remove('fn-active','fn-done'));
          if(won) break;
        }
      } else {
        await moveChar(prog[i].dir||prog[i].direction); await sleep(STEP_MS);
        if(pos.x===GOAL.x&&pos.y===GOAL.y) { won=true; break; }
      }
    } else { await sleep(STEP_MS); }
  }

  document.querySelectorAll('.pslot[data-zone="main"]').forEach(s=>s.classList.remove('active','done'));
  document.querySelectorAll('.pslot[data-zone="fn"]').forEach(s=>s.classList.remove('fn-active','fn-done'));
  btn.classList.remove('running'); btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 12 L12 7.5 A4.5 4.5 0 0 1 16.5 12 Z" fill="#2B8FD4"/><path d="M12 12 L16.5 12 A4.5 4.5 0 0 1 12 16.5 Z" fill="#FFD31A"/><path d="M12 12 L12 16.5 A4.5 4.5 0 0 1 7.5 12 Z" fill="#FF3B3B"/><path d="M12 12 L7.5 12 A4.5 4.5 0 0 1 12 7.5 Z" fill="#3F9A62"/></svg>'; running=false;
  resetPrograms();

  if(won) {
    if (currentLevel === 'level1') {
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
    renderBoard(); renderFn();
    moveGoal();
  } else {
    await sleep(400);
    resetPlayerToStepStart();
    renderBoard(); renderFn();
  }
}

// ═══ INIT ═══
function init() {
  syncViewportHeight();
  currentLevel = 'level1';
  setLevel('level1', { persist: false });
  document.getElementById('gridWrap').style.position = 'relative';
  if (!applyTutorialStep(0)) {
    activeMainSlots = SLOTS;
    activeFnSlots = FSLOTS;
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
    });
  }));
  updateDebugBadge();
}

init();

function showStartGate() {
  document.body.classList.add('prestart');
  document.getElementById('startGate')?.classList.add('show');
}
function dismissSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  showStartGate();
  splash.classList.add('hide');
  setTimeout(() => splash.remove(), 500);
}
function startGameFromGate() {
  if (gameStarted) return;
  gameStarted = true;
  const gate = document.getElementById('startGate');
  const gateFadeMs = 1100;
  const backgroundHoldMs = 500;
  gate?.classList.add('hiding');
  requestAppFullscreen();
  setTimeout(() => gate?.classList.remove('show', 'hiding'), gateFadeMs);
  setTimeout(() => {
    document.body.classList.remove('prestart');
    fadeInPizzicatoBgm(2200);
  }, gateFadeMs + backgroundHoldMs);
}

// ── Splash dismiss ──
setTimeout(dismissSplash, 2200);

// tap to skip
document.getElementById('splash')?.addEventListener('pointerdown', dismissSplash);
document.getElementById('startGameBtn')?.addEventListener('click', startGameFromGate);
document.addEventListener('keydown', e => {
  const key = (e.key || '').toLowerCase();
  if (key === 'l') {
    toggleDebugBadge();
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
  });
});
window.visualViewport?.addEventListener('resize', syncViewportHeight);
window.visualViewport?.addEventListener('scroll', syncViewportHeight);
window.addEventListener('orientationchange', syncViewportHeight);

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


