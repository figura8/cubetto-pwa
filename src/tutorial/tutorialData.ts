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
          "audioSrc": "assets/audio/sfx/gameplay/tutorial_21_But_do_we_see_in_action.mp3"
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
          "slot"
        ],
        "unlockedInteractions": [
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
          "caption": "",
          "durationMs": 3000
        }
      ]
    }
  ]
} as const;

export type TutorialData = typeof tutorialData;
