# BOKS 24-Level Validation Workbook

Status: **verified and applied** to `data/editor-levels.json`.

## Notation

`S` start, `G` goal, `#` obstacle, `.` empty. Zero-based grid coordinates `(x, y)` from `0..5` (as stored in `data/editor-levels.json`). Reference programs use `F` (Forward), `L` (Left), `R` (Right), `B` (Backward), and `Q` (Function call).

## 6-World Campaign Progression

1. **Mondo 1 (L1–L4) — Prato (`level1`, `boks_green`)**: Forward distance reading and first obstacle turn.
2. **Mondo 2 (L5–L8) — Cielo / Nuvole (`world-sky`, `boks_yellow`)**: Left/Right turns and Backward discovery + orientation preservation.
3. **Mondo 3 (L9–L12) — Stazione (`world-train-station`, `boks_red`)**: Backward maneuvers, pockets, L-switches, and long retreats.
4. **Mondo 4 (L13–L16) — Strada Piovosa (`world-rainy-street`, `boks_city`)**: False shortcuts, U-exits, route budget comparison, and multi-gate choreography.
5. **Mondo 5 (L17–L20) — Città degli Ingranaggi (`world-clockwork`, `boks_blu`)**: Clean Function (`Q`) introduction and repeated spatial shapes.
6. **Mondo 6 (L21–L24) — Spazio (`world-space`, `boks_yellow`)**: Function + Backward synthesis and compact finale.

## Level Table

| # | World / Theme | Character | Start (x,y,ori) | Goal (x,y) | Blocks | Main/Fn | Reference solution | Obstacle purpose | Pass |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `level1` | `boks_green` | `(2,3,right)` | `(3,3)` | F | 1/0 | `F` | None: first command | verified |
| 2 | `level1` | `boks_green` | `(4,2,left)` | `(2,2)` | F | 2/0 | `F F` | None: count two cells | verified |
| 3 | `level1` | `boks_green` | `(1,4,up)` | `(1,1)` | F | 3/0 | `F F F` | None: count three cells | verified |
| 4 | `level1` | `boks_green` | `(1,4,up)` | `(2,3)` | F,L,R | 4/0 | `R F L F` | `(1,3)` blocks direct forward | verified |
| 5 | `world-sky` | `boks_yellow` | `(4,1,left)` | `(3,2)` | F,L,R | 4/0 | `L F R F` | `(3,1)` blocks direct forward | verified |
| 6 | `world-sky` | `boks_yellow` | `(1,1,down)` | `(3,3)` | F,L,R | 6/0 | `L F F R F F` | `(1,3),(2,2)` close inner route | verified |
| 7 | `world-sky` | `boks_yellow` | `(3,3,up)` | `(3,4)` | F,B | 1/0 | `B` | `(3,2)` blocks forward; discovery | verified |
| 8 | `world-sky` | `boks_yellow` | `(2,2,right)` | `(0,2)` | F,L,R,B | 2/0 | `B B` | `(3,2)` blocks forward; saves turn slots | verified |
| 9 | `world-train-station` | `boks_red` | `(3,3,up)` | `(1,4)` | F,L,R,B | 4/0 | `B L F F` | `(2,3)` blocks left turn before backing up | verified |
| 10 | `world-train-station` | `boks_red` | `(2,1,up)` | `(4,2)` | F,L,R,B | 4/0 | `B L B B` | `(2,0),(1,1),(3,1)` form a pocket | verified |
| 11 | `world-train-station` | `boks_red` | `(4,4,right)` | `(2,2)` | F,L,R,B | 5/0 | `B B L F F` | `(4,2),(3,3)` block direct turn | verified |
| 12 | `world-train-station` | `boks_red` | `(1,1,left)` | `(4,2)` | F,L,R,B | 5/0 | `B B B L F` | `(2,2),(2,0)` guide 3-step retreat | verified |
| 13 | `world-rainy-street` | `boks_city` | `(1,3,left)` | `(4,1)` | F,L,R,B | 6/0 | `B B B R F F` | `(0,3),(1,2),(2,2),(3,2)` close upper shortcut | verified |
| 14 | `world-rainy-street` | `boks_city` | `(1,2,up)` | `(3,2)` | F,L,R,B | 6/0 | `B R F F L F` | `(1,1),(0,2),(2,2),(2,1)` form U-pocket | verified |
| 15 | `world-rainy-street` | `boks_city` | `(1,4,down)` | `(4,2)` | F,L,R,B | 6/0 | `B B L F F F` | `(1,5),(0,4),(2,3),(3,3)` force compact route | verified |
| 16 | `world-rainy-street` | `boks_city` | `(2,2,up)` | `(3,5)` | F,L,R,B | 6/0 | `B B L B L F` | `(2,1),(1,2),(3,2),(3,3),(2,5)` gate sequence | verified |
| 17 | `world-clockwork` | `boks_blu` | `(1,2,right)` | `(5,2)` | F,Q | 2/2 | `Q Q` (`Fn: F F`) | `(1,3),(1,1),(0,2)` frame straight corridor | verified |
| 18 | `world-clockwork` | `boks_blu` | `(0,4,up)` | `(2,2)` | F,R,Q | 2/3 | `Q Q` (`Fn: F F R`) | `(1,3),(0,1)` require repeated right bend | verified |
| 19 | `world-clockwork` | `boks_blu` | `(1,4,right)` | `(3,2)` | F,L,Q | 2/3 | `Q Q` (`Fn: F F L`) | `(2,3),(4,4)` require repeated left bend | verified |
| 20 | `world-clockwork` | `boks_blu` | `(0,0,right)` | `(1,3)` | F,L,R,Q | 2/4 | `Q Q` (`Fn: F F R F`) | `(1,1),(3,0)` guide 4-slot spiral | verified |
| 21 | `world-space` | `boks_yellow` | `(4,1,right)` | `(1,2)` | F,L,R,B,Q | 2/4 | `Q Q` (`Fn: B R F F`) | `(2,1),(5,1),(4,2)` require Backward in Fn | verified |
| 22 | `world-space` | `boks_yellow` | `(4,5,left)` | `(3,3)` | F,L,R,B,Q | 2/3 | `Q Q` (`Fn: L B B`) | `(3,4),(3,5)` require turn+retreat in Fn | verified |
| 23 | `world-space` | `boks_yellow` | `(4,1,up)` | `(2,4)` | F,L,R,B,Q | 3/3 | `B Q Q` (`Fn: L F F`) | `(4,0),(3,1),(5,1),(4,3),(3,3)` split Main/Fn | verified |
| 24 | `world-space` | `boks_yellow` | `(5,2,up)` | `(4,5)` | F,L,R,B,Q | 2/4 | `Q Q` (`Fn: B L F F`) | `(5,1),(4,2),(5,4)` compact final synthesis | verified |
