(function () {
  function renderGoalCharacterBadge({
    shadow = 'rgba(255, 219, 111, 0.32)'
  } = {}) {
    return `
      <span class="goal-bubble" aria-hidden="true" style="--goal-bubble-shadow:${shadow};">
        <span class="goal-light">
          <span class="goal-light__bloom"></span>
          <span class="goal-light__rays"></span>
          <span class="goal-light__core"></span>
          <span class="goal-light__speck goal-light__speck--a"></span>
          <span class="goal-light__speck goal-light__speck--b"></span>
          <span class="goal-light__speck goal-light__speck--c"></span>
          <span class="goal-light__speck goal-light__speck--d"></span>
        </span>
        <span class="goal-bubble__glow"></span>
        <span class="goal-bubble__burst goal-bubble__burst--ring"></span>
        <span class="goal-bubble__burst goal-bubble__burst--a"></span>
        <span class="goal-bubble__burst goal-bubble__burst--b"></span>
        <span class="goal-bubble__burst goal-bubble__burst--c"></span>
        <span class="goal-bubble__burst goal-bubble__burst--d"></span>
        <span class="goal-bubble__shell">
          <span class="goal-bubble__flower"></span>
        </span>
      </span>
    `;
  }

  function renderGoalCharacterIcon({
    size = 38,
    shadow = 'rgba(255, 219, 111, 0.26)'
  } = {}) {
    return `
      <span aria-hidden="true" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;overflow:visible;">
        <span style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;overflow:visible;">
          <span style="position:absolute;width:${Math.round(size * 0.9)}px;height:${Math.round(size * 0.9)}px;border-radius:999px;background:radial-gradient(circle, rgba(255,248,193,0.98) 0%, rgba(255,232,128,0.46) 40%, rgba(255,208,92,0) 72%);box-shadow:0 0 12px 2px ${shadow};"></span>
          <span style="position:absolute;width:${Math.round(size * 0.68)}px;height:${Math.round(size * 0.68)}px;border-radius:999px;background:radial-gradient(circle at 33% 28%, rgba(255,255,255,0.96) 0 8%, rgba(255,255,255,0) 10%), radial-gradient(circle at 68% 70%, rgba(110,220,255,0.22) 0 13%, rgba(110,220,255,0) 15%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.22) 0 58%, rgba(255,255,255,0.08) 69%, rgba(255,255,255,0) 76%);border:1px solid rgba(255,255,255,0.72);box-shadow:inset 0 1px 3px rgba(255,255,255,0.48), 0 0 10px rgba(189,245,255,0.34);"></span>
          <span style="position:absolute;width:${Math.round(size * 0.28)}px;height:${Math.round(size * 0.28)}px;border-radius:999px;background:radial-gradient(circle at 50% 50%, #f3c341 0 18%, transparent 20%), radial-gradient(circle at 50% 10%, rgba(255,120,120,0.96) 0 13%, transparent 15%), radial-gradient(circle at 84% 38%, rgba(255,92,92,0.96) 0 13%, transparent 15%), radial-gradient(circle at 72% 82%, rgba(255,74,74,0.96) 0 13%, transparent 15%), radial-gradient(circle at 28% 82%, rgba(255,110,110,0.96) 0 13%, transparent 15%), radial-gradient(circle at 16% 38%, rgba(255,58,58,0.96) 0 13%, transparent 15%);"></span>
        </span>
      </span>
    `;
  }

  function renderGoalCharacterPreviewSvg({
    x = 0,
    y = 0,
    size = 20,
    clipId = 'goal-preview'
  } = {}) {
    const glowSize = size * 0.96;
    const bubbleSize = size * 0.76;
    const flowerSize = size * 0.3;
    const safeGlowId = `${String(clipId).replace(/[^a-z0-9_-]+/gi, '-')}-glow`;
    return `
      <defs>
        <radialGradient id="${safeGlowId}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(255,248,193,0.98)"/>
          <stop offset="38%" stop-color="rgba(255,232,128,0.84)"/>
          <stop offset="70%" stop-color="rgba(255,208,92,0.26)"/>
          <stop offset="100%" stop-color="rgba(255,208,92,0)"/>
        </radialGradient>
      </defs>
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(glowSize / 2).toFixed(2)}" fill="url(#${safeGlowId})"/>
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(bubbleSize / 2).toFixed(2)}" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.72)" stroke-width="1.2"/>
      <circle cx="${(x - bubbleSize * 0.15).toFixed(2)}" cy="${(y - bubbleSize * 0.18).toFixed(2)}" r="${(bubbleSize * 0.08).toFixed(2)}" fill="rgba(255,255,255,0.92)"/>
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(flowerSize / 2).toFixed(2)}" fill="url(#${safeGlowId})" opacity="0.4"/>
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(flowerSize * 0.18).toFixed(2)}" fill="#f3c341"/>
    `;
  }

  function goalSVGLevel1() {
    return renderGoalCharacterBadge({
      shadow: 'rgba(255, 222, 115, 0.34)'
    });
  }

  function goalSVGCity() {
    return renderGoalCharacterBadge({
      shadow: 'rgba(146, 217, 255, 0.3)'
    });
  }

  function goalSVGUniverse() {
    return renderGoalCharacterBadge({
      shadow: 'rgba(169, 146, 255, 0.38)'
    });
  }

  function renderCharacter(state) {
    const resolvedState = typeof state === 'string'
      ? { direction: state, action: 'idle' }
      : { action: 'idle', ...(state || {}) };
    const characterId = typeof resolvedState.characterId === 'string' && resolvedState.characterId.trim()
      ? resolvedState.characterId.trim()
      : 'boks_green';
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

  function drawBackgroundBase() {
    const prepared = prepareBackgroundCanvas();
    if (!prepared) return;
    const { cx, size: S } = prepared;

    const bg = cx.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, '#f3ecdd');
    bg.addColorStop(1, '#e8dfcc');
    cx.fillStyle = bg;
    cx.fillRect(0, 0, S, S);
  }

  function decorateLevel1(cell, x, y) {
    if ((x + y) % 2 === 0) cell.classList.add('decor-grass');
    if ((x * 3 + y * 2) % 7 === 0) {
      cell.classList.add('decor-flower');
    }
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
  function decorateBase() {}

  window.goalSVGLevel1 = goalSVGLevel1;
  window.BOKS_GOAL_CHARACTER = {
    src: '',
    badgeMarkup: renderGoalCharacterBadge,
    iconMarkup: renderGoalCharacterIcon,
    previewSvgMarkup: renderGoalCharacterPreviewSvg
  };
  window.renderCharacterLevel1 = renderCharacter;
  window.drawBackgroundLevel1 = drawBackgroundLevel1;

  window.BOKS_LEVELS = window.BOKS_LEVELS || {};

  window.BOKS_LEVELS['level-base'] = {
    id: 'level-base',
    characterId: 'boks_green',
    name: 'Base',
    themeSelectable: true,
    themeLabel: 'Base',
    themeHint: 'Griglia semplice e neutra',
    thumbnailPalette: {
      scene: '#ede7d7',
      cellA: '#f7f1e5',
      cellB: '#efe6d4',
      cellStroke: '#d2c9b4',
      obstacleFill: '#d6c0a0',
      obstacleStroke: '#9d7b51',
      goalFill: '#5bc85a',
      goalStroke: '#3a8a39',
      startFill: '#fff8ee',
      startStroke: '#5aa24e'
    },
    sceneVars: {
      '--scene-body-bg': 'radial-gradient(140% 95% at 50% 0%, #f3ecdd 0%, #ece3d1 48%, #e8dfcc 100%)',
      '--bg-base': '#e8dfcc',
      '--panel-bg': '#ede7d7',
      '--panel-edge': '#d2c9b4',
      '--scene-grid-wrap-bg': '#ede7d7',
      '--grid-bg': '#d2c9b4',
      '--cell-bg': '#f7f1e5',
      '--cell-edge': 'rgba(156, 139, 109, 0.48)',
      '--cell-hi-bg': 'rgba(253, 181, 21, 0.22)',
      '--cell-hi-edge': '#fdb515',
      '--cell-hi-ring': 'rgba(253, 181, 21, 0.3)',
      '--grid-wrap-radius': '16px',
      '--grid-radius': '14px',
      '--cell-radius': '8px',
      '--obstacle-pattern-radius': '5px',
      '--obstacle-bg-top': 'rgba(214,192,160,0.96)',
      '--obstacle-bg-bottom': 'rgba(190,164,126,0.96)',
      '--obstacle-edge': 'rgba(133,104,67,0.74)',
      '--obstacle-pattern': 'rgba(125,95,57,0.32)'
    },
    decorateCell: decorateBase,
    renderGoal: goalSVGLevel1,
    renderSprite: renderCharacter,
    renderBackground: drawBackgroundBase
  };

  window.BOKS_LEVELS.level1 = {
    id: 'level1',
    characterId: 'boks_green',
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
    characterId: 'boks_city',
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
    characterId: 'boks_green',
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
    characterId: 'boks_green',
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
