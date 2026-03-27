(() => {
  window.BOKS_CHARACTER_DEFS = window.BOKS_CHARACTER_DEFS || {};

  const boksBlackIdleRight = {
    svgMarkup: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true">
        <style>
          .boks-black-blink {
            transform-box: fill-box;
            transform-origin: center;
            animation: boksBlackBlink 10s infinite;
          }
          .boks-black-pupil {
            animation: boksBlackPupil 10s infinite;
          }
          @keyframes boksBlackBlink {
            0%, 22%, 25.5%, 71%, 75%, 100% { transform: scaleY(1); }
            23.5% { transform: scaleY(0.08); }
            72.5% { transform: scaleY(0.12); }
          }
          @keyframes boksBlackPupil {
            0%, 8% { transform: translate(10px, -2px); }
            9%, 11% { transform: translate(-17px, -15px); }
            14%, 18% { transform: translate(-8px, -8px); }
            20%, 22% { transform: translate(18px, 4px); }
            24%, 27% { transform: translate(6px, -1px); }
            34%, 38% { transform: translate(22px, -13px); }
            40%, 46% { transform: translate(12px, -6px); }
            54%, 58% { transform: translate(-19px, 11px); }
            60%, 66% { transform: translate(-7px, 6px); }
            69%, 71% { transform: translate(21px, -10px); }
            73%, 77% { transform: translate(8px, -3px); }
            84%, 88% { transform: translate(24px, 12px); }
            90%, 100% { transform: translate(10px, -2px); }
          }
        </style>
        <rect width="512" height="512" fill="#000"/>
        <g transform="translate(420 257.5)">
          <g class="boks-black-blink">
            <ellipse cx="0" cy="0" rx="52" ry="54" fill="#fff"/>
            <g class="boks-black-pupil">
              <ellipse cx="0" cy="0" rx="21" ry="19.8" fill="#000"/>
              <ellipse cx="-6" cy="-5" rx="4.8" ry="4.4" fill="#fff" opacity="0.18"/>
            </g>
          </g>
          <ellipse cx="0" cy="0" rx="63.8" ry="66.6" fill="none" stroke="#fff" stroke-width="2"/>
        </g>
      </svg>
    `,
    fit: {
      scale: 1,
      offsetX: 0,
      offsetY: 0
    }
  };

  window.BOKS_CHARACTER_DEFS.boks_black = {
    id: 'boks_black',
    label: 'Boks Black',
    hint: 'Static lightweight placeholder',
    containerDrivenPose: true,
    defaultAction: 'idle',
    defaultDirection: 'right',
    states: {
      'idle:right': { ...boksBlackIdleRight },
      'idle:left': { ...boksBlackIdleRight },
      'idle:up': { ...boksBlackIdleRight },
      'idle:down': { ...boksBlackIdleRight },
      'move:right': { ...boksBlackIdleRight },
      'move:left': { ...boksBlackIdleRight },
      'move:up': { ...boksBlackIdleRight },
      'move:down': { ...boksBlackIdleRight },
      'turn:right': { ...boksBlackIdleRight },
      'turn:left': { ...boksBlackIdleRight },
      'turn:up': { ...boksBlackIdleRight },
      'turn:down': { ...boksBlackIdleRight }
    }
  };
})();
