export const tutorialData = {
  "sequences": [
    {
      "id": "orientation_intro",
      "title": "INTRO",
      "startState": {
        "visibleElements": [],
        "unlockedInteractions": [],
        "boksOrientation": "right",
        "boksPosition": {
          "x": 2,
          "y": 3
        },
        "goalPosition": {
          "x": 3,
          "y": 3
        },
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
        "unlockedInteractions": [],
        "boksOrientation": "right",
        "boksPosition": {
          "x": 2,
          "y": 3
        },
        "goalPosition": {
          "x": 3,
          "y": 3
        },
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
          "type": "Narration",
          "caption": "Try clicking",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/05_try_clicking.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "DRAG_BLOCK"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "BLOCK_RELEASED_WITHOUT_SLOT",
          "minRepetitions": 2,
          "completionCondition": ""
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "Nope",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/06_nope.mp3"
        },
        {
          "type": "Narration",
          "caption": "We need",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/07_we_need.mp3"
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
        "unlockedInteractions": [],
        "boksOrientation": "right",
        "boksPosition": {
          "x": 2,
          "y": 3
        },
        "goalPosition": {
          "x": 3,
          "y": 3
        },
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
          "type": "Unlock",
          "interactions": [
            "DRAG_BLOCK"
          ]
        },
        {
          "type": "Hand hint",
          "hintType": "drag_block"
        },
        {
          "type": "Wait for event",
          "eventName": "BLOCK_DROPPED_IN_SLOT",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Clear hand hint"
        },
        {
          "type": "Narration",
          "caption": "Ok, perfect. Now we have have our first instruction ready",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/03_narration.mp3"
        },
        {
          "type": "Narration",
          "caption": "But how do we see in action?",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_21_but_do_we_see_in_action.mp3"
        },
        {
          "type": "Pause",
          "durationMs": 500
        },
        {
          "type": "Narration",
          "caption": "We need this",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_22_we_need_this.mp3"
        },
        {
          "type": "Spawn",
          "elementId": "play",
          "transition": "fade-in",
          "durationMs": 600,
          "delayMs": 0
        },
        {
          "type": "Highlight",
          "elementId": "play"
        }
      ]
    },
    {
      "id": "sequence_4",
      "title": "PLAY",
      "startState": {
        "visibleElements": [
          "boks",
          "forward_block",
          "slot",
          "play_button"
        ],
        "unlockedInteractions": [
          "DRAG_BLOCK"
        ],
        "boksOrientation": "right",
        "boksPosition": {
          "x": 2,
          "y": 3
        },
        "goalPosition": {
          "x": 3,
          "y": 3
        },
        "mainProgram": [
          "forward"
        ]
      },
      "beats": [
        {
          "type": "Narration",
          "caption": "Its Play!",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/01_its_play.mp3"
        },
        {
          "type": "Narration",
          "caption": "Play is a button",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/02_play_is_a_button.mp3"
        },
        {
          "type": "Narration",
          "caption": "Come on! click on play",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/03_come_on_click_on_play.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "PRESS_PLAY"
          ]
        },
        {
          "type": "Hand hint",
          "hintType": "press_play"
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
          "type": "Clear hand hint"
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "Cool!",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/04_cool.mp3"
        },
        {
          "type": "Narration",
          "caption": "Now thanks to you",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/05_now_thanks_to_you.mp3"
        }
      ]
    },
    {
      "id": "sequence_5",
      "title": "Turn",
      "startState": {
        "visibleElements": [
          "boks",
          "forward_block",
          "slot",
          "play_button"
        ],
        "unlockedInteractions": [],
        "boksOrientation": "right",
        "boksPosition": {
          "x": 3,
          "y": 3
        },
        "goalPosition": {
          "x": 3,
          "y": 3
        },
        "mainProgram": [
          "forward"
        ]
      },
      "beats": [
        {
          "type": "Narration",
          "caption": "But If",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/01_but_if.mp3"
        },
        {
          "type": "Narration",
          "caption": "We need aother",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/02_we_need_aother.mp3"
        },
        {
          "type": "Spawn",
          "elementId": "turn_right",
          "transition": "fade-in",
          "durationMs": 600,
          "delayMs": 0
        },
        {
          "type": "Narration",
          "caption": "Ok, try",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/03_ok_try.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "DRAG_BLOCK"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "BLOCK_DROPPED_IN_SLOT",
          "minRepetitions": 1,
          "completionCondition": "right"
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "Great",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/04_great.mp3"
        },
        {
          "type": "Narration",
          "caption": "Now lets see in action> Click play",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/05_now_lets_see_in_action.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "PRESS_PLAY"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "PROGRAM_EXECUTION_FINISHED",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "good",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/06_good.mp3"
        },
        {
          "type": "Pause",
          "durationMs": 1000
        },
        {
          "type": "Narration",
          "caption": "Lets add anothe brick",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/07_lets_add_anothe_brick.mp3"
        },
        {
          "type": "Spawn",
          "elementId": "turn_left",
          "transition": "fade-in",
          "durationMs": 600,
          "delayMs": 0
        },
        {
          "type": "Narration",
          "caption": "ok, here it sis",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/08_ok_here_it_sis.mp3"
        },
        {
          "type": "Narration",
          "caption": "Now you know",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/now_you_know_how.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "DRAG_BLOCK"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "BLOCK_DROPPED_IN_SLOT",
          "minRepetitions": 1,
          "completionCondition": "left"
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "Ok, click play",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_38_ok_click_play.mp3"
        },
        {
          "type": "Unlock",
          "interactions": [
            "PRESS_PLAY"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "PROGRAM_EXECUTION_FINISHED",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "Great",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/11_great.mp3"
        }
      ]
    },
    {
      "id": "sequence_6",
      "title": "FUNCTION",
      "startState": {
        "visibleElements": [
          "boks",
          "forward_block",
          "slot",
          "play_button",
          "right_block",
          "left_block"
        ],
        "unlockedInteractions": [],
        "boksOrientation": "right",
        "boksPosition": {
          "x": 3,
          "y": 3
        },
        "goalPosition": {
          "x": 3,
          "y": 3
        },
        "mainProgram": [
          "left"
        ]
      },
      "beats": [
        {
          "type": "Narration",
          "caption": "Now you know",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/01_now_you_know.mp3"
        },
        {
          "type": "Narration",
          "caption": "But..",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/02_but.mp3"
        },
        {
          "type": "Spawn",
          "elementId": "function_block",
          "transition": "fade-in",
          "durationMs": 600,
          "delayMs": 0
        },
        {
          "type": "Highlight",
          "elementId": "function_block"
        },
        {
          "type": "Pause",
          "durationMs": 500
        },
        {
          "type": "Narration",
          "caption": "a function is...",
          "durationMs": 8000,
          "audioSrc": "assets/audio/sfx/gameplay/03_a_function_is.mp3"
        },
        {
          "type": "Narration",
          "caption": "we put",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/04_we_put.mp3"
        },
        {
          "type": "Narration",
          "caption": "So...instead",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/04_so_instead.mp3"
        },
        {
          "type": "Narration",
          "caption": "First",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/05_first.mp3"
        },
        {
          "type": "Narration",
          "caption": "and then..",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/06_and_then.mp3"
        },
        {
          "type": "Highlight",
          "elementId": "function_area"
        },
        {
          "type": "Unlock",
          "interactions": [
            "DRAG_BLOCK"
          ]
        },
        {
          "type": "Unlock",
          "interactions": [
            "PRESS_PLAY"
          ]
        },
        {
          "type": "Spawn",
          "elementId": "function_area",
          "transition": "fade-in",
          "durationMs": 600,
          "delayMs": 0
        },
        {
          "type": "Wait for event",
          "eventName": "BLOCK_DROPPED_IN_SLOT",
          "minRepetitions": 1,
          "completionCondition": "function_area"
        },
        {
          "type": "Wait for event",
          "eventName": "PLAY_PRESSED",
          "minRepetitions": 1,
          "completionCondition": "function_ready"
        },
        {
          "type": "Wait for event",
          "eventName": "PROGRAM_EXECUTION_FINISHED",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "ok, great",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/07_ok_great.mp3"
        }
      ]
    },
    {
      "id": "sequence_7",
      "title": "GAME",
      "startState": {
        "visibleElements": [
          "boks",
          "forward_block",
          "slot",
          "play_button",
          "right_block",
          "left_block",
          "function_block",
          "function_area"
        ],
        "unlockedInteractions": [],
        "boksOrientation": "up",
        "boksPosition": {
          "x": 3,
          "y": 3
        },
        "goalPosition": {
          "x": 3,
          "y": 3
        },
        "mainProgram": [
          "right"
        ]
      },
      "beats": [
        {
          "type": "Narration",
          "caption": "now",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/01_now.mp3"
        },
        {
          "type": "Narration",
          "caption": "let place",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/02_let_place.mp3"
        },
        {
          "type": "Place",
          "elementId": "boks",
          "x": 0,
          "y": 1
        },
        {
          "type": "Narration",
          "caption": "and the little bubble\n",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/03_and_the_little_bubble.mp3"
        },
        {
          "type": "Place",
          "elementId": "goal",
          "x": 2,
          "y": 4
        },
        {
          "type": "Spawn",
          "elementId": "goal",
          "transition": "fade-in",
          "durationMs": 600,
          "delayMs": 0
        },
        {
          "type": "Narration",
          "caption": "use all the commands",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/04_use_all_the_commands.mp3"
        },
        {
          "type": "Call",
          "action": "openAllSlots",
          "target": ""
        },
        {
          "type": "Unlock",
          "interactions": [
            "ALL"
          ]
        },
        {
          "type": "Wait for event",
          "eventName": "GOAL_POPPED",
          "minRepetitions": 1,
          "completionCondition": ""
        },
        {
          "type": "Narration",
          "caption": "Great",
          "durationMs": 3000,
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_32_great.mp3"
        },
        {
          "type": "Call",
          "action": "finishTutorial",
          "target": ""
        }
      ]
    }
  ]
} as const;

export type TutorialData = typeof tutorialData;
