(() => {
  window.BOKS_CHARACTER_DEFS = window.BOKS_CHARACTER_DEFS || {};

  const baseFit = {
    scale: 1.08,
    offsetX: 0,
    offsetY: 4
  };

  const boksBluIdleRight = {
    svgSrc: 'assets/characters/boks_blu/base-right-blu.svg',
    fit: { ...baseFit }
  };

  const boksBluIdleLeft = {
    svgSrc: 'assets/characters/boks_blu/base-left-blu.svg',
    fit: { ...baseFit }
  };

  const boksBluIdleUp = {
    svgSrc: 'assets/characters/boks_blu/base-up-blu.svg',
    fit: { ...baseFit, scale: 1.04, offsetY: 1 }
  };

  const boksBluIdleDown = {
    svgSrc: 'assets/characters/boks_blu/base-down-blu.svg',
    fit: { ...baseFit, scale: 1.1, offsetY: 6 }
  };

  const boksBluDef = {
    id: 'boks_blu',
    label: 'Boks Blu Cube',
    hint: 'Versione blu con viste direzionali dedicate',
    editorApproved: true,
    containerDrivenPose: false,
    defaultAction: 'idle',
    defaultDirection: 'right',
    states: {
      'idle:right': { ...boksBluIdleRight },
      'idle:left': { ...boksBluIdleLeft },
      'idle:up': { ...boksBluIdleUp },
      'idle:down': { ...boksBluIdleDown },
      'move:right': { ...boksBluIdleRight },
      'move:left': { ...boksBluIdleLeft },
      'move:up': { ...boksBluIdleUp },
      'move:down': { ...boksBluIdleDown },
      'turn:right': { ...boksBluIdleRight },
      'turn:left': { ...boksBluIdleLeft },
      'turn:up': { ...boksBluIdleUp },
      'turn:down': { ...boksBluIdleDown }
    }
  };

  window.BOKS_CHARACTER_DEFS.boks_blu = boksBluDef;
})();
