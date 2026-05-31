(() => {
  window.BOKS_TUTORIAL_DATA = {
  "intro": {
    "id": "sequence_3",
    "title": "Sequence",
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
        "id": "01-its-called-a-sequence",
        "type": "narration",
        "text": "its called a sequence",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/01_its_called_a_sequence.mp3"
      },
      {
        "id": "02-try-to-put-in-here",
        "type": "narration",
        "text": "Try to put in here",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/02_try_to_put_in_here.mp3"
      },
      {
        "id": "03-slot",
        "type": "call",
        "action": "highlightElement",
        "target": "slot"
      },
      {
        "id": "04-unlock-1",
        "type": "call",
        "action": "unlockDragBlock"
      },
      {
        "id": "05-hand-hint",
        "type": "call",
        "action": "showDragHandHint"
      },
      {
        "id": "06-block-dropped-in-slot",
        "type": "waitFor",
        "event": "block-dropped",
        "count": 1
      },
      {
        "id": "07-clear-hand-hint",
        "type": "call",
        "action": "clearHandHint"
      },
      {
        "id": "08-ok-perfect-now-we-have-have-our-first-inst",
        "type": "narration",
        "text": "Ok, perfect. Now we have have our first instruction ready",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/03_narration.mp3"
      },
      {
        "id": "09-but-how-do-we-see-in-action",
        "type": "narration",
        "text": "But how do we see in action?",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/tutorial_21_But_do_we_see_in_action.mp3"
      },
      {
        "id": "10-pause",
        "type": "pause",
        "durationMs": 500
      },
      {
        "id": "11-we-need-this",
        "type": "narration",
        "text": "We need this",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/tutorial_22_we_need_this.mp3"
      },
      {
        "id": "12-play",
        "type": "call",
        "action": "revealPlayButton"
      },
      {
        "id": "13-play",
        "type": "call",
        "action": "highlightElement",
        "target": "play"
      }
    ]
  }
};
})();
