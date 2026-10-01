# BOKS - Campaign Design With Backward Block

Status: the Backward block is implemented in runtime, Editor, level storage,
and solver. This document does not replace the current levels in
`data/editor-levels.json`.

## Goal

Create a 20-level campaign using four movement commands only:

- `F`: Forward one cell.
- `L`: Turn left 90 degrees without moving.
- `R`: Turn right 90 degrees without moving.
- `B`: Move backward one cell without changing orientation.

The Function block is deliberately out of scope for this campaign pass.

## Backward Block Rule

The Backward block must always move BOKS one cell behind its current facing
direction. It never rotates BOKS. This distinction between position and
orientation is the main teaching value of the command.

The block should be introduced cleanly before being combined with obstacles.
It should later save slots, preserve orientation, or provide an elegant exit
from a constrained route. It should not be a redundant second Forward block.

## Level Design Principles

- One level teaches one primary idea.
- Obstacles are never only decoration. Each one must communicate a route,
  a constraint, or the reason a command matters.
- Early levels use no obstacles or one harmless obstacle.
- Later levels use corridors, U-shapes, false shortcuts, and slot pressure.
- A short Backward-based solution should feel clever rather than arbitrary.
- Avoid large maze-like boards. The player should be able to plan a route
  before pressing Run.

## Grid Convention

- Board size: 6 by 6.
- `x=0` is the left edge; `x=5` is the right edge.
- `y=0` is the top edge; `y=5` is the bottom edge.
- Start format: `(x, y, direction)` using `N`, `E`, `S`, or `W`.
- `#` means obstacle, `S` means BOKS start, and `G` means goal.
- ASCII maps list rows from `y=0` to `y=5`.

## Campaign Structure

1. Levels 1-3: Forward and grid reading.
2. Levels 4-8: Left/right turns and simple obstacle routing.
3. Levels 9-10: Backward discovery without route noise.
4. Levels 11-14: Backward combined with orientation and one clear constraint.
5. Levels 15-17: Slot efficiency, corridors, and U-shapes.
6. Levels 18-20: Compact synthesis puzzles.

## Level Blueprint

| Level | Start | Goal | Blocks | Obstacles | Reference solution | Main lesson |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `(2,3,E)` | `(3,3)` | F | None | `F` | First movement. |
| 2 | `(2,4,N)` | `(2,2)` | F | None | `F F` | Count two cells. |
| 3 | `(1,4,N)` | `(1,1)` | F | `(4,3)` | `F F F` | A brick exists without distracting from movement. |
| 4 | `(2,3,N)` | `(3,3)` | F, R | `(2,2)` | `R F` | A brick blocks the direct route. |
| 5 | `(3,3,N)` | `(1,3)` | F, L | `(3,2)` | `L F F` | Turn left. |
| 6 | `(1,4,N)` | `(2,3)` | F, R | `(1,2)`, `(2,2)` | `F R F` | Route around a corner. |
| 7 | `(2,5,N)` | `(1,3)` | F, L, R | `(2,3)`, `(3,4)` | `F L F R F` | First zig-zag. |
| 8 | `(1,4,N)` | `(3,3)` | F, L, R | `(1,3)`, `(2,3)`, `(4,4)` | `R F F L F` | Read past a false shortcut. |
| 9 | `(3,3,N)` | `(3,4)` | B | None | `B` | Backward changes position, not orientation. |
| 10 | `(3,2,N)` | `(3,4)` | B | `(3,1)` | `B B` | Backward is an intentional safe move. |
| 11 | `(2,4,N)` | `(1,3)` | F, B, R | `(1,4)` | `F R B` | Backward depends on current orientation. |
| 12 | `(2,3,N)` | `(4,4)` | F, B, R | `(2,2)`, `(3,3)` | `B R F F` | Step back to create room before turning. |
| 13 | `(3,4,N)` | `(5,3)` | F, B, L | `(2,3)`, `(3,2)` | `F L B B` | After turning, Backward takes BOKS to the opposite side. |
| 14 | `(2,5,N)` | `(2,3)` | F, B, L, R | `(1,4)`, `(3,3)`, `(2,2)` | `F R F B L F` | First complete backward choreography. |
| 15 | `(1,5,N)` | `(1,2)` | F, B, L, R | `(0,3)`, `(2,2)`, `(3,3)` | `F F R F B L F` | Short route versus long route. |
| 16 | `(1,4,N)` | `(2,3)` | F, B, L, R | `(1,3)`, `(3,3)`, `(4,4)` | `R F F B L F` | Exit a small U-shape. |
| 17 | `(2,5,N)` | `(3,3)` | F, B, L, R | `(2,3)`, `(4,3)`, `(5,4)`, `(1,4)` | `F R F F B L F` | Corridor with a lateral exit. |
| 18 | `(3,5,N)` | `(3,2)` | F, B, L, R | `(2,3)`, `(4,4)`, `(3,1)`, `(1,4)` | `F L F B R F F` | Two routes; one respects the slot budget. |
| 19 | `(1,5,N)` | `(3,4)` | F, B, L, R | `(0,4)`, `(2,3)`, `(3,3)`, `(3,5)` | `R F B L F R F F` | A false dead end. |
| 20 | `(2,5,N)` | `(3,3)` | F, B, L, R | `(1,4)`, `(2,2)`, `(4,3)`, `(1,3)` | `F R F B L F R F` | Final compact synthesis. |

## ASCII Maps

```text
L01  S=(2,3,E)  G=(3,3)
...... / ...... / ...... / ..SG.. / ...... / ......

L02  S=(2,4,N)  G=(2,2)
...... / ...... / ..G... / ...... / ..S... / ......

L03  S=(1,4,N)  G=(1,1)
...... / .G.... / ...... / ....#. / .S.... / ......

L04  S=(2,3,N)  G=(3,3)
...... / ...... / ..#... / ..SG.. / ...... / ......

L05  S=(3,3,N)  G=(1,3)
...... / ...... / ...#.. / .G.S.. / ...... / ......

L06  S=(1,4,N)  G=(2,3)
...... / ...... / .##... / ..G... / .S.... / ......

L07  S=(2,5,N)  G=(1,3)
...... / ...... / ...... / .G#... / ...#.. / ..S...

L08  S=(1,4,N)  G=(3,3)
...... / ...... / ...... / .##G.. / .S..#. / ......

L09  S=(3,3,N)  G=(3,4)
...... / ...... / ...... / ...S.. / ...G.. / ......

L10  S=(3,2,N)  G=(3,4)
...... / ...#.. / ...S.. / ...... / ...G.. / ......

L11  S=(2,4,N)  G=(1,3)
...... / ...... / ...... / .G.... / .#S... / ......

L12  S=(2,3,N)  G=(4,4)
...... / ...... / ..#... / ..S#.. / ....G. / ......

L13  S=(3,4,N)  G=(5,3)
...... / ...... / ...#.. / ..#..G / ...S.. / ......

L14  S=(2,5,N)  G=(2,3)
...... / ...... / ..#... / ..G#.. / .#.... / ..S...

L15  S=(1,5,N)  G=(1,2)
...... / ...... / .G#... / #..#.. / ...... / .S....

L16  S=(1,4,N)  G=(2,3)
...... / ...... / ...... / .#G#.. / .S..#. / ......

L17  S=(2,5,N)  G=(3,3)
...... / ...... / ...... / ..#G#. / .#...# / ..S...

L18  S=(3,5,N)  G=(3,2)
...... / ...#.. / ...G.. / ..#... / .#..#. / ...S..

L19  S=(1,5,N)  G=(3,4)
...... / ...... / ...... / ..##.. / #..G.. / .S.#..

L20  S=(2,5,N)  G=(3,3)
...... / ...... / ..#... / .#.G#. / .#.... / ..S...
```

## Campaign Order Safety

The project currently uses `campaignIndex` as the stable order for campaign
levels. All current 23 campaign levels have continuous indices from 0 to 22.
The runtime filters campaign levels, sorts them by that index, and does not
accidentally add newly created custom levels to the campaign.

When campaign tiles are dragged in the editor, their campaign indices and
display numbers are updated together. A custom level remains outside campaign
ordering unless deliberately promoted later.

## Next Design Decision

Before implementation, decide whether this 20-level proposal should replace
the existing 23-level campaign entirely, or whether selected puzzles should
be incorporated into the current 23-level structure.
