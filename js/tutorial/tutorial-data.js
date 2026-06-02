(() => {
  window.BOKS_TUTORIAL_DATA = {
  "intro": {
    "id": "orientation_intro",
    "title": "INTRO",
    "beats": [
      {
        "id": "0-0-hello-and-welcome",
        "type": "narration",
        "text": "Hello and welcome!!",
        "durationMs": 1800,
        "audio": "assets/audio/sfx/gameplay/01_hello_and_welcome.mp3"
      },
      {
        "id": "0-1-this-green-meadow-is-a-grid-where-our-frie",
        "type": "narration",
        "text": "This green meadow is a grid where our friend Bocs can move with your help!",
        "durationMs": 3400,
        "audio": "assets/audio/sfx/gameplay/02_this_green_meadow_is_a.mp3"
      },
      {
        "id": "0-2-boks",
        "type": "call",
        "action": "revealBoks"
      },
      {
        "id": "0-3-here-you-are",
        "type": "narration",
        "text": "Here you are!",
        "durationMs": 1600,
        "audio": "assets/audio/sfx/gameplay/03_here_you_are.mp3"
      },
      {
        "id": "1-0-ok-now-boks",
        "type": "narration",
        "text": "Ok, now BOKS",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/01_ok_now_boks.mp3"
      },
      {
        "id": "1-1-but-to-get",
        "type": "narration",
        "text": "But to get",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/02_but_to_get.mp3"
      },
      {
        "id": "1-2-we-need",
        "type": "narration",
        "text": "We need",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/03_we_need.mp3"
      },
      {
        "id": "1-3-forward-block",
        "type": "call",
        "action": "revealForwardBlock"
      },
      {
        "id": "1-4-forward-block",
        "type": "call",
        "action": "highlightElement",
        "target": "forward_block"
      },
      {
        "id": "1-5-this-little-green-piece",
        "type": "narration",
        "text": "This little green piece",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/04_this_little_green_piece.mp3"
      },
      {
        "id": "1-6-try-clicking",
        "type": "narration",
        "text": "Try clicking",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/05_try_clicking.mp3"
      },
      {
        "id": "1-7-unlock-1",
        "type": "call",
        "action": "unlockDragBlock"
      },
      {
        "id": "1-8-block-released-without-slot",
        "type": "waitFor",
        "event": "block-drop-failed",
        "count": 2
      },
      {
        "id": "1-9-lock-1",
        "type": "call",
        "action": "lockBoksDoubleClick"
      },
      {
        "id": "1-9-lock-2",
        "type": "call",
        "action": "lockDragBlock"
      },
      {
        "id": "1-9-lock-3",
        "type": "call",
        "action": "lockPlay"
      },
      {
        "id": "1-10-nope",
        "type": "narration",
        "text": "Nope",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/06_nope.mp3"
      },
      {
        "id": "1-11-we-need",
        "type": "narration",
        "text": "We need",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/07_we_need.mp3"
      },
      {
        "id": "1-12-slot",
        "type": "call",
        "action": "revealSlot"
      },
      {
        "id": "1-13-slot",
        "type": "call",
        "action": "highlightElement",
        "target": "slot"
      },
      {
        "id": "2-0-its-called-a-sequence",
        "type": "narration",
        "text": "its called a sequence",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/01_its_called_a_sequence.mp3"
      },
      {
        "id": "2-1-try-to-put-in-here",
        "type": "narration",
        "text": "Try to put in here",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/02_try_to_put_in_here.mp3"
      },
      {
        "id": "2-2-slot",
        "type": "call",
        "action": "highlightElement",
        "target": "slot"
      },
      {
        "id": "2-3-unlock-1",
        "type": "call",
        "action": "unlockDragBlock"
      },
      {
        "id": "2-4-hand-hint",
        "type": "call",
        "action": "showDragHandHint"
      },
      {
        "id": "2-5-block-dropped-in-slot",
        "type": "waitFor",
        "event": "block-dropped",
        "count": 1
      },
      {
        "id": "2-6-clear-hand-hint",
        "type": "call",
        "action": "clearHandHint"
      },
      {
        "id": "2-7-ok-perfect-now-we-have-have-our-first-inst",
        "type": "narration",
        "text": "Ok, perfect. Now we have have our first instruction ready",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/03_narration.mp3"
      },
      {
        "id": "2-8-but-how-do-we-see-in-action",
        "type": "narration",
        "text": "But how do we see in action?",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/tutorial_21_But_do_we_see_in_action.mp3"
      },
      {
        "id": "2-9-pause",
        "type": "pause",
        "durationMs": 500
      },
      {
        "id": "2-10-we-need-this",
        "type": "narration",
        "text": "We need this",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/tutorial_22_we_need_this.mp3"
      },
      {
        "id": "2-11-play",
        "type": "call",
        "action": "revealPlayButton"
      },
      {
        "id": "2-12-play",
        "type": "call",
        "action": "highlightElement",
        "target": "play"
      },
      {
        "id": "3-0-its-play",
        "type": "narration",
        "text": "Its Play!",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/01_its_play.mp3"
      },
      {
        "id": "3-1-play-is-a-button",
        "type": "narration",
        "text": "Play is a button",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/02_play_is_a_button.mp3"
      },
      {
        "id": "3-2-come-on-click-on-play",
        "type": "narration",
        "text": "Come on! click on play",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/03_come_on_click_on_play.mp3"
      },
      {
        "id": "3-3-unlock-1",
        "type": "call",
        "action": "unlockPlay"
      },
      {
        "id": "3-4-hand-hint",
        "type": "call",
        "action": "showPlayHandHint"
      },
      {
        "id": "3-5-play-pressed",
        "type": "waitFor",
        "event": "play-pressed",
        "count": 1
      },
      {
        "id": "3-6-program-execution-finished",
        "type": "waitFor",
        "event": "execution-finished",
        "count": 1
      },
      {
        "id": "3-7-clear-hand-hint",
        "type": "call",
        "action": "clearHandHint"
      },
      {
        "id": "3-8-lock-1",
        "type": "call",
        "action": "lockBoksDoubleClick"
      },
      {
        "id": "3-8-lock-2",
        "type": "call",
        "action": "lockDragBlock"
      },
      {
        "id": "3-8-lock-3",
        "type": "call",
        "action": "lockPlay"
      },
      {
        "id": "3-9-cool",
        "type": "narration",
        "text": "Cool!",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/04_cool.mp3"
      },
      {
        "id": "3-10-now-thanks-to-you",
        "type": "narration",
        "text": "Now thanks to you",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/05_now_thanks_to_you.mp3"
      },
      {
        "id": "4-0-but-if",
        "type": "narration",
        "text": "But If",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/01_but_if.mp3"
      },
      {
        "id": "4-1-we-need-aother",
        "type": "narration",
        "text": "We need aother",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/02_we_need_aother.mp3"
      },
      {
        "id": "4-2-turn-right",
        "type": "call",
        "action": "revealRightBlock"
      },
      {
        "id": "4-3-ok-try",
        "type": "narration",
        "text": "Ok, try",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/03_ok_try.mp3"
      },
      {
        "id": "4-4-unlock-1",
        "type": "call",
        "action": "unlockDragBlock"
      },
      {
        "id": "4-5-block-dropped-in-slot",
        "type": "waitFor",
        "event": "block-dropped",
        "count": 1,
        "target": "right"
      },
      {
        "id": "4-6-lock-1",
        "type": "call",
        "action": "lockBoksDoubleClick"
      },
      {
        "id": "4-6-lock-2",
        "type": "call",
        "action": "lockDragBlock"
      },
      {
        "id": "4-6-lock-3",
        "type": "call",
        "action": "lockPlay"
      },
      {
        "id": "4-7-great",
        "type": "narration",
        "text": "Great",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/04_great.mp3"
      },
      {
        "id": "4-8-now-lets-see-in-action-click-play",
        "type": "narration",
        "text": "Now lets see in action> Click play",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/05_now_lets_see_in_action.mp3"
      },
      {
        "id": "4-9-unlock-1",
        "type": "call",
        "action": "unlockPlay"
      },
      {
        "id": "4-10-program-execution-finished",
        "type": "waitFor",
        "event": "execution-finished",
        "count": 1
      },
      {
        "id": "4-11-lock-1",
        "type": "call",
        "action": "lockBoksDoubleClick"
      },
      {
        "id": "4-11-lock-2",
        "type": "call",
        "action": "lockDragBlock"
      },
      {
        "id": "4-11-lock-3",
        "type": "call",
        "action": "lockPlay"
      },
      {
        "id": "4-12-good",
        "type": "narration",
        "text": "good",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/06_good.mp3"
      },
      {
        "id": "4-13-pause",
        "type": "pause",
        "durationMs": 1000
      },
      {
        "id": "4-14-lets-add-anothe-brick",
        "type": "narration",
        "text": "Lets add anothe brick",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/07_lets_add_anothe_brick.mp3"
      },
      {
        "id": "4-15-turn-left",
        "type": "call",
        "action": "revealLeftBlock"
      },
      {
        "id": "4-16-ok-here-it-sis",
        "type": "narration",
        "text": "ok, here it sis",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/08_ok_here_it_sis.mp3"
      },
      {
        "id": "4-17-now-you-know",
        "type": "narration",
        "text": "Now you know",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/now_you_know_how.mp3"
      },
      {
        "id": "4-18-unlock-1",
        "type": "call",
        "action": "unlockDragBlock"
      },
      {
        "id": "4-19-block-dropped-in-slot",
        "type": "waitFor",
        "event": "block-dropped",
        "count": 1,
        "target": "left"
      },
      {
        "id": "4-20-lock-1",
        "type": "call",
        "action": "lockBoksDoubleClick"
      },
      {
        "id": "4-20-lock-2",
        "type": "call",
        "action": "lockDragBlock"
      },
      {
        "id": "4-20-lock-3",
        "type": "call",
        "action": "lockPlay"
      },
      {
        "id": "4-21-ok-click-play",
        "type": "narration",
        "text": "Ok, click play",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/tutorial_38_ok_click_play.mp3"
      },
      {
        "id": "4-22-unlock-1",
        "type": "call",
        "action": "unlockPlay"
      },
      {
        "id": "4-23-program-execution-finished",
        "type": "waitFor",
        "event": "execution-finished",
        "count": 1
      },
      {
        "id": "4-24-lock-1",
        "type": "call",
        "action": "lockBoksDoubleClick"
      },
      {
        "id": "4-24-lock-2",
        "type": "call",
        "action": "lockDragBlock"
      },
      {
        "id": "4-24-lock-3",
        "type": "call",
        "action": "lockPlay"
      },
      {
        "id": "4-25-great",
        "type": "narration",
        "text": "Great",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/11_great.mp3"
      },
      {
        "id": "5-0-now-you-know",
        "type": "narration",
        "text": "Now you know",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/01_now_you_know.mp3"
      },
      {
        "id": "5-1-but",
        "type": "narration",
        "text": "But..",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/02_but.mp3"
      },
      {
        "id": "5-2-function-block",
        "type": "call",
        "action": "revealFunctionBlock"
      },
      {
        "id": "5-3-function-block",
        "type": "call",
        "action": "highlightElement",
        "target": "function_block"
      },
      {
        "id": "5-4-pause",
        "type": "pause",
        "durationMs": 500
      },
      {
        "id": "5-5-a-function-is",
        "type": "narration",
        "text": "a function is...",
        "durationMs": 8000,
        "audio": "assets/audio/sfx/gameplay/03_a_function_is.mp3"
      },
      {
        "id": "5-6-we-put",
        "type": "narration",
        "text": "we put",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/04_we_put.mp3"
      },
      {
        "id": "5-7-so-instead",
        "type": "narration",
        "text": "So...instead",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/04_so_instead.mp3"
      },
      {
        "id": "5-8-first",
        "type": "narration",
        "text": "First",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/05_first.mp3"
      },
      {
        "id": "5-9-and-then",
        "type": "narration",
        "text": "and then..",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/06_and_then.mp3"
      },
      {
        "id": "5-10-function-area",
        "type": "call",
        "action": "highlightElement",
        "target": "function_area"
      },
      {
        "id": "5-11-unlock-1",
        "type": "call",
        "action": "unlockDragBlock"
      },
      {
        "id": "5-12-unlock-1",
        "type": "call",
        "action": "unlockPlay"
      },
      {
        "id": "5-13-function-area",
        "type": "call",
        "action": "revealFunctionArea"
      },
      {
        "id": "5-14-block-dropped-in-slot",
        "type": "waitFor",
        "event": "block-dropped",
        "count": 1,
        "targetZone": "fn"
      },
      {
        "id": "5-15-play-pressed",
        "type": "waitFor",
        "event": "play-pressed",
        "count": 1,
        "condition": "function_ready"
      },
      {
        "id": "5-16-program-execution-finished",
        "type": "waitFor",
        "event": "execution-finished",
        "count": 1
      },
      {
        "id": "5-17-lock-1",
        "type": "call",
        "action": "lockBoksDoubleClick"
      },
      {
        "id": "5-17-lock-2",
        "type": "call",
        "action": "lockDragBlock"
      },
      {
        "id": "5-17-lock-3",
        "type": "call",
        "action": "lockPlay"
      },
      {
        "id": "5-18-ok-great",
        "type": "narration",
        "text": "ok, great",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/07_ok_great.mp3"
      },
      {
        "id": "setup-delta-program-main-1-right",
        "type": "call",
        "action": "setMainProgramSlot",
        "target": "0:right"
      },
      {
        "id": "6-0-now",
        "type": "narration",
        "text": "now",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/01_now.mp3"
      },
      {
        "id": "6-1-let-place",
        "type": "narration",
        "text": "let place",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/02_let_place.mp3"
      },
      {
        "id": "6-2-boks",
        "type": "call",
        "action": "setBoksPosition",
        "target": "0:1"
      },
      {
        "id": "6-3-and-the-little-bubble",
        "type": "narration",
        "text": "and the little bubble\n",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/03_and_the_little_bubble.mp3"
      },
      {
        "id": "6-4-goal",
        "type": "call",
        "action": "setGoalPosition",
        "target": "2:4"
      },
      {
        "id": "6-5-goal",
        "type": "call",
        "action": "revealGoal"
      },
      {
        "id": "6-6-use-all-the-commands",
        "type": "narration",
        "text": "use all the commands",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/04_use_all_the_commands.mp3"
      },
      {
        "id": "6-7-call",
        "type": "call",
        "action": "openAllSlots",
        "target": ""
      },
      {
        "id": "6-8-unlock-1",
        "type": "call",
        "action": "unlockBoksDoubleClick"
      },
      {
        "id": "6-8-unlock-2",
        "type": "call",
        "action": "unlockDragBlock"
      },
      {
        "id": "6-8-unlock-3",
        "type": "call",
        "action": "unlockPlay"
      },
      {
        "id": "6-9-goal-popped",
        "type": "waitFor",
        "event": "goal-popped",
        "count": 1
      },
      {
        "id": "6-10-great",
        "type": "narration",
        "text": "Great",
        "durationMs": 3000,
        "audio": "assets/audio/sfx/gameplay/tutorial_32_great.mp3"
      },
      {
        "id": "6-11-call",
        "type": "call",
        "action": "finishTutorial",
        "target": ""
      }
    ]
  }
};
})();
