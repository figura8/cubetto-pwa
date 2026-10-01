# BOKS 24-Level Validation Workbook

Status: in progress. This workbook is the required design and validation
artifact before replacing `data/editor-levels.json`.

## Notation

`S` start, `G` goal, `#` obstacle, `.` empty. Coordinates are X1-X6,
Y1-Y6. Reference programs use F, L, R, B, and Q (Function call).

## Level Table

| # | Name | Start orientation | Blocks | Main/Fn | Reference solution | Obstacle purpose | Pass |
|---:|---|---|---|---|---|---|---|
| 1 | First Step | East | F | 1/0 | F | None | verified |
| 2 | Count Two | North | F | 2/0 | F F | None | verified |
| 3 | Count Three | South | F | 3/0 | F F F | None | verified |
| 4 | Closed Ahead | North | F,R | 2/0 | R F | Blocks direct forward | verified |
| 5 | Mirror Door | South | F,L | 2/0 | L F | Blocks direct forward | verified |
| 6 | Around Corner | West | F,L,R | 6/0 | R F F L F | Closes the short line | verified |
| 7 | Back One | North | B | 1/0 | B | None: discovery | verified |
| 8 | Stay Facing | East | B | 2/0 | B B | None: preserved orientation | verified |
| 9 | Closed Forward | East | F,B | 2/0 | B B | X5,Y3 closes Forward | verified |
| 10 | Short Exit | North | F,L,B | 3/0 | B L F | X4,Y3 closes Forward | verified |
| 11 | Pocket | East | F,L,B | 3/0 | B L F | X4,Y5 closes Forward | verified |
| 12 | First Corridor | North | F,L,R,B | 5/0 | pending | Corridor entrance | pending |
| 13 | False Shortcut | East | F,L,R,B | 5/0 | pending | Direct route is closed | pending |
| 14 | U Exit | South | F,L,R,B | 6/0 | pending | U-shape exit | pending |
| 15 | Two Routes | West | F,L,R,B | 6/0 | pending | Makes route choice meaningful | pending |
| 16 | Gate Sequence | North | F,L,R,B | 7/0 | pending | Three gates create order | pending |
| 17 | Repeat One | North | F,Q | 1/2 | Q; Fn=F F | First Function | pending |
| 18 | Repeat Twice | West | F,Q | 2/2 | Q Q; Fn=F F | Genuine repetition | pending |
| 19 | Bend Repeat | South | F,R,Q | 2/2 | pending | Repeated bend | pending |
| 20 | Same Shape | East | F,L,R,Q | 3/3 | pending | Same routine in two places | pending |
| 21 | Retreat Routine | North | F,L,R,B,Q | 3/3 | pending | Backward inside Function | pending |
| 22 | Split Decision | West | F,L,R,B,Q | 4/3 | pending | Main vs Function choice | pending |
| 23 | Cloud Bridge | South | F,L,R,B,Q | 5/3 | pending | False bridge | pending |
| 24 | Homeward | East | F,L,R,B,Q | 5/3 | pending | Compact final synthesis | pending |

## Gate

Do not implement this workbook yet. Complete every `pending` solution, then
add and solver-check all 24 ASCII boards before applying campaign data.
