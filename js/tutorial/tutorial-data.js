(() => {
  window.BOKS_TUTORIAL_DATA = {
  "intro": {
    "id": "sequence_5",
    "title": "Turnright",
    "beats": [
      {
        "id": "setup-1-boks",
        "type": "call",
        "action": "revealBoks"
      },
      {
        "id": "setup-2-forward_block",
        "type": "call",
        "action": "revealForwardBlock"
      },
      {
        "id": "setup-5-slot",
        "type": "call",
        "action": "revealSlot"
      },
      {
        "id": "setup-6-play_button",
        "type": "call",
        "action": "revealPlayButton"
      },
      {
        "id": "setup-unlock-1-double_tap_boks",
        "type": "call",
        "action": "unlockBoksDoubleClick"
      },
      {
        "id": "setup-unlock-2-drag_block",
        "type": "call",
        "action": "unlockDragBlock"
      },
      {
        "id": "setup-unlock-3-press_play",
        "type": "call",
        "action": "unlockPlay"
      },
      {
        "id": "setup-program-main-1-forward",
        "type": "call",
        "action": "setMainProgramSlot",
        "target": "0:forward"
      },
      {
        "id": "01-but-what",
        "type": "narration",
        "text": "But what",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/tutorial_29_but_what_if.mp3"
      },
      {
        "id": "02-well-in-tha-case",
        "type": "narration",
        "text": "Well, in tha case",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/tutorial_30_well...mp3"
      },
      {
        "id": "03-forward-block",
        "type": "call",
        "action": "hideElement",
        "target": "forward_block"
      },
      {
        "id": "04-right-block",
        "type": "call",
        "action": "revealRightBlock"
      }
    ]
  }
};
})();
