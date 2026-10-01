# BOKS Campaign Implementation Prompt And Pass Criteria

## Mission

Implement the approved 24-level BOKS campaign only after every level has
passed design, solvability, progression, and editor-source-of-truth checks.

The canonical campaign file is `data/editor-levels.json`. The Level Editor and
gameplay must load exactly this file. Do not use a separate hard-coded list,
browser-only draft, or runtime-only override.

## Required Work Order

1. Convert the approved proposal into 24 concrete level records.
2. For each record, write an ASCII board and intended solution.
3. Validate each solution against the real command rules, including Backward
   and Function execution.
4. Review the full campaign as a sequence, not as isolated puzzles.
5. Save the validated records to `data/editor-levels.json`.
6. Reload the Level Editor and visually verify the data it displays.
7. Run the campaign from level 1 through level 24.

## Per-Level Pass Criteria

A level passes only when all statements are true:

- Its start, goal, orientation, obstacle positions, enabled blocks, and slot
  counts match its documented design intent.
- It has at least one valid solution within the available Main and Function
  slots.
- It is impossible to reach the goal by ignoring the intended newly taught
  concept when that concept is the level's lesson.
- Every obstacle changes route choice, blocks a shortcut, creates a corridor,
  or otherwise serves a stated puzzle purpose.
- The starting orientation contributes to the puzzle; it is not an accidental
  default.
- The level is readable on the 6 by 6 board without maze-like scanning.
- Slot count is justified by the intended solution, not by level number.
- If Backward is enabled, its use changes the solution meaningfully.
- If Function is enabled, it supports genuine repetition and has a valid
  populated Function program in the reference solution.

## Campaign Pass Criteria

The campaign passes only when all statements are true:

- There are exactly 24 campaign levels with continuous `campaignIndex` values
  from 0 through 23.
- The Editor shows 24 numbered campaign tiles and selecting each one loads the
  same data used by gameplay.
- Levels 1-3 contain only forward movement and no obstacle noise.
- Levels 4-6 teach turns through meaningful blocked routes.
- Backward has five or more distinct uses across levels 7-16: discovery,
  orientation preservation, shortcut, escape, and synthesis.
- Obstacles are present throughout the middle and final acts, not clustered
  only at the end.
- Function first appears at level 17 or later, is introduced cleanly, and is
  used for repetition before it is combined with obstacles and Backward.
- Start orientation has deliberate variation across North, East, South, and
  West.
- No level uses eight Main slots unless the documented solution and playtest
  demonstrate a clear fun benefit. The default maximum is seven.
- Difficulty rises through new decisions and interactions, not command count.
- The final level is a compact, elegant synthesis rather than an endurance
  test.

## Verification Evidence Required Before Delivery

Report all of the following:

- A 24-row table with each reference solution and slot budget.
- 24 ASCII boards using the editor coordinate convention.
- Automated solver output for every non-Function level.
- Explicit Function-program traces for levels 17-24.
- A source-of-truth check proving that `data/editor-levels.json`, Level Editor,
  and gameplay all agree on level count and enabled blocks.
- A concise game-design review of the final curve, naming any residual risk.

## Stop Conditions

Do not claim completion when any reference solution fails, any level relies on
an obstacle without purpose, Function/Backward is enabled but unnecessary, or
the Editor does not visibly load the canonical data.
