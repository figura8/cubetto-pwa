export const tutorialData = {
  "sequences": [
    {
      "id": "orientation_intro",
      "title": "Orientation intro",
      "startState": {
        "visibleElements": [],
        "unlockedInteractions": [],
        "boksOrientation": "right",
        "mainProgram": []
      },
      "beats": [
        {
          "type": "Narration",
          "caption": "Hello and welcome!!",
          "durationMs": 1800,
          "audioSrc": "assets/audio/sfx/gameplay/01_hello_and_welcome.mp3"
        },
        {
          "type": "Narration",
          "caption": "This green meadow is a grid where our friend Bocs can move with your help!",
          "durationMs": 3400,
          "audioSrc": "assets/audio/sfx/gameplay/02_this_green_meadow_is_a.mp3"
        },
        {
          "type": "Spawn",
          "elementId": "boks",
          "transition": "bounce-in",
          "durationMs": 900,
          "delayMs": 0
        },
        {
          "type": "Narration",
          "caption": "Here you are!",
          "durationMs": 1600,
          "audioSrc": "assets/audio/sfx/gameplay/03_here_you_are.mp3"
        },
        {
          "type": "Narration",
          "caption": "Okay, let's see what happens if you double-click Bocs.",
          "durationMs": 2800,
          "audioSrc": "assets/audio/sfx/gameplay/04_okay_lets_see_what_happens.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "DOUBLE_TAP_BOKS"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "BOKS_DOUBLE_TAPPED",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Lock"
        },
        {
          "type": "Pause",
          "durationMs": 500
        },
        {
          "type": "Narration",
          "caption": "Did you see?",
          "durationMs": 1600,
          "audioSrc": "assets/audio/sfx/gameplay/05_did_you_see.mp3"
        },
        {
          "type": "Narration",
          "caption": "And what happens if you try again?",
          "durationMs": 2300,
          "audioSrc": "assets/audio/sfx/gameplay/06_and_what_happens_if_you.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "DOUBLE_TAP_BOKS"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "BOKS_DOUBLE_TAPPED",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Lock"
        },
        {
          "type": "Pause",
          "durationMs": 500
        },
        {
          "type": "Narration",
          "caption": "Oh, yes, now Bocs looks to your left.",
          "durationMs": 2600,
          "audioSrc": "assets/audio/sfx/gameplay/07_oh_yes_now_bocs_looks.mp3"
        },
        {
          "type": "Narration",
          "caption": "Every time you double-click Bocs, he turns around and looks in a different direction.",
          "durationMs": 4600,
          "audioSrc": "assets/audio/sfx/gameplay/08_every_time_you_double_click.mp3"
        },
        {
          "type": "Narration",
          "caption": "try again couple of times",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/09_try_again_couple_of_times.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "DOUBLE_TAP_BOKS"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "BOKS_DOUBLE_TAPPED",
          "minRepetitions": 1,
          "completionCondition": "BOKS_FACING_INITIAL_ORIENTATION"
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "well done!",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/10_well_done.mp3"
        }
      ]
    },
    {
      "id": "sequence_2",
      "title": "Bloc Forward",
      "startState": {
        "visibleElements": [
          "boks"
        ],
        "unlockedInteractions": [
          "DOUBLE_TAP_BOKS"
        ],
        "boksOrientation": "right",
        "mainProgram": []
      },
      "beats": [
        {
          "type": "Narration",
          "caption": "Ok, now BOKS",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/01_ok_now_boks.mp3"
        },
        {
          "type": "Narration",
          "caption": "But to get",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/02_but_to_get.mp3"
        },
        {
          "type": "Narration",
          "caption": "We need",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/03_we_need.mp3"
        },
        {
          "type": "Spawn",
          "elementId": "forward_block",
          "transition": "fade-in",
          "durationMs": 600,
          "delayMs": 0
        },
        {
          "type": "Highlight",
          "elementId": "forward_block"
        },
        {
          "type": "Narration",
          "caption": "This little green piece",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/04_this_little_green_piece.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "DRAG_BLOCK"
          ]
        },
        {
          "type": "Narration",
          "caption": "Try clicking",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/05_try_clicking.mp3"
        },
        {
          "type": "Wait for event",
          "eventName": "BLOCK_RELEASED_WITHOUT_SLOT",
          "minRepetitions": 2,
          "completionCondition": ""
        },
        {
          "type": "Narration",
          "caption": "Nope",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/06_nope.mp3"
        },
        {
          "type": "Narration",
          "caption": "We need to put in special place..this one",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/07_we_need_to_put_in.mp3"
        },
        {
          "type": "Spawn",
          "elementId": "slot",
          "transition": "fade-in",
          "durationMs": 600,
          "delayMs": 0
        },
        {
          "type": "Highlight",
          "elementId": "slot"
        }
      ]
    },
    {
      "id": "sequence_3",
      "title": "Sequence",
      "startState": {
        "visibleElements": [
          "boks",
          "forward_block",
          "slot"
        ],
        "unlockedInteractions": [
          "DOUBLE_TAP_BOKS",
          "DRAG_BLOCK"
        ],
        "boksOrientation": "right",
        "mainProgram": []
      },
      "beats": [
        {
          "type": "Narration",
          "caption": "its called a sequence",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/01_its_called_a_sequence.mp3"
        },
        {
          "type": "Hand hint",
          "hintType": "drag_block"
        },
        {
          "type": "Narration",
          "caption": "Try to put in here",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/02_try_to_put_in_here.mp3"
        },
        {
          "type": "Highlight",
          "elementId": "slot"
        },
        {
          "type": "Wait for event",
          "eventName": "BLOCK_DROPPED_IN_SLOT",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Narration",
          "caption": "ok perfect now we have our first instruction ready",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_20_Ok_perfect.mp3"
        },
        {
          "type": "Clear highlight"
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "But how do we see in action?",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_21_But_do_we_see_in_action.mp3"
        },
        {
          "type": "Narration",
          "caption": "We need this",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_22_we_need_this.mp3"
        },
        {
          "type": "Spawn",
          "elementId": "play_button",
          "transition": "fade-in",
          "durationMs": 600,
          "delayMs": 0
        }
      ]
    },
    {
      "id": "sequence_4",
      "title": "PlayButton",
      "startState": {
        "visibleElements": [
          "boks",
          "forward_block",
          "slot",
          "play_button"
        ],
        "unlockedInteractions": [
          "DOUBLE_TAP_BOKS",
          "DRAG_BLOCK"
        ],
        "boksOrientation": "right",
        "mainProgram": [
          "forward"
        ]
      },
      "beats": [
        {
          "type": "Narration",
          "caption": "Its PLay!",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_23_its_play.mp3"
        },
        {
          "type": "Narration",
          "caption": "Play is a button",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_24_play_is_a_button.mp3"
        },
        {
          "type": "Narration",
          "caption": "Come on click on play!",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_25_come_on_clic.mp3"
        },
        {
          "type": "Hand hint",
          "hintType": "press_play"
        },
        {
          "type": "Unlock",
          "interactions": [
            "PRESS_PLAY"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "PLAY_PRESSED",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Clear hand hint"
        },
        {
          "type": "Wait for event",
          "eventName": "PROGRAM_EXECUTION_FINISHED",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Narration",
          "caption": "well done. try again",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_26_well_done_try_again.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "PRESS_PLAY"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "PLAY_PRESSED",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Wait for event",
          "eventName": "PROGRAM_EXECUTION_FINISHED",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Narration",
          "caption": "Cool",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_27_cool.mp3"
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "Now thanks to you",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_28_now_thanks_to_you.mp3"
        }
      ]
    },
    {
      "id": "sequence_5",
      "title": "Turnright",
      "startState": {
        "visibleElements": [
          "boks",
          "forward_block",
          "slot",
          "play_button"
        ],
        "unlockedInteractions": [
          "DOUBLE_TAP_BOKS",
          "DRAG_BLOCK",
          "PRESS_PLAY"
        ],
        "boksOrientation": "right",
        "mainProgram": [
          "forward"
        ]
      },
      "beats": [
        {
          "type": "Narration",
          "caption": "But what",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_29_but_what_if.mp3"
        },
        {
          "type": "Narration",
          "caption": "Well, in tha case",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_30_well...mp3"
        },
        {
          "type": "Hide",
          "elementId": "forward_block",
          "transition": "fade-out",
          "durationMs": 400
        },
        {
          "type": "Spawn",
          "elementId": "right_block",
          "transition": "fade-in",
          "durationMs": 600,
          "delayMs": 0
        }
      ]
    }
  ]
} as const;

export type TutorialData = typeof tutorialData;
