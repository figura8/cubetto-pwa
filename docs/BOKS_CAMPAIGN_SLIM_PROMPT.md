# BOKS Campaign - Slim Prompt

Create a 24-level campaign in `data/editor-levels.json`. The Level Editor is
the source of truth: Editor and gameplay must load the same 24 records.

For every level define: start, goal, start orientation, enabled blocks, Main
slots, Function slots, obstacles, a short design name, and a reference
solution that works with the real rules.

Progression:

1. Levels 1-3: Forward only; teach movement and distance.
2. Levels 4-6: Left and Right; obstacles must make turning necessary.
3. Levels 7-11: Backward; use it for discovery, preserved orientation,
   shortcut, escape, and a turn combination.
4. Levels 12-16: meaningful obstacles, corridors, false shortcuts, and small
   U-shapes.
5. Levels 17-20: Function; introduce it through genuine repeated sequences.
6. Levels 21-24: compact synthesis of Function, Backward, turns, and
   obstacles.

Rules:

- Vary start orientation intentionally. Do not default to Up.
- Every obstacle must alter the intended route or create a stated choice.
- Backward must be necessary in at least five distinct levels.
- Function must be necessary from its introduction and have a valid populated
  Function program.
- Use 1-7 Main slots only when justified; never escalate slot count by habit.
- Prefer short, readable, elegant puzzles over maze-like or endurance puzzles.

Before delivery verify:

- Exactly 24 continuous campaign indices, visible in the Level Editor.
- Every level is solvable within its enabled slots.
- L1 has Forward enabled and one Main slot.
- Editor, `editor-levels.json`, and gameplay agree on count and enabled blocks.
- Provide a 24-row table with reference solutions and 24 ASCII boards.
