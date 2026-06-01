# BOKS Handoff

Data ultimo aggiornamento: 2026-06-01

## Ripresa Rapida

Per riprendere il lavoro, dire:

- `leggi docs/handoff.md e riprendiamo dal tutorial BOKS`
- oppure: `leggi docs/handoff.md, apriamo il Tutorial Editor e continuiamo dalla sequenza da sistemare`

Il file `BOKS_ClaudeCode_Briefing.md` e un documento di visione per il tutorial narrativo. Non va seguito alla lettera nella parte TypeScript/`src/`, perche il progetto reale e vanilla HTML/CSS/JS.

## Stato Attuale Del Progetto

- Progetto PWA statica, senza `package.json` e senza build step.
- Branch operativo: `main`.
- Working tree da controllare sempre con `git status --short` prima di modificare.
- Entry point principale: `index.html`.
- Bootstrap runtime: `js/core/app-loader.js`.
- Logica principale: `js/core/game.js`.
- Storage livelli editor: `js/editor/level-storage.js`.
- Helper editor: `js/editor/level-editor.js`.
- Renderer personaggi: `js/core/character/character-renderer.js`.
- Livelli salvati dall'editor: `data/editor-levels.json`.
- Runtime tutorial: `js/tutorial/tutorial-engine.js`, `js/tutorial/tutorial-data.js`.
- Sorgente canonica tutorial/editor: `src/tutorial/tutorialData.ts`.
- Editor tutorial: `dev/tutorial-editor/index.html` con server locale `dev/tutorial-editor/server.js`.
- CSS principale: `styles/app.css`.
- CSS personaggi: `styles/character.css`.
- CSS tutorial: `styles/tutorial.css`.
- PWA/service worker: `manifest.webmanifest`, `service-worker.js`, `js/core/sw-register.js`.

Il progetto usa moduli caricati via script e API globali `window.BOKS_*`, non import/export ES module.

## Stato Tutorial Dopo La Release Del 2026-06-01

Il tutorial data-driven e stato implementato e pubblicato in live.

- Commit `main`: `669ee37 Add guided tutorial flow`.
- Commit `live`: `6a5b1b4 Prepare live player-only release`.
- Build live: `20260601-201601`.
- Il tutorial parte dal menu principale tramite la bolla tutorial.
- Prima del completamento tutorial, il menu mostra solo la bolla tutorial.
- Al completamento, viene salvato `localStorage['boks-tutorial-completed-v2'] = '1'`.
- Dopo il completamento, tornando al menu si sbloccano le altre due bolle.
- Il reset progress rimuove anche il flag `boks-tutorial-completed-v2`.
- La fine tutorial usa `finishTutorial`, riproduce l'effetto finale livello completato e torna al menu principale.

Il tutorial attuale copre:

- introduzione di BOKS
- blocco forward
- sequenza programma
- play
- turn right
- turn left
- function block e function area
- prova finale libera con BOKS e goal/bolla da scoppiare

## Regola Importante: Audio Si, Caption Visive No

Il tutorial deve usare le narration per audio e timing, ma non deve mostrare vignette/caption testuali nel gioco.

- In `js/tutorial/tutorial-engine.js`, le caption sono nascoste di default.
- Il codice usa `window.BOKS_TUTORIAL_HIDE_CAPTIONS !== false` per decidere se mostrare testo.
- Non cancellare i beat `Narration` per togliere testo a schermo: servono per audio e timing.
- Se serve debug visuale, in console si puo impostare `window.BOKS_TUTORIAL_HIDE_CAPTIONS = false`.
- Se un audio non parte, il beat aspetta comunque `durationMs`, cosi il timing non collassa.

Durante la sessione del 2026-06-01 era stato rimosso per errore il beat audio:

- `This green meadow is a grid where our friend Bocs can move with your help!`
- `assets/audio/sfx/gameplay/02_this_green_meadow_is_a.mp3`

Il beat e stato rimesso in `src/tutorial/tutorialData.ts` e `js/tutorial/tutorial-data.js`. Non rimuoverlo solo per nascondere la caption.

## Tutorial Editor

Editor locale:

- URL con server: `http://127.0.0.1:8787/dev/tutorial-editor`
- Server: `node dev/tutorial-editor/server.js`
- Script helper: `dev/tutorial-editor/start.ps1` o `dev/tutorial-editor/start.bat`

Funzioni aggiunte all'editor:

- checkpoint per posizione iniziale BOKS (`boksPosition`)
- checkpoint per posizione goal (`goalPosition`)
- `Place` beat per posizionare BOKS o goal sulla griglia
- `Call` beat per chiamare azioni runtime come `openAllSlots` e `finishTutorial`
- supporto `function_block`
- supporto `function_area`
- highlight della function area
- wait target per blocco (`forward`, `left`, `right`, `function`)
- wait target per zona (`function_area`/`fn`)
- condizione `function_ready` su `PLAY_PRESSED`
- evento `GOAL_POPPED`

Nota sui draft:

- La chiave draft attuale dell'editor e `boks-dev-tutorial-editor-draft-v3`.
- Questa chiave e stata cambiata per evitare che l'editor ricaricasse un vecchio draft sporco con `openAllSlots`, `Unlock ALL` e `GOAL_POPPED` dentro l'INTRO.
- Se l'editor mostra contenuti strani, controllare prima `localStorage` e il draft caricato.

## Runtime Tutorial

API principali esposte in `window.BOKS_TUTORIAL_STAGE`:

- `revealBoks`
- `setBoksPosition`
- `setGoalPosition`
- `setBoksOrientationRight/Down/Left/Up`
- `revealForwardBlock`
- `revealLeftBlock`
- `revealRightBlock`
- `revealFunctionBlock`
- `revealSlot`
- `revealFunctionArea`
- `setMainProgramSlot`
- `clearMainProgramSlot`
- `unlockDragBlock`
- `lockDragBlock`
- `unlockPlay`
- `lockPlay`
- `openAllSlots`
- `finishTutorial`
- `waitFor`

Eventi/attese importanti:

- `block-dropped`
- `block-removed`
- `block-drop-failed`
- `play-pressed`
- `execution-finished`
- `goal-popped`

Payload drop/removal:

- `blockType`
- `zone` (`main` o `fn`)
- `slotIndex`

La sequenza turn e stata resa piu tollerante:

- Per sostituire `forward` con `right`, basta droppare `right` nello slot.
- Non e obbligatorio aspettare `BLOCK_REMOVED_FROM_SLOT` prima del drop.

La function richiede:

- nella sequence area deve esserci solo il blocco `function`
- nella function area deve esserci almeno un blocco
- questa condizione e `function_ready`

## File Audio Tutorial

Sono stati aggiunti molti MP3 in `assets/audio/sfx/gameplay/`.

`service-worker.js` e stato aggiornato:

- `CACHE_VERSION = 'v33'`
- precache degli audio tutorial effettivamente referenziati da `src/tutorial/tutorialData.ts`

Se si aggiungono nuovi audio referenziati dal tutorial:

- verificare che il file esista nel repo
- aggiornare `service-worker.js` se deve essere disponibile offline/precache
- incrementare `CACHE_VERSION`
- controllare `node --check service-worker.js`

## Come Usare Il Briefing Storico

`BOKS_ClaudeCode_Briefing.md` contiene una buona visione narrativa:

- target 3-6 anni
- tono calmo, tattile, magico
- una sola cosa alla volta
- nessun fail state
- nessun timer di scadenza
- nessun feedback negativo quando qualcosa e bloccato

La parte tecnica del briefing propone invece una struttura:

- `src/tutorial/TutorialEngine.ts`
- `src/game/Boks.ts`
- TypeScript

Questa parte e da adattare. Non creare un nuovo progetto parallelo in `src/`. Tradurre i concetti in moduli vanilla JS coerenti col repo attuale.

Nota: il file `BOKS_TutorialSystem_Spec.md` citato nel briefing non e presente nel progetto.

## Architettura Tutorial Attuale

I moduli vanilla JS caricati da `app-loader.js` sono:

- `js/tutorial/tutorial-engine.js`
- `js/tutorial/tutorial-data.js`
- `styles/tutorial.css`

API globali:

- `window.BOKS_TUTORIAL_ENGINE`
- `window.BOKS_TUTORIAL_DATA`
- `window.BOKS_TUTORIAL_STAGE`

Il motore tutorial esegue beat legacy runtime, per esempio:

```js
{ type: 'narration', text: 'Hello', audio: 'assets/audio/sfx/gameplay/01_hello.mp3' }
{ type: 'call', action: 'revealBoks' }
{ type: 'call', action: 'unlockDragBlock' }
{ type: 'waitFor', event: 'block-dropped', count: 1, target: 'right' }
```

`game.js` dovrebbe solo emettere eventi e rispettare i lock, non contenere la sceneggiatura del tutorial.

## Regole Fondamentali Tutorial

- nessun errore visivo o sonoro
- nessun timer di scadenza
- se l'interazione non e permessa, semplicemente non succede nulla
- il tutorial aspetta il bambino quanto serve
- niente caption/vignette visive nel gioco, solo audio e interazioni

## Punti Tecnici Da Tenere A Mente

- `js/core/game.js` e ancora monolitico: toccarlo con patch piccole e mirate.
- L'app carica gli script in sequenza da `js/core/app-loader.js`; ogni nuovo modulo va aggiunto li.
- Lo storage livelli e gia separato in `js/editor/level-storage.js`.
- Il renderer personaggi e gia separato e supporta manifest, SVG, immagini e Lottie.
- In locale il service worker viene disregistrato da `js/core/sw-register.js`; in produzione resta attivo.
- `service-worker.js` contiene una lista di precache: se si aggiungono file necessari offline, aggiornarla e incrementare `CACHE_VERSION`.
- Alcuni output PowerShell possono mostrare caratteri strani sul nome `BOKS`; verificare sempre in editor/browser prima di modificare encoding o testi.
- Il progetto non ha `package.json`; i check rapidi sono `node --check` sui file JS modificati.
- `gh` CLI non e installato in questo ambiente; per push si usa `git` diretto.
- Questo checkout e un git worktree: a volte `git add` o `git commit` richiedono permessi elevati per scrivere l'indice nella repo madre.

## Flusso Livelli Editor

Per salvare un livello dall'editor nel progetto:

- aprire editor
- modificare livello
- premere `Salva`
- se compare il file picker, selezionare `data/editor-levels.json`
- messaggio corretto: `Livello salvato nel progetto: ora puoi fare commit`

Se il messaggio dice che il livello e salvato solo in sessione/browser, non e ancora persistito nel repo.

## Release Live

Storicamente il progetto usa due branch:

- `main`: sviluppo quotidiano
- `live`: release pubblica per GitHub Pages

Sono presenti script:

- `scripts/stamp-build.ps1`
- `scripts/set-release-mode.ps1`
- `scripts/release-live.ps1`

Flusso previsto per pubblicare:

1. lavorare e committare su `main`
2. pushare `origin/main`
3. verificare `data/editor-levels.json`
4. lanciare `powershell -ExecutionPolicy Bypass -File scripts\release-live.ps1 -Push`

Ultima release eseguita correttamente il 2026-06-01:

- `main` pulito e pushato a `origin/main`
- `live` worktree in `..\cubetto-pwa`, branch `live`, pulito
- comando usato: `powershell -ExecutionPolicy Bypass -File .\scripts\release-live.ps1 -Push -SkipConfirmation`
- commit live generato: `6a5b1b4 Prepare live player-only release`
- build live: `20260601-201601`

Se si usa senza `-SkipConfirmation`, lo script chiede conferma sul preflight livelli.

## Storico Condensato

- La PWA ha avuto lavoro su splash, icone Android maskable, build badge e GitHub Pages.
- Il progetto ha un editor livelli con salvataggio su `data/editor-levels.json`.
- Esistono tool locali in `tools/`: sprite preview, VFX tool, Lottie inspector, grid export.
- E stata introdotta una pipeline personaggi scalabile con `characterId`, picker personaggio, registry manifest e supporto Lottie.
- Il menu iniziale puo aprire strumenti di lavoro come Sprite Sheet Tool, VFX Tool e Lottie Tool.
- Il logo BOKS nel gioco torna al menu principale.
- Sono state fatte iterazioni su stile, temi, decorazioni, sandbox e feeling del personaggio.
- Il Tutorial Builder e il runtime tutorial sono ora presenti.
- Il tutorial e stato pubblicato in live con audio e sblocco menu post-completamento.

## Prossimo Passo Consigliato

Obiettivi consigliati per la prossima sessione:

- testare la live su browser pulito/mobile reale
- verificare che il tutorial parta con solo la bolla tutorial nel menu
- completare il tutorial e verificare lo sblocco delle altre due bolle
- fare pulizia degli MP3 duplicati/non referenziati solo dopo aver controllato cosa viene usato in `src/tutorial/tutorialData.ts`
- migliorare testi/audio del tutorial editor senza rimuovere narration necessarie al timing
- eventualmente aggiungere un comando nel tutorial editor per forzare reload da repo ignorando draft locale

Check rapidi utili:

```powershell
node --check .\js\core\game.js
node --check .\js\tutorial\tutorial-engine.js
node --check .\js\tutorial\tutorial-data.js
node --check .\service-worker.js
git status -sb
```
