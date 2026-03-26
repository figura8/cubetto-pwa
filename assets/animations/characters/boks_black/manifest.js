(() => {
  window.BOKS_CHARACTER_DEFS = window.BOKS_CHARACTER_DEFS || {};

  const boksBlackIdleRight = {
    lottieSrc: 'assets/animations/characters/boks_black/boks_black_idle_right.json',
    lottieLoop: true,
    lottieAutoplay: true,
    lottieRenderer: 'svg',
    fit: {
      scale: 1,
      offsetX: 0,
      offsetY: 0
    }
  };

  window.BOKS_CHARACTER_DEFS.boks_black = {
    id: 'boks_black',
    label: 'Boks Black',
    hint: 'Solo idle right (placeholder mode)',
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
