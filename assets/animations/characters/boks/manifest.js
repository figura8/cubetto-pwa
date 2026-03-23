(() => {
  window.BOKS_CHARACTER_DEFS = window.BOKS_CHARACTER_DEFS || {};

  window.BOKS_CHARACTER_DEFS.boks = {
    id: 'boks',
    defaultAction: 'idle',
    defaultDirection: 'right',
    states: {
      'idle:right': {
        src: 'assets/characters/boks/placeholder.png'
      },
      'idle:left': {
        src: 'assets/characters/boks/placeholder.png',
        transformFallback: 'mirror-x'
      },
      'idle:up': {
        src: 'assets/characters/boks/placeholder.png',
        transformFallback: 'rotate-left'
      },
      'idle:down': {
        src: 'assets/characters/boks/placeholder.png',
        transformFallback: 'rotate-right'
      },
      'move:right': {
        src: 'assets/characters/boks/placeholder.png',
        transformFallback: 'none'
      },
      'move:left': {
        src: 'assets/characters/boks/placeholder.png',
        transformFallback: 'mirror-x'
      },
      'move:up': {
        src: 'assets/characters/boks/placeholder.png',
        transformFallback: 'rotate-left'
      },
      'move:down': {
        src: 'assets/characters/boks/placeholder.png',
        transformFallback: 'rotate-right'
      },
      'turn:right': {
        src: 'assets/characters/boks/placeholder.png'
      },
      'turn:left': {
        src: 'assets/characters/boks/placeholder.png',
        transformFallback: 'mirror-x'
      },
      'turn:up': {
        src: 'assets/characters/boks/placeholder.png',
        transformFallback: 'rotate-left'
      },
      'turn:down': {
        src: 'assets/characters/boks/placeholder.png',
        transformFallback: 'rotate-right'
      }
    }
  };
})();
