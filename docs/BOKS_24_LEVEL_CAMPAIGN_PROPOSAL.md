# BOKS - 24-Level Campaign Proposal

Status: design proposal only. Do not apply to `data/editor-levels.json` until
the full table and boards have been reviewed.

| # | Name | Start -> Goal | Blocks / slots | Obstacle purpose | Lesson |
|---:|---|---|---|---|---|
| 1 | First Step | X3,Y4,E -> X4,Y4 | F / 1 | None | One command moves one cell. |
| 2 | Count Two | X3,Y5,N -> X3,Y3 | F / 2 | None | Count distance. |
| 3 | Long Line | X3,Y6,N -> X3,Y3 | F / 3 | None | Plan before running. |
| 4 | Closed Ahead | X3,Y4,N -> X4,Y4 | F,R / 2 | X3,Y3 blocks forward | Turn right for a reason. |
| 5 | Mirror Door | X4,Y4,N -> X3,Y4 | F,L / 2 | X4,Y3 blocks forward | Turn left for a reason. |
| 6 | Around Corner | X3,Y5,N -> X4,Y3 | F,L,R / 4 | X3,Y3 closes direct line | Combine movement and turn. |
| 7 | Back One | X4,Y3,N -> X4,Y4 | B / 1 | None | Backward moves without turning. |
| 8 | Stay Facing | X3,Y2,E -> X1,Y2 | B / 2 | None | Backward preserves facing. |
| 9 | Short Exit | X3,Y4,N -> X3,Y5 | F,B / 1 | X3,Y3 closes forward | Backward is a shortcut. |
| 10 | Side Door | X3,Y5,N -> X5,Y4 | F,R,B / 4 | X3,Y3 closes direct route | Turn, then retreat without undoing orientation. |
| 11 | Pocket | X2,Y4,E -> X1,Y3 | F,L,B / 4 | X3,Y4 closes forward | Escape a small pocket. |
| 12 | First Corridor | X3,Y6,N -> X5,Y3 | F,L,R,B / 5 | X3,Y4; X4,Y4 | Read a corridor entrance. |
| 13 | False Shortcut | X2,Y5,N -> X4,Y4 | F,L,R,B / 5 | X2,Y4; X3,Y4 | The apparent direct path is false. |
| 14 | U Exit | X4,Y5,W -> X2,Y3 | F,L,R,B / 6 | X3,Y5; X4,Y4 | Backward exits a U-shape elegantly. |
| 15 | Two Routes | X1,Y4,E -> X4,Y2 | F,L,R,B / 6 | X3,Y4; X3,Y3 | Compare a long route and a clean route. |
| 16 | Gate Sequence | X5,Y5,N -> X2,Y2 | F,L,R,B / 7 | X5,Y3; X4,Y3; X3,Y2 | Full movement-language check. |
| 17 | Repeat One | X3,Y6,N -> X3,Y4 | F,Q / Main 1, Fn 2 | None | Function stores `F,F`. |
| 18 | Repeat Twice | X2,Y6,N -> X2,Y2 | F,Q / Main 2, Fn 2 | None | Call the same Function twice. |
| 19 | Bend Repeat | X2,Y6,N -> X4,Y4 | F,R,Q / Main 2, Fn 2 | X2,Y4 | Repeat a useful bend. |
| 20 | Same Shape, New Place | X5,Y5,W -> X3,Y3 | F,L,R,Q / Main 3, Fn 3 | X4,Y5 | Function is a reusable shape. |
| 21 | Retreat Routine | X3,Y5,N -> X3,Y2 | F,L,R,B,Q / Main 3, Fn 3 | X3,Y3 | Backward belongs inside a repeated route. |
| 22 | Split Decision | X1,Y5,E -> X4,Y2 | F,L,R,B,Q / Main 4, Fn 3 | X2,Y5; X3,Y3 | Decide what belongs in Main versus Function. |
| 23 | Cloud Bridge | X5,Y5,N -> X2,Y2 | F,L,R,B,Q / Main 5, Fn 3 | X5,Y3; X4,Y4; X3,Y3 | Compact synthesis with a false bridge. |
| 24 | Homeward | X4,Y6,W -> X2,Y2 | F,L,R,B,Q / Main 5, Fn 3 | X3,Y6; X4,Y4; X2,Y3 | Elegant finale, not endurance. |

## Review Gates

- All four orientations appear intentionally: N, E, S, W.
- Backward has five roles across levels 7-16.
- Obstacles begin at level 4 and always change the intended route.
- Function begins at 17 only after repeated patterns have existed.
- No level is specified with eight Main slots.
- Before implementation, each board must be checked by the real solver and
  replaced if its stated reference solution is not the best readable solution.
