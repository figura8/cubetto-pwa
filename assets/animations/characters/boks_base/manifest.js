(() => {
  window.BOKS_CHARACTER_DEFS = window.BOKS_CHARACTER_DEFS || {};

  const baseRight = {
    src: 'assets/characters/boks_base/base-right.svg',
    fit: {
      scale: 1,
      offsetX: 0,
      offsetY: 0
    }
  };

  window.BOKS_CHARACTER_DEFS.boks_base = {
    id: 'boks_base',
    label: 'Boks Base',
    hint: 'Placeholder direzionale',
    containerDrivenPose: true,
    defaultAction: 'idle',
    defaultDirection: 'right',
    states: {
      'idle:right': { ...baseRight },
      'idle:left': { ...baseRight },
      'idle:up': { ...baseRight },
      'idle:down': { ...baseRight },
      'move:right': { ...baseRight },
      'move:left': { ...baseRight },
      'move:up': { ...baseRight },
      'move:down': { ...baseRight },
      'turn:right': { ...baseRight },
      'turn:left': { ...baseRight },
      'turn:up': { ...baseRight },
      'turn:down': { ...baseRight }
    }
  };
})();
