export const tutorialData = {
  "sequences": [
    {
      "id": "orientation_intro",
      "title": "Orientation intro",
      "beats": [
        {
          "type": "Narration",
          "caption": "Hello and welcome!!",
          "durationMs": 1800
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Narration",
          "caption": "Our adventure begins here.",
          "durationMs": 1800
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Narration",
          "caption": "This green meadow is a grid where our friend Bocs can move with your help!",
          "durationMs": 3400
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Narration",
          "caption": "Hey Bocs...where are you?",
          "durationMs": 2000
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Spawn",
          "elementId": "boks",
          "transition": "bounce-in",
          "durationMs": 900,
          "delayMs": 0
        },
        {
          "type": "Pause",
          "durationMs": 1500
        },
        {
          "type": "Narration",
          "caption": "Here you are!",
          "durationMs": 1600
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Narration",
          "caption": "Okay, let's see what happens if you double-click Bocs.",
          "durationMs": 2800
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
          "type": "Narration",
          "caption": "Did you see?",
          "durationMs": 1600
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Narration",
          "caption": "Now look down!",
          "durationMs": 1500
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Narration",
          "caption": "And what happens if you try again?",
          "durationMs": 2300
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
          "type": "Narration",
          "caption": "Oh, yes, now Bocs looks to your left.",
          "durationMs": 2600
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Narration",
          "caption": "Every time you double-click Bocs, he turns around and looks in a different direction.",
          "durationMs": 4600
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
          "minRepetitions": 2,
          "completionCondition": "BOKS_FACING_INITIAL_ORIENTATION"
        },
        {
          "type": "Lock"
        },
        {
          "type": "Narration",
          "caption": "Okay, now Bocs would like to explore the world around him a little.",
          "durationMs": 3600
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Narration",
          "caption": "But to move, he needs your help.",
          "durationMs": 2400
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Narration",
          "caption": "We have to tell Bocs where to go, and we'll need this.",
          "durationMs": 3600
        },
        {
          "type": "Pause",
          "durationMs": 2000
        },
        {
          "type": "Spawn",
          "elementId": "forward_block",
          "transition": "bounce-in",
          "durationMs": 800,
          "delayMs": 0
        }
      ]
    }
  ]
} as const;

export type TutorialData = typeof tutorialData;
