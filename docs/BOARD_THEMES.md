# BÖKS grid themes and manual decorations (PWA)

Themes affect ONLY the 6×6 grid surface, frame and cell colors.
Bricks, goal, BÖKS, page background, logo and interface keep their original appearance.
This boundary also applies to legacy themes. No theme automatically places small objects.

## Theme catalog and assignment

The ten-world catalog is in data/board-themes.json: Meadow, Sky, Rainy Street,
Train Station, Supermarket, School, Camping, Laundromat, Space and Beach.
Legacy themes remain available. Theme entries contain a grid palette and surfaceSvg only.
The renderer in js/themes/board-themes.js registers presentation entries in BOKS_LEVELS.
It reuses the original actor and goal rendering, without changing puzzle data or commands.

Assign a theme in Level Editor → Stile livello → Tema grafico → Salva.
The existing baseLevel presentation field stores its ID; absent or unknown IDs fall back to Meadow.
No campaign assignments are rewritten and no level-number switches are used.
Existing save policies apply: localhost can request the project's editor-levels.json file;
browser-only saves retain the existing project/draft loading policy.

## Manual decoration tools

All small automatic objects have been removed from the new and legacy themes.
Existing author-placed decorations are preserved.

Use Level Editor → Decorazioni, select a tool and tap/click the grid.
The catalog supplies Aquilone, Ombrello, Orologio stazione, Cesto di frutta, Matita,
Tenda, Calzino, Antenna, Conchiglia, Pietra, Nuvola and Ciuffo d’erba.
The original Alberello, Margherita, Api, Ponte and Gomma tools remain available.

Props are registered from the independent decorations array in data/board-themes.json.
Each has id, label, svg, layer, hint and defaults. They use the existing manual placement,
eraser, layer rendering and level persistence. Their asset IDs are saved in the level's
decorations field. Objects remain in place when the grid theme changes and do not alter
collision, available commands or solutions. New props require only a catalog entry.
No theme density, random seed or automatic ambient-object settings remain.

## Preview and authoring

Open /tools/board-theme-preview.html, also linked from the theme panel.
The dropdown and arrows compare all ten surfaces on one fixed 6×6 sample:
start (0,5) facing up, goal (0,1), obstacles (1,2), (2,3), (2,4), (2,5),
four Forward commands and no function slots. This utility does not run or save puzzles.

Expand Personalizza una copia del tema, edit its name, new ID and four grid colors,
then choose Anteprima copia. Scarica definizione JSON exports presentation data.
Add that object to the themes array in data/board-themes.json, reload and select it
in the editor. New surfaces can use a self-contained surfaceSvg with viewBox 0 0 100 100.
Use no external dependencies, scripts or foreignObject. No gameplay code changes are needed.

## Art and performance

New grid surfaces and manual prop SVGs are procedural placeholders.
Approved character/goal art is unchanged. No moodboard image was available.
Grid textures use cached CSS backgrounds. Themes add no prop DOM nodes, random placement
or per-frame animation. Props use the existing decoration layer only when manually placed.
New catalog and preview resources are included in offline caching.
Physical mobile frame-time testing remains outstanding.

## Files

Added:
- data/board-themes.json
- js/themes/board-themes.js
- styles/board-themes.css
- tools/board-theme-preview.html
- tools/board-theme-preview.css
- tools/board-theme-preview.js
- scripts/test-board-themes.js
- docs/BOARD_THEMES.md

Modified:
- js/core/game.js
- js/core/app-loader.js
- index.html
- service-worker.js
- styles/app.css

Earlier note-field work and pre-existing dirty campaign data are separate.
No Unity files, campaign puzzle data or interpreter code are modified.

## Verification

Run node scripts/test-board-themes.js. All seven tests pass.
Modified JavaScript parses and git diff --check passes.
Isolated Edge checks confirm no automatic objects across all 17 selectable themes,
12 migrated manual tools, umbrella placement, unchanged puzzle state, saved JSON,
retention across theme switches, eraser removal and a clean ten-theme preview.
The grid-only revision also compared page/header, controls, programs, bricks/patterns,
goal and actor styles across all themes; all stayed identical.
Prior responsive checks passed at 390×844 and 1024×768, and offline catalog/preview
loading passed. Physical devices and final production artwork remain unverified.
Tests use temporary browser profiles and never write the canonical campaign JSON.
