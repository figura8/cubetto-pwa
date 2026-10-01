# BOKS 24-Level Campaign Design Brief

## Role

Act as the lead level designer for BOKS. Design a complete, playable 24-level
campaign for the existing 6 by 6 grid game. The Level Editor and
`data/editor-levels.json` are the only source of truth for campaign data.

Do not change runtime rules, the editor architecture, or visual themes while
designing the campaign. Do not add a level merely to reach a count of 24.

## Core Rules

- `F`: move one cell forward.
- `L`: rotate left 90 degrees without moving.
- `R`: rotate right 90 degrees without moving.
- `B`: move one cell backward without changing orientation.
- `Q`: call the Function program. The Function has up to four command slots,
  cannot call itself, and may be called more than once from Main.
- Board coordinates use `X1` to `X6` left to right and `Y1` to `Y6` top to
  bottom.

## Campaign Goals

The player should feel that they are learning a small language for solving
spatial problems, not filling a line with commands.

1. Levels 1-3 teach forward movement and distance with no obstacle noise.
2. Levels 4-6 introduce left and right because an obstacle makes turning
   necessary.
3. Levels 7-11 give Backward a full learning arc: discovery, confirmation that
   orientation is preserved, shortcut, escape, and combination with turns.
4. Levels 12-16 develop route reading through obstacles: corridors, false
   shortcuts, small U-shapes, and alternative paths.
5. Levels 17-20 introduce Function only when repeating a sequence is clearly
   more elegant than writing it twice.
6. Levels 21-24 combine Function, Backward, turns, and meaningful obstacles
   into compact final puzzles.

## Mandatory Design Checks For Every Level

Before accepting a level, document all of the following:

- Level number and a short memorable design name.
- Start coordinate, goal coordinate, and start orientation.
- Available blocks, Main slot count, and Function slot count.
- Obstacle coordinates and the exact reason each obstacle exists.
- Intended reference solution.
- Primary lesson in one sentence.
- Why the starting orientation is intentional. Never default all levels to Up.
- Why the slot count is appropriate. Slot count is not a difficulty ladder.
- A check that the level is solvable with the real game rules.

## Progression Rules

- Vary start orientation deliberately across the whole campaign: Up, Right,
  Down, and Left must all be used where they create a meaningful question.
- Obstacles must change the best route, explain a command, create a choice, or
  communicate a constraint. Never use an obstacle as decoration.
- Backward must appear in at least five levels after its introduction, each
  time with a different role. It must never be a redundant replacement for
  Forward.
- Function must be introduced cleanly, then used for genuine repetition,
  then combined with Backward and obstacles.
- Do not force eight Main slots. Use 1-7 slots unless eight is demonstrably
  the clearest and most enjoyable solution.
- Prefer compact, readable puzzles to maze-like boards.
- Include occasional slack only when it supports experimentation. Tight slots
  are useful when they reveal a clever solution, not as punishment.

## Quality Bar

Every level must answer a player-facing question that is more interesting than
"go forward and turn." Examples include: preserve orientation, choose the
correct exit, avoid a false shortcut, return without turning around, or spot a
repeat worth putting in Function.

The final level must feel elegant and memorable, not merely long. It should
use the full vocabulary only where each command earns its place.

## Required Deliverable Before Implementation

Produce a table for all 24 levels, followed by ASCII 6 by 6 boards. Review
the entire table for difficulty curve, command variety, orientation variety,
obstacle purpose, and Function/Backward coverage before changing
`data/editor-levels.json`.
