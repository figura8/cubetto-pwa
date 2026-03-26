(function () {
  function goalSVGLevel1() {
    return `<svg viewBox="0 0 50 50" style="width:72%;height:72%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.18));">
      <path d="M24 44 C10 42 6 27 12 16 C17 7 30 4 40 10 C47 14 47 25 40 34 C35 40 30 44 24 44 Z" fill="#66c455" stroke="#3f8c33" stroke-width="1.6"/>
      <path d="M23 40 C15 37 12 27 15 19 C18 13 27 10 34 13 C39 16 40 23 35 30 C31 35 28 39 23 40 Z" fill="#8fdf72" opacity="0.92"/>
      <path d="M24 40 C25 33 25 25 24 14" fill="none" stroke="#3d8d34" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M24 23 C20 21 17 20 14 19 M24 27 C28 26 31 25 34 23 M24 31 C19 31 16 32 13 33 M24 34 C29 34 32 35 35 36" fill="none" stroke="#4ca743" stroke-width="1" stroke-linecap="round"/>
      <ellipse cx="20" cy="18" rx="4" ry="2" fill="rgba(255,255,255,0.3)"/>
      <ellipse cx="31" cy="28" rx="3.2" ry="1.6" fill="rgba(255,255,255,0.24)"/>
    </svg>`;
  }

  function goalSVGCity() {
    return `<svg viewBox="0 0 50 50" style="width:72%;height:72%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 5px rgba(8,18,35,0.32));">
      <path d="M25 5 C17 5 11 11 11 19 c0 11 14 25 14 25 s14-14 14-25 C39 11 33 5 25 5 Z" fill="#44b8ff" stroke="#1c6ea3" stroke-width="1.7"/>
      <circle cx="25" cy="19" r="5.5" fill="#f4fbff" stroke="#1c6ea3" stroke-width="1.5"/>
      <path d="M25 15 L26.6 18.4 L30.3 18.7 L27.5 21.3 L28.2 25 L25 23.2 L21.8 25 L22.5 21.3 L19.7 18.7 L23.4 18.4 Z" fill="#ffd56a"/>
    </svg>`;
  }

  function goalSVGUniverse() {
    return `<svg viewBox="0 0 50 50" style="width:72%;height:72%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 6px rgba(0,0,0,0.45));">
      <defs>
        <radialGradient id="portalCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ecfdff"/>
          <stop offset="50%" stop-color="#91e4ff"/>
          <stop offset="100%" stop-color="#5d8bff"/>
        </radialGradient>
      </defs>
      <circle cx="25" cy="25" r="13.5" fill="none" stroke="#a897ff" stroke-width="4.2"/>
      <circle cx="25" cy="25" r="10.2" fill="none" stroke="#d0e7ff" stroke-width="2.2" opacity="0.9"/>
      <circle cx="25" cy="25" r="6.8" fill="url(#portalCore)"/>
      <circle cx="25" cy="25" r="2.4" fill="#ffffff" opacity="0.92"/>
    </svg>`;
  }

  function renderCharacter(state) {
    const resolvedState = typeof state === 'string'
      ? { direction: state, action: 'idle' }
      : { action: 'idle', ...(state || {}) };
    const characterId = typeof resolvedState.characterId === 'string' && resolvedState.characterId.trim()
      ? resolvedState.characterId.trim()
      : 'boks_base';
    return window.BOKS_CHARACTER_RENDERER?.render({
      characterId,
      action: resolvedState.action,
      direction: resolvedState.direction
    }) || '';
  }

  function prepareBackgroundCanvas() {
    const canvas = document.getElementById('bgCanvas');
    const grid = document.getElementById('gameGrid');
    const wrap = document.getElementById('gridWrap');
    if (!canvas || !grid || !wrap) return null;

    const rect = grid.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const size = Math.round(rect.width);
    if (!size) return null;

    canvas.width = size;
    canvas.height = size;
    canvas.style.left = (rect.left - wrapRect.left) + 'px';
    canvas.style.top = (rect.top - wrapRect.top) + 'px';
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const cx = canvas.getContext('2d');
    if (!cx) return null;
    return { cx, size };
  }

  function drawBackgroundLevel1() {
    const prepared = prepareBackgroundCanvas();
    if (!prepared) return;
    const { cx, size: S } = prepared;

    const bg = cx.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, '#bce991');
    bg.addColorStop(0.45, '#97d16d');
    bg.addColorStop(1, '#77ba52');
    cx.fillStyle = bg;
    cx.fillRect(0, 0, S, S);

    cx.save();
    for (let i = -2; i < 10; i++) {
      const stripeW = S / 8;
      cx.fillStyle = i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(30,80,20,0.05)';
      cx.fillRect(i * stripeW, 0, stripeW, S);
    }
    cx.restore();

    cx.save();
    const path = cx.createLinearGradient(0, S * 0.78, 0, S);
    path.addColorStop(0, 'rgba(176,129,68,0)');
    path.addColorStop(1, 'rgba(164,115,58,0.32)');
    cx.fillStyle = path;
    cx.beginPath();
    cx.moveTo(0, S);
    cx.lineTo(0, S * 0.89);
    cx.bezierCurveTo(S * 0.24, S * 0.82, S * 0.62, S * 0.95, S, S * 0.86);
    cx.lineTo(S, S);
    cx.closePath();
    cx.fill();
    cx.restore();

    cx.save();
    for (let i = 0; i < 70; i++) {
      const x = ((i * 73) % 997) / 997 * S;
      const y = ((i * 191) % 991) / 991 * S;
      const h = S * (0.018 + (((i * 37) % 100) / 1000));
      cx.strokeStyle = i % 2 ? 'rgba(43,118,34,0.18)' : 'rgba(202,255,182,0.18)';
      cx.lineWidth = 1.2;
      cx.beginPath();
      cx.moveTo(x, y);
      cx.quadraticCurveTo(x + S * 0.006, y - h * 0.5, x + S * 0.003, y - h);
      cx.stroke();
    }
    cx.restore();

    cx.save();
    for (let i = 0; i < 16; i++) {
      const x = (((i + 1) * 149) % 997) / 997 * S;
      const y = (((i + 1) * 281) % 991) / 991 * S;
      const r = Math.max(2.2, S * 0.006);
      const petals = ['#fff4a3', '#fce4ec', '#d5f5ff', '#ffe2b8'][i % 4];
      cx.fillStyle = petals;
      for (let p = 0; p < 5; p++) {
        const a = (Math.PI * 2 * p) / 5;
        cx.beginPath();
        cx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.65, 0, Math.PI * 2);
        cx.fill();
      }
      cx.fillStyle = '#f5c542';
      cx.beginPath();
      cx.arc(x, y, r * 0.52, 0, Math.PI * 2);
      cx.fill();
    }
    cx.restore();

    cx.save();
    for (let i = 0; i < 10; i++) {
      const x = (((i + 3) * 127) % 997) / 997 * S;
      const y = (((i + 5) * 211) % 991) / 991 * S;
      if (x > S * 0.1 && x < S * 0.9 && y > S * 0.12 && y < S * 0.88) continue;
      const rr = Math.max(3, S * 0.008);
      cx.fillStyle = i % 2 ? 'rgba(69,146,55,0.35)' : 'rgba(87,171,68,0.30)';
      cx.beginPath(); cx.arc(x - rr * 0.8, y, rr, 0, Math.PI * 2); cx.fill();
      cx.beginPath(); cx.arc(x + rr * 0.8, y, rr, 0, Math.PI * 2); cx.fill();
      cx.beginPath(); cx.arc(x, y - rr * 0.8, rr, 0, Math.PI * 2); cx.fill();
    }
    cx.restore();

    cx.save();
    for (let i = 0; i < 18; i++) {
      const x = (((i + 7) * 163) % 997) / 997 * S;
      const y = (((i + 9) * 257) % 991) / 991 * S;
      if (y < S * 0.68) continue;
      cx.fillStyle = i % 2 ? 'rgba(205,198,185,0.55)' : 'rgba(170,162,150,0.45)';
      cx.beginPath();
      cx.ellipse(x, y, S * 0.009, S * 0.006, (i % 6) * 0.32, 0, Math.PI * 2);
      cx.fill();
    }
    cx.restore();

    cx.save();
    cx.globalAlpha = 0.14;
    cx.strokeStyle = '#5a9a44';
    cx.lineWidth = 1;
    const csz = S / 6;
    for (let i = 1; i < 6; i++) {
      cx.beginPath(); cx.moveTo(i * csz, 0); cx.lineTo(i * csz, S); cx.stroke();
      cx.beginPath(); cx.moveTo(0, i * csz); cx.lineTo(S, i * csz); cx.stroke();
    }
    cx.restore();
  }

  function drawBackgroundCity() {
    const prepared = prepareBackgroundCanvas();
    if (!prepared) return;
    const { cx, size: S } = prepared;

    const bg = cx.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, '#dcecff');
    bg.addColorStop(0.48, '#c9ddf0');
    bg.addColorStop(1, '#afc6db');
    cx.fillStyle = bg;
    cx.fillRect(0, 0, S, S);

    const roadTop = S * 0.42;
    const roadBottom = S * 0.66;
    cx.fillStyle = 'rgba(58,74,95,0.35)';
    cx.fillRect(0, roadTop, S, roadBottom - roadTop);
    cx.fillStyle = 'rgba(54,70,90,0.32)';
    cx.fillRect(S * 0.42, 0, S * 0.16, S);

    cx.save();
    cx.setLineDash([S * 0.035, S * 0.03]);
    cx.strokeStyle = 'rgba(255,243,172,0.85)';
    cx.lineWidth = Math.max(1.8, S * 0.008);
    cx.beginPath();
    cx.moveTo(0, (roadTop + roadBottom) / 2);
    cx.lineTo(S, (roadTop + roadBottom) / 2);
    cx.stroke();
    cx.beginPath();
    cx.moveTo(S * 0.5, 0);
    cx.lineTo(S * 0.5, S);
    cx.stroke();
    cx.restore();

    cx.save();
    const buildingBase = S * 0.2;
    for (let i = 0; i < 8; i++) {
      const x = i * (S / 8);
      const w = S * 0.09 + (i % 3) * S * 0.012;
      const h = buildingBase + (i % 5) * S * 0.06;
      cx.fillStyle = i % 2 ? 'rgba(123,146,170,0.58)' : 'rgba(106,130,155,0.52)';
      cx.fillRect(x + S * 0.02, S * 0.02, w, h);
      cx.fillStyle = 'rgba(246,236,182,0.4)';
      for (let wy = 0; wy < 4; wy++) {
        for (let wx = 0; wx < 2; wx++) {
          cx.fillRect(x + S * 0.03 + wx * S * 0.028, S * 0.04 + wy * S * 0.04, S * 0.013, S * 0.02);
        }
      }
    }
    cx.restore();

    cx.save();
    const gridSize = S / 6;
    cx.strokeStyle = 'rgba(64,94,121,0.22)';
    cx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      cx.beginPath();
      cx.moveTo(i * gridSize, 0);
      cx.lineTo(i * gridSize, S);
      cx.stroke();
      cx.beginPath();
      cx.moveTo(0, i * gridSize);
      cx.lineTo(S, i * gridSize);
      cx.stroke();
    }
    cx.restore();

    cx.save();
    for (let i = 0; i < 18; i++) {
      const x = (((i + 2) * 117) % 997) / 997 * S;
      const y = (((i + 3) * 233) % 991) / 991 * S;
      const r = Math.max(1.2, S * 0.0045);
      cx.fillStyle = i % 2 ? 'rgba(255,247,190,0.5)' : 'rgba(176,226,255,0.42)';
      cx.beginPath();
      cx.arc(x, y, r, 0, Math.PI * 2);
      cx.fill();
    }
    cx.restore();
  }

  function drawBackgroundUniverse() {
    const prepared = prepareBackgroundCanvas();
    if (!prepared) return;
    const { cx, size: S } = prepared;

    const bg = cx.createRadialGradient(S * 0.5, S * 0.35, S * 0.1, S * 0.5, S * 0.5, S * 0.8);
    bg.addColorStop(0, '#332966');
    bg.addColorStop(0.58, '#231d4a');
    bg.addColorStop(1, '#121028');
    cx.fillStyle = bg;
    cx.fillRect(0, 0, S, S);

    cx.save();
    const nebulaA = cx.createRadialGradient(S * 0.22, S * 0.22, S * 0.02, S * 0.22, S * 0.22, S * 0.26);
    nebulaA.addColorStop(0, 'rgba(157,133,255,0.34)');
    nebulaA.addColorStop(1, 'rgba(157,133,255,0)');
    cx.fillStyle = nebulaA;
    cx.fillRect(0, 0, S, S);
    const nebulaB = cx.createRadialGradient(S * 0.78, S * 0.65, S * 0.03, S * 0.78, S * 0.65, S * 0.3);
    nebulaB.addColorStop(0, 'rgba(88,201,255,0.3)');
    nebulaB.addColorStop(1, 'rgba(88,201,255,0)');
    cx.fillStyle = nebulaB;
    cx.fillRect(0, 0, S, S);
    cx.restore();

    cx.save();
    for (let i = 0; i < 120; i++) {
      const x = ((i * 173) % 997) / 997 * S;
      const y = ((i * 317) % 991) / 991 * S;
      const r = (i % 9 === 0) ? S * 0.006 : S * 0.0033;
      cx.fillStyle = i % 7 === 0 ? 'rgba(167,242,255,0.9)' : 'rgba(255,245,255,0.78)';
      cx.beginPath();
      cx.arc(x, y, Math.max(0.9, r), 0, Math.PI * 2);
      cx.fill();
    }
    cx.restore();

    cx.save();
    cx.strokeStyle = 'rgba(191,170,255,0.26)';
    cx.lineWidth = Math.max(1.2, S * 0.004);
    cx.beginPath();
    cx.ellipse(S * 0.68, S * 0.34, S * 0.2, S * 0.07, -0.36, 0, Math.PI * 2);
    cx.stroke();
    cx.beginPath();
    cx.ellipse(S * 0.34, S * 0.72, S * 0.16, S * 0.055, 0.25, 0, Math.PI * 2);
    cx.stroke();
    cx.restore();

    cx.save();
    const planet = cx.createRadialGradient(S * 0.8, S * 0.16, S * 0.03, S * 0.8, S * 0.16, S * 0.09);
    planet.addColorStop(0, '#eff8ff');
    planet.addColorStop(0.45, '#8cd4ff');
    planet.addColorStop(1, '#5a82ff');
    cx.fillStyle = planet;
    cx.beginPath();
    cx.arc(S * 0.8, S * 0.16, S * 0.08, 0, Math.PI * 2);
    cx.fill();
    cx.restore();

    cx.save();
    const gridSize = S / 6;
    cx.strokeStyle = 'rgba(180,160,244,0.2)';
    cx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      cx.beginPath();
      cx.moveTo(i * gridSize, 0);
      cx.lineTo(i * gridSize, S);
      cx.stroke();
      cx.beginPath();
      cx.moveTo(0, i * gridSize);
      cx.lineTo(S, i * gridSize);
      cx.stroke();
    }
    cx.restore();
  }

  function drawBackgroundThomas() {
    const prepared = prepareBackgroundCanvas();
    if (!prepared) return;
    const { cx, size: S } = prepared;

    const bg = cx.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, '#d9e9db');
    bg.addColorStop(1, '#c9decd');
    cx.fillStyle = bg;
    cx.fillRect(0, 0, S, S);

    cx.save();
    cx.globalAlpha = 0.12;
    cx.strokeStyle = '#ffffff';
    cx.lineWidth = 1;
    const csz = S / 6;
    for (let i = 1; i < 6; i++) {
      cx.beginPath();
      cx.moveTo(i * csz, 0);
      cx.lineTo(i * csz, S);
      cx.stroke();
      cx.beginPath();
      cx.moveTo(0, i * csz);
      cx.lineTo(S, i * csz);
      cx.stroke();
    }
    cx.restore();
  }

  function decorateLevel1(cell, x, y) {
    if ((x + y) % 2 === 0) cell.classList.add('decor-grass');
    if ((x * 3 + y * 2) % 7 === 0) cell.classList.add('decor-flower');
    if ((x * 5 + y) % 9 === 0) cell.classList.add('decor-stone');
  }

  function decorateCity(cell, x, y) {
    if ((x + y * 2) % 3 === 0) cell.classList.add('decor-city-road');
    if ((x * 5 + y * 7) % 8 === 0) cell.classList.add('decor-city-light');
  }

  function decorateUniverse(cell, x, y) {
    if ((x * 2 + y * 3) % 4 === 0) cell.classList.add('decor-space-dust');
    if ((x * 7 + y * 5) % 9 === 0) cell.classList.add('decor-space-crater');
  }

  function decorateThomas() {}

  window.goalSVGLevel1 = goalSVGLevel1;
  window.renderCharacterLevel1 = renderCharacter;
  window.drawBackgroundLevel1 = drawBackgroundLevel1;

  window.BOKS_LEVELS = window.BOKS_LEVELS || {};

  window.BOKS_LEVELS.level1 = {
    id: 'level1',
    characterId: 'boks_black',
    name: 'Prato Base',
    themeSelectable: true,
    themeLabel: 'Prato',
    themeHint: 'Morbido e naturale',
    thumbnailPalette: {
      scene: '#edf7d9',
      cellA: '#d8efb6',
      cellB: '#cae69f',
      cellStroke: '#9dc56b',
      obstacleFill: '#cdb38c',
      obstacleStroke: '#9d7b51',
      goalFill: '#7fd765',
      goalStroke: '#3f8c33',
      startFill: '#fff7ef',
      startStroke: '#5aa24e'
    },
    tutorialSteps: [
      {
        start: { x: 2, y: 3 },
        goal: { x: 3, y: 3 },
        startOri: 'right',
        mainSlots: 1,
        availableBlocks: ['forward']
      },
      {
        start: { x: 1, y: 3 },
        goal: { x: 3, y: 3 },
        startOri: 'right',
        mainSlots: 2,
        availableBlocks: ['forward']
      },
      {
        start: { x: 1, y: 3 },
        goal: { x: 3, y: 3 },
        startOri: 'up',
        mainSlots: 3,
        availableBlocks: ['forward', 'right'],
        obstacles: [{ x: 1, y: 2 }]
      },
      {
        start: { x: 4, y: 3 },
        goal: { x: 2, y: 3 },
        startOri: 'up',
        mainSlots: 3,
        availableBlocks: ['forward', 'left'],
        obstacles: [{ x: 4, y: 2 }]
      },
      {
        start: { x: 1, y: 4 },
        goal: { x: 2, y: 3 },
        startOri: 'up',
        mainSlots: 4,
        availableBlocks: ['forward', 'left', 'right'],
        obstacles: [{ x: 1, y: 3 }]
      },
      {
        start: { x: 0, y: 3 },
        goal: { x: 5, y: 3 },
        startOri: 'right',
        mainSlots: 4,
        fnSlots: 2,
        availableBlocks: ['forward', 'function']
      },
      {
        start: { x: 1, y: 4 },
        goal: { x: 3, y: 4 },
        startOri: 'up',
        mainSlots: 4,
        fnSlots: 2,
        availableBlocks: ['forward', 'right', 'function'],
        obstacles: [{ x: 1, y: 3 }]
      },
      {
        start: { x: 4, y: 4 },
        goal: { x: 2, y: 4 },
        startOri: 'up',
        mainSlots: 4,
        fnSlots: 2,
        availableBlocks: ['forward', 'left', 'function'],
        obstacles: [{ x: 4, y: 3 }]
      },
      {
        start: { x: 1, y: 4 },
        goal: { x: 4, y: 2 },
        startOri: 'up',
        mainSlots: 4,
        fnSlots: 3,
        availableBlocks: ['forward', 'left', 'right', 'function'],
        obstacles: [{ x: 1, y: 3 }, { x: 3, y: 3 }]
      },
      {
        start: { x: 1, y: 4 },
        goal: { x: 3, y: 1 },
        startOri: 'up',
        mainSlots: 4,
        fnSlots: 3,
        availableBlocks: ['forward', 'left', 'right', 'function'],
        obstacles: [{ x: 1, y: 3 }, { x: 2, y: 2 }]
      },
      {
        start: { x: 4, y: 4 },
        goal: { x: 1, y: 1 },
        startOri: 'up',
        mainSlots: 4,
        fnSlots: 3,
        availableBlocks: ['forward', 'left', 'right', 'function'],
        obstacles: [{ x: 4, y: 3 }, { x: 3, y: 2 }]
      },
      {
        start: { x: 4, y: 4 },
        goal: { x: 0, y: 2 },
        startOri: 'up',
        mainSlots: 4,
        fnSlots: 4,
        availableBlocks: ['forward', 'left', 'right', 'function'],
        obstacles: [{ x: 3, y: 4 }, { x: 2, y: 3 }]
      },
      {
        start: { x: 1, y: 4 },
        goal: { x: 4, y: 0 },
        startOri: 'up',
        mainSlots: 4,
        fnSlots: 4,
        availableBlocks: ['forward', 'left', 'right', 'function'],
        obstacles: [{ x: 4, y: 4 }, { x: 3, y: 2 }, { x: 3, y: 0 }]
      }
    ],
    sceneVars: {
      '--scene-body-bg': 'radial-gradient(140% 95% at 50% 0%, #f3ecdd 0%, #ece3d1 48%, #e8dfcc 100%)',
      '--bg-base': '#e8dfcc',
      '--panel-bg': '#ede7d7',
      '--panel-edge': '#d2c9b4',
      '--scene-grid-wrap-bg': '#d7efba',
      '--grid-bg': '#b7e48c',
      '--cell-bg': '#cfeaa5',
      '--cell-edge': 'rgba(114, 164, 72, 0.5)',
      '--cell-hi-bg': 'rgba(255, 247, 173, 0.88)',
      '--cell-hi-edge': '#d4bc44',
      '--cell-hi-ring': 'rgba(212,188,68,0.5)',
      '--grid-wrap-radius': '16px',
      '--grid-radius': '16px',
      '--cell-radius': '8px',
      '--obstacle-pattern-radius': '5px',
      '--obstacle-bg-top': 'rgba(205,184,148,0.95)',
      '--obstacle-bg-bottom': 'rgba(181,156,116,0.96)',
      '--obstacle-edge': 'rgba(133,104,67,0.74)',
      '--obstacle-pattern': 'rgba(125,95,57,0.4)'
    },
    decorateCell: decorateLevel1,
    renderGoal: goalSVGLevel1,
    renderSprite: renderCharacter,
    renderBackground: drawBackgroundLevel1
  };

  window.BOKS_LEVELS['level-city'] = {
    id: 'level-city',
    characterId: 'boks_black',
    name: 'Citta',
    themeSelectable: true,
    themeLabel: 'Citta',
    themeHint: 'Asfalto, luci e skyline',
    thumbnailPalette: {
      scene: '#edf3fa',
      cellA: '#d1e0ef',
      cellB: '#c0d4e8',
      cellStroke: '#86a5c0',
      obstacleFill: '#9aa7b6',
      obstacleStroke: '#687a8d',
      goalFill: '#54c0ff',
      goalStroke: '#1c6ea3',
      startFill: '#fff8f1',
      startStroke: '#5f7e9d'
    },
    sceneVars: {
      '--scene-body-bg': 'radial-gradient(140% 95% at 50% 0%, #f3ecdd 0%, #ece3d1 48%, #e8dfcc 100%)',
      '--bg-base': '#e8dfcc',
      '--panel-bg': '#edf3fa',
      '--panel-edge': '#c3cfda',
      '--scene-grid-wrap-bg': '#c5d8ea',
      '--grid-bg': '#aac3d8',
      '--cell-bg': '#c8d9e6',
      '--cell-edge': 'rgba(96, 125, 150, 0.48)',
      '--cell-hi-bg': 'rgba(211, 238, 255, 0.9)',
      '--cell-hi-edge': '#4f95c8',
      '--cell-hi-ring': 'rgba(79,149,200,0.44)',
      '--grid-wrap-radius': '16px',
      '--grid-radius': '16px',
      '--cell-radius': '8px',
      '--obstacle-pattern-radius': '5px',
      '--obstacle-bg-top': 'rgba(141,157,174,0.95)',
      '--obstacle-bg-bottom': 'rgba(113,128,145,0.95)',
      '--obstacle-edge': 'rgba(73,90,109,0.8)',
      '--obstacle-pattern': 'rgba(225,238,255,0.35)'
    },
    decorateCell: decorateCity,
    renderGoal: goalSVGCity,
    renderSprite: renderCharacter,
    renderBackground: drawBackgroundCity
  };

  window.BOKS_LEVELS['level-universe'] = {
    id: 'level-universe',
    characterId: 'boks_black',
    name: 'Universo',
    themeSelectable: true,
    themeLabel: 'Universo',
    themeHint: 'Nebulose e stelle',
    thumbnailPalette: {
      scene: '#191630',
      cellA: '#35305b',
      cellB: '#2a2550',
      cellStroke: '#6d68a6',
      obstacleFill: '#5b4a7d',
      obstacleStroke: '#8870bb',
      goalFill: '#95e8ff',
      goalStroke: '#4f75d6',
      startFill: '#f7f0ff',
      startStroke: '#a07ad8'
    },
    sceneVars: {
      '--scene-body-bg': 'radial-gradient(140% 95% at 50% 0%, #f3ecdd 0%, #ece3d1 48%, #e8dfcc 100%)',
      '--bg-base': '#e8dfcc',
      '--panel-bg': '#eee7f7',
      '--panel-edge': '#cdbfdd',
      '--scene-grid-wrap-bg': '#2f2859',
      '--grid-bg': '#342f63',
      '--cell-bg': '#2b2754',
      '--cell-edge': 'rgba(150, 136, 214, 0.56)',
      '--cell-hi-bg': 'rgba(122, 178, 255, 0.36)',
      '--cell-hi-edge': '#88b1ff',
      '--cell-hi-ring': 'rgba(136,177,255,0.42)',
      '--grid-wrap-radius': '16px',
      '--grid-radius': '16px',
      '--cell-radius': '8px',
      '--obstacle-pattern-radius': '5px',
      '--obstacle-bg-top': 'rgba(90,72,130,0.96)',
      '--obstacle-bg-bottom': 'rgba(70,55,108,0.97)',
      '--obstacle-edge': 'rgba(171,147,236,0.72)',
      '--obstacle-pattern': 'rgba(205,196,255,0.32)'
    },
    decorateCell: decorateUniverse,
    renderGoal: goalSVGUniverse,
    renderSprite: renderCharacter,
    renderBackground: drawBackgroundUniverse
  };

  window.BOKS_LEVELS['level-thomas'] = {
    id: 'level-thomas',
    characterId: 'boks_black',
    name: 'Thomas',
    themeSelectable: true,
    themeLabel: 'Thomas',
    themeHint: 'Minimal didattico',
    thumbnailPalette: {
      scene: '#f6f4ea',
      cellA: '#b8d6c7',
      cellB: '#add0c1',
      cellStroke: '#eef2e8',
      obstacleFill: '#d2b893',
      obstacleStroke: '#b6936b',
      goalFill: '#62c66f',
      goalStroke: '#3f9b4e',
      startFill: '#f8f4ea',
      startStroke: '#9ab5a5'
    },
    sceneVars: {
      '--scene-body-bg': 'radial-gradient(140% 95% at 50% 0%, #f3ecdd 0%, #ece3d1 48%, #e8dfcc 100%)',
      '--bg-base': '#e8dfcc',
      '--panel-bg': '#f7f4e8',
      '--panel-edge': '#e9e2cf',
      '--scene-grid-wrap-bg': '#edf0e3',
      '--grid-bg': '#eef1e4',
      '--cell-bg': '#a9c9b8',
      '--cell-edge': 'rgba(244, 248, 241, 0.95)',
      '--cell-hi-bg': 'rgba(202, 234, 220, 0.92)',
      '--cell-hi-edge': '#8fb3a2',
      '--cell-hi-ring': 'rgba(143,179,162,0.35)',
      '--grid-wrap-radius': '0px',
      '--grid-radius': '0px',
      '--cell-radius': '0px',
      '--obstacle-pattern-radius': '0px',
      '--obstacle-bg-top': 'rgba(205,180,145,0.95)',
      '--obstacle-bg-bottom': 'rgba(189,162,126,0.94)',
      '--obstacle-edge': 'rgba(165,134,99,0.72)',
      '--obstacle-pattern': 'rgba(245,231,209,0.42)'
    },
    decorateCell: decorateThomas,
    renderGoal: goalSVGLevel1,
    renderSprite: renderCharacter,
    renderBackground: drawBackgroundThomas
  };
})();
