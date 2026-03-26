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
  const baseLeft = {
    ...baseRight,
    transformFallback: 'mirror-x'
  };
  const baseUp = {
    ...baseRight,
    transformFallback: 'rotate-left'
  };
  const baseDown = {
    ...baseRight,
    transformFallback: 'rotate-right'
  };

  window.BOKS_CHARACTER_DEFS.boks_base = {
    id: 'boks_base',
    label: 'Boks Base',
    hint: 'Placeholder direzionale',
    defaultAction: 'idle',
    defaultDirection: 'right',
    states: {
      'idle:right': { ...baseRight },
      'idle:left': { ...baseLeft },
      'idle:up': { ...baseUp },
      'idle:down': { ...baseDown },
      'move:right': { ...baseRight },
      'move:left': { ...baseLeft },
      'move:up': { ...baseUp },
      'move:down': { ...baseDown },
      'turn:right': { ...baseRight },
      'turn:left': { ...baseLeft },
      'turn:up': { ...baseUp },
      'turn:down': { ...baseDown }
    }
  };
})();
