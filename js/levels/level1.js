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

  function renderCharacterLevel1(state) {
    const resolvedState = typeof state === 'string'
      ? { direction: state, action: 'idle' }
      : { action: 'idle', ...(state || {}) };
    return window.BOKS_CHARACTER_RENDERER?.render({
      characterId: 'boks',
      action: resolvedState.action,
      direction: resolvedState.direction
    }) || '';
  }

  function drawBackgroundLevel1() {
    const canvas = document.getElementById('bgCanvas');
    const grid = document.getElementById('gameGrid');
    if (!canvas || !grid) return;

    const rect = grid.getBoundingClientRect();
    const wrap = document.getElementById('gridWrap').getBoundingClientRect();
    const S = Math.round(rect.width);
    if (!S) return;

    canvas.width = S;
    canvas.height = S;
    canvas.style.left = (rect.left - wrap.left) + 'px';
    canvas.style.top = (rect.top - wrap.top) + 'px';
    canvas.style.width = S + 'px';
    canvas.style.height = S + 'px';
    const cx = canvas.getContext('2d');

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

  window.goalSVGLevel1 = goalSVGLevel1;
  window.renderCharacterLevel1 = renderCharacterLevel1;
  window.drawBackgroundLevel1 = drawBackgroundLevel1;

  window.BOKS_LEVELS = window.BOKS_LEVELS || {};
  window.BOKS_LEVELS.level1 = {
    id: 'level1',
    name: 'Prato Base',
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
      '--scene-grid-wrap-bg': '#d7efba',
      '--grid-bg': '#b7e48c',
      '--cell-bg': '#cfeaa5',
      '--cell-edge': 'rgba(114, 164, 72, 0.5)',
      '--cell-hi-bg': 'rgba(255, 247, 173, 0.88)',
      '--cell-hi-edge': '#d4bc44',
      '--cell-hi-ring': 'rgba(212,188,68,0.5)'
    },
    decorateCell: function (cell, x, y) {
      if ((x + y) % 2 === 0) cell.classList.add('decor-grass');
      if ((x * 3 + y * 2) % 7 === 0) cell.classList.add('decor-flower');
      if ((x * 5 + y) % 9 === 0) cell.classList.add('decor-stone');
    },
    renderGoal: goalSVGLevel1,
    renderSprite: renderCharacterLevel1,
    renderBackground: drawBackgroundLevel1
  };
})();
