(() => {
  window.BOKS_TUTORIAL_DATA = {
  "intro": {
    "id": "orientation_intro",
    "title": "Orientation intro",
    "beats": [
      {
        "id": "01-hello-and-welcome",
        "type": "narration",
        "text": "Hello and welcome!!",
        "durationMs": 1800,
        "audio": "assets/audio/sfx/gameplay/01_hello_and_welcome.mp3"
      },
      {
        "id": "02-this-green-meadow-is-a-grid-where-our-frie",
        "type": "narration",
        "text": "This green meadow is a grid where our friend Bocs can move with your help!",
        "durationMs": 3400,
        "audio": "assets/audio/sfx/gameplay/02_this_green_meadow_is_a.mp3"
      },
      {
        "id": "03-boks",
        "type": "call",
        "action": "revealBoks"
      },
      {
        "id": "04-here-you-are",
        "type": "narration",
        "text": "Here you are!",
        "durationMs": 1600,
        "audio": "assets/audio/sfx/gameplay/03_here_you_are.mp3"
      },
      {
        "id": "05-okay-lets-see-what-happens-if-you-double-c",
        "type": "narration",
        "text": "Okay, let's see what happens if you double-click Bocs.",
        "durationMs": 2800,
        "audio": "assets/audio/sfx/gameplay/04_okay_lets_see_what_happens.mp3"
      },
      {
        "id": "06-unlock",
        "type": "call",
        "action": "unlockBoksDoubleClick"
      },
      {
        "id": "07-boks-double-tapped",
        "type": "waitFor",
        "event": "boks-turned",
        "count": 1
      },
      {
        "id": "08-lock",
        "type": "call",
        "action": "lockBoksDoubleClick"
      },
      {
        "id": "09-pause",
        "type": "pause",
        "durationMs": 500
      },
      {
        "id": "10-did-you-see",
        "type": "narration",
        "text": "Did you see?",
        "durationMs": 1600,
        "audio": "assets/audio/sfx/gameplay/05_did_you_see.mp3"
      },
      {
        "id": "11-now-look-down",
        "type": "narration",
        "text": "Now look down!",
        "durationMs": 1500,
        "audio": "assets/audio/sfx/gameplay/06_now_look_down.mp3"
      },
      {
        "id": "12-and-what-happens-if-you-try-again",
        "type": "narration",
        "text": "And what happens if you try again?",
        "durationMs": 2300,
        "audio": "assets/audio/sfx/gameplay/07_and_what_happens_if_you.mp3"
      },
      {
        "id": "13-unlock",
        "type": "call",
        "action": "unlockBoksDoubleClick"
      },
      {
        "id": "14-boks-double-tapped",
        "type": "waitFor",
        "event": "boks-turned",
        "count": 1
      },
      {
        "id": "15-lock",
        "type": "call",
        "action": "lockBoksDoubleClick"
      },
      {
        "id": "16-pause",
        "type": "pause",
        "durationMs": 500
      },
      {
        "id": "17-oh-yes-now-bocs-looks-to-your-left",
        "type": "narration",
        "text": "Oh, yes, now Bocs looks to your left.",
        "durationMs": 2600,
        "audio": "assets/audio/sfx/gameplay/08_oh_yes_now_bocs_looks.mp3"
      },
      {
        "id": "18-every-time-you-double-click-bocs-he-turns-",
        "type": "narration",
        "text": "Every time you double-click Bocs, he turns around and looks in a different direction.",
        "durationMs": 4600,
        "audio": "assets/audio/sfx/gameplay/09_every_time_you_double_click.mp3"
      },
      {
        "id": "19-unlock",
        "type": "call",
        "action": "unlockBoksDoubleClick"
      },
      {
        "id": "20-boks-double-tapped",
        "type": "waitFor",
        "event": "boks-facing-start",
        "count": 1
      },
      {
        "id": "21-lock",
        "type": "call",
        "action": "lockBoksDoubleClick"
      },
      {
        "id": "22-okay-now-bocs-would-like-to-explore-the-wo",
        "type": "narration",
        "text": "Okay, now Bocs would like to explore the world around him a little.",
        "durationMs": 3600,
        "audio": "assets/audio/sfx/gameplay/10_okay_now_bocs_would_like.mp3"
      },
      {
        "id": "23-pause",
        "type": "pause",
        "durationMs": 2000
      },
      {
        "id": "24-but-to-move-he-needs-your-help",
        "type": "narration",
        "text": "But to move, he needs your help.",
        "durationMs": 2400,
        "audio": "assets/audio/sfx/gameplay/11_but_to_move_he_needs.mp3"
      },
      {
        "id": "25-pause",
        "type": "pause",
        "durationMs": 2000
      },
      {
        "id": "26-we-have-to-tell-bocs-where-to-go-and-well-",
        "type": "narration",
        "text": "We have to tell Bocs where to go, and we'll need this.",
        "durationMs": 3600,
        "audio": "assets/audio/sfx/gameplay/12_we_have_to_tell_bocs.mp3"
      },
      {
        "id": "27-pause",
        "type": "pause",
        "durationMs": 2000
      },
      {
        "id": "28-forward-block",
        "type": "call",
        "action": "revealForwardBlock"
      },
      {
        "id": "29-pause",
        "type": "pause",
        "durationMs": 2000
      },
      {
        "id": "30-slot",
        "type": "call",
        "action": "revealSlot"
      },
      {
        "id": "31-pause",
        "type": "pause",
        "durationMs": 1500
      },
      {
        "id": "32-now-try-dragging-that-block-into-the-slot",
        "type": "narration",
        "text": "Now try dragging that block into the slot.",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/13_now_try_dragging_that_block.mp3"
      },
      {
        "id": "33-unlock",
        "type": "call",
        "action": "unlockDragBlock"
      },
      {
        "id": "34-block-dropped-in-slot",
        "type": "waitFor",
        "event": "block-dropped",
        "count": 1
      },
      {
        "id": "35-lock",
        "type": "call",
        "action": "lockDragBlock"
      },
      {
        "id": "36-pause",
        "type": "pause",
        "durationMs": 1000
      },
      {
        "id": "37-great-now-lets-see-where-bocs-goes",
        "type": "narration",
        "text": "Great! Now let's see where Bocs goes.",
        "durationMs": 2600,
        "audio": "assets/audio/sfx/gameplay/14_great_now_lets_see_where.mp3"
      },
      {
        "id": "38-pause",
        "type": "pause",
        "durationMs": 1500
      },
      {
        "id": "39-play-button",
        "type": "call",
        "action": "revealPlayButton"
      },
      {
        "id": "40-unlock",
        "type": "call",
        "action": "unlockPlay"
      },
      {
        "id": "41-play-pressed",
        "type": "waitFor",
        "event": "play-pressed",
        "count": 1
      },
      {
        "id": "42-lock",
        "type": "call",
        "action": "lockPlay"
      },
      {
        "id": "43-program-execution-finished",
        "type": "waitFor",
        "event": "execution-finished",
        "count": 1
      },
      {
        "id": "44-pause",
        "type": "pause",
        "durationMs": 1200
      },
      {
        "id": "45-now-theres-a-place-bocs-wants-to-reach-can",
        "type": "narration",
        "text": "Now there's a place Bocs wants to reach. Can you help him get there?",
        "durationMs": 4000,
        "audio": "assets/audio/sfx/gameplay/15_now_theres_a_place_bocs.mp3"
      },
      {
        "id": "46-goal",
        "type": "call",
        "action": "revealGoal"
      },
      {
        "id": "47-pause",
        "type": "pause",
        "durationMs": 2000
      },
      {
        "id": "48-unlock",
        "type": "call",
        "action": "unlockAll"
      }
    ]
  }
};
})();
