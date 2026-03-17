(function () {
  function goalSVGLevel2() {
    return `<svg viewBox="0 0 72 72" style="width:72%;height:72%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35));">
      <g transform="translate(36 36)">
        <polygon points="0,-26 7,-8 26,-8 11,4 17,22 0,11 -17,22 -11,4 -26,-8 -7,-8"
          fill="#FFD84D" stroke="#E8A900" stroke-width="2" />
        <circle cx="-5" cy="-8" r="3" fill="rgba(255,255,255,0.45)"/>
      </g>
    </svg>`;
  }

  function svgRobotLevel2(o) {
    const rot = { right: 0, down: 90, left: 180, up: 270 };
    const deg = rot[o];
    return `<svg width="100%" height="100%" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${deg} 36 36)">
        <rect x="1" y="1" width="70" height="70" fill="#121a32" rx="10" stroke="#30477f" stroke-width="1"/>
        <circle cx="20" cy="24" r="2.2" fill="rgba(255,255,255,0.8)"/>
        <circle cx="15" cy="40" r="1.7" fill="rgba(255,255,255,0.7)"/>
        <circle cx="28" cy="48" r="1.4" fill="rgba(255,255,255,0.55)"/>

        <ellipse cx="36" cy="36" rx="16" ry="10" fill="#7ea9ff" stroke="#3b69c7" stroke-width="2"/>
        <ellipse cx="38" cy="36" rx="8" ry="7" fill="#d9f2ff" stroke="#6ea6db" stroke-width="1.2"/>
        <polygon points="20,36 11,31 11,41" fill="#6a90e6"/>
        <polygon points="52,36 60,32 60,40" fill="#ff6f6f"/>
        <polygon points="34,27 38,22 42,27" fill="#a7c6ff"/>
        <polygon points="34,45 38,50 42,45" fill="#a7c6ff"/>
      </g>
    </svg>`;
  }

  function drawBackgroundLevel2() {
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

    const bg = cx.createRadialGradient(S * 0.2, S * 0.1, S * 0.05, S * 0.5, S * 0.55, S * 0.9);
    bg.addColorStop(0, '#1e2f63');
    bg.addColorStop(0.45, '#17254d');
    bg.addColorStop(1, '#0f1733');
    cx.fillStyle = bg;
    cx.fillRect(0, 0, S, S);

    // nebulosa leggera
    const neb = cx.createRadialGradient(S * 0.78, S * 0.2, S * 0.03, S * 0.78, S * 0.2, S * 0.26);
    neb.addColorStop(0, 'rgba(120,180,255,0.24)');
    neb.addColorStop(1, 'rgba(120,180,255,0)');
    cx.fillStyle = neb;
    cx.fillRect(0, 0, S, S);

    // stelle sparse
    cx.save();
    for (let i = 0; i < 55; i++) {
      const x = (((i + 11) * 137) % 997) / 997 * S;
      const y = (((i + 17) * 223) % 991) / 991 * S;
      const r = (i % 5 === 0) ? 1.8 : 1.1;
      cx.fillStyle = i % 3 ? 'rgba(255,255,255,0.82)' : 'rgba(182,214,255,0.9)';
      cx.beginPath();
      cx.arc(x, y, r, 0, Math.PI * 2);
      cx.fill();
    }
    cx.restore();

    // griglia sottile per orientamento
    cx.save();
    cx.globalAlpha = 0.2;
    cx.strokeStyle = '#3a5087';
    cx.lineWidth = 1;
    const csz = S / 6;
    for (let i = 1; i < 6; i++) {
      cx.beginPath(); cx.moveTo(i * csz, 0); cx.lineTo(i * csz, S); cx.stroke();
      cx.beginPath(); cx.moveTo(0, i * csz); cx.lineTo(S, i * csz); cx.stroke();
    }
    cx.restore();
  }

  window.BOKS_LEVELS = window.BOKS_LEVELS || {};
  window.BOKS_LEVELS.level2 = {
    id: 'level2',
    name: 'Spazio',
    sceneVars: {
      '--scene-body-bg': 'radial-gradient(130% 90% at 50% 0%, #243a74 0%, #16264f 45%, #0d1633 100%)',
      '--scene-grid-wrap-bg': '#22325f',
      '--grid-bg': '#1b2b58',
      '--cell-bg': 'rgba(67, 94, 156, 0.34)',
      '--cell-edge': 'rgba(121, 154, 232, 0.45)',
      '--cell-hi-bg': 'rgba(168, 194, 255, 0.5)',
      '--cell-hi-edge': '#8db3ff',
      '--cell-hi-ring': 'rgba(141,179,255,0.6)'
    },
    decorateCell: function () {},
    renderGoal: goalSVGLevel2,
    renderSprite: svgRobotLevel2,
    renderBackground: drawBackgroundLevel2
  };
})();
