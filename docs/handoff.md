# BOKS Handoff

Data ultimo aggiornamento: 2026-05-15

## Ripresa Rapida

Per riprendere il lavoro, dire:

- `leggi docs/handoff.md e riprendiamo dal Tutorial Builder`
- oppure: `leggi BOKS_ClaudeCode_Briefing.md e docs/handoff.md, riprendiamo dalla terza bolla tutorial`

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
- CSS principale: `styles/app.css`.
- CSS personaggi: `styles/character.css`.
- PWA/service worker: `manifest.webmanifest`, `service-worker.js`, `js/core/sw-register.js`.

Il progetto usa moduli caricati via script e API globali `window.BOKS_*`, non import/export ES module.

## Decisione Nuova: Tutorial Builder

Tutto parte dal menu principale: oggi ci sono due bolle principali.

- Challenge / livelli
- Sandbox / modalita libera

Serve una terza bolla:

- Tutorial / esperienza guidata narrativa

Questa terza modalita non deve essere un tutorial hardcoded passo-passo dentro `game.js`. L'obiettivo e creare un sistema modulare/data-driven per costruire esperienze guidate dentro BOKS.

Il tutorial deve poter gestire:

- narrazione testuale
- file audio, con fallback se non esistono ancora
- caption a schermo
- elementi che appaiono/scompaiono
- transizioni e highlight
- blocco/sblocco progressivo delle interazioni
- attesa di eventi utente
- condizioni custom, per esempio "BOKS e stato trascinato 3 volte" o "BOKS e tornato all'orientamento iniziale"

La visione finale e un tool autore, simile agli altri tool in `tools/`, che permetta di comporre/modificare questi beat senza istruire l'agente o il codice ogni volta.

## Come Usare Il Briefing

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

## Architettura Consigliata

Creare moduli vanilla JS caricati da `app-loader.js`, per esempio:

- `js/tutorial/tutorial-engine.js`
- `js/tutorial/tutorial-data.js`
- `js/tutorial/systems/game-event-bus.js`
- `js/tutorial/systems/interaction-lock.js`
- `js/tutorial/systems/narrator-caption.js`
- `js/tutorial/systems/transition-manager.js`
- `js/tutorial/systems/condition-registry.js`
- `js/tutorial/systems/tutorial-audio.js`
- `styles/tutorial.css`

Esporre API globali coerenti con il progetto, per esempio:

- `window.BOKS_TUTORIAL_ENGINE`
- `window.BOKS_TUTORIAL_DATA`
- `window.BOKS_GAME_EVENT_BUS`
- `window.BOKS_INTERACTION_LOCK`

Il motore tutorial dovrebbe eseguire beat dati-driven, per esempio:

```js
{ type: 'narration', text: 'Benvenuto.', audio: '01_benvenuto.mp3' }
{ type: 'show', target: 'boks', transition: 'bounce-in' }
{ type: 'unlock', interactions: ['drag-boks'] }
{ type: 'waitFor', event: 'boks-drag-released', count: 3 }
{ type: 'highlight', target: 'play-button' }
```

`game.js` dovrebbe solo emettere eventi e rispettare i lock, non contenere la sceneggiatura del tutorial.

## Ordine Di Implementazione Consigliato

1. Aggiungere la terza bolla Tutorial nel menu principale.
2. Creare un runtime tutorial data-driven minimo.
3. Creare event bus e interaction lock.
4. Integrare in `game.js` gli eventi base:
   - drag/release di BOKS
   - double tap / rotazione
   - drag blocco
   - drop in slot
   - press play
   - fine esecuzione programma
5. Scrivere il primo tutorial come dati in `tutorial-data.js`.
6. Aggiungere CSS/transizioni/caption.
7. Solo dopo, creare il tool visuale in `tools/` per editare/esportare i beat.

La prima versione del tool autore puo essere semplice:

- lista dei beat
- editor del beat selezionato
- campi per testo, audio, target, durata, transizione, evento atteso, interazioni abilitate
- export in JSON/JS
- preview opzionale

Nome mentale utile: `BOKS Story/Guide Builder`, non solo tutorial. Oggi serve per onboarding, domani puo servire per intro mondi, micro-storie, nuovi blocchi o livelli narrativi.

## Beat Narrativi Del Primo Tutorial

Dal briefing, gli 8 momenti previsti sono:

1. Il mondo appare: prato vuoto, voce, nessun input.
2. BOKS appare: spawn morbido, voce, nessun input.
3. Insegnare il drag: sbloccare solo drag BOKS, completare dopo 3 release.
4. Insegnare orientamento: sbloccare solo double tap, completare quando torna all'orientamento iniziale.
5. Il blocco forward: appare un blocco, non ancora draggabile.
6. Lo slot: appare un solo slot, sbloccare drag blocco + drop in slot.
7. Play: appare tasto play, sbloccare solo press play, aspettare fine esecuzione.
8. Obiettivo: appare il fiore/goal, poi sbloccare tutto e finire tutorial.

Regole fondamentali:

- nessun errore visivo o sonoro
- nessun timer di scadenza
- se l'interazione non e permessa, semplicemente non succede nulla
- non mostrare subito tutti gli 8 slot nel tutorial
- il tutorial aspetta il bambino quanto serve

## Punti Tecnici Da Tenere A Mente

- `js/core/game.js` e ancora monolitico: toccarlo con patch piccole e mirate.
- L'app carica gli script in sequenza da `js/core/app-loader.js`; ogni nuovo modulo va aggiunto li.
- Lo storage livelli e gia separato in `js/editor/level-storage.js`.
- Il renderer personaggi e gia separato e supporta manifest, SVG, immagini e Lottie.
- In locale il service worker viene disregistrato da `js/core/sw-register.js`; in produzione resta attivo.
- `service-worker.js` contiene una lista di precache: se si aggiungono file necessari offline, aggiornarla e incrementare `CACHE_VERSION`.
- Alcuni output PowerShell possono mostrare caratteri strani sul nome `BOKS`; verificare sempre in editor/browser prima di modificare encoding o testi.

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

Prima di usare questo flusso, verificare che sia ancora quello attuale per GitHub Pages.

## Storico Condensato

- La PWA ha avuto lavoro su splash, icone Android maskable, build badge e GitHub Pages.
- Il progetto ha un editor livelli con salvataggio su `data/editor-levels.json`.
- Esistono tool locali in `tools/`: sprite preview, VFX tool, Lottie inspector, grid export.
- E stata introdotta una pipeline personaggi scalabile con `characterId`, picker personaggio, registry manifest e supporto Lottie.
- Il menu iniziale puo aprire strumenti di lavoro come Sprite Sheet Tool, VFX Tool e Lottie Tool.
- Il logo BOKS nel gioco torna al menu principale.
- Sono state fatte iterazioni su stile, temi, decorazioni, sandbox e feeling del personaggio.

## Prossimo Passo Consigliato

Partire dalla terza bolla Tutorial e da un runtime minimo, non dal tool completo.

Obiettivo della prossima sessione:

- aggiungere la nuova entrata Tutorial nel menu
- definire i primi moduli `js/tutorial/`
- fare una prova con 2-3 beat semplici
- collegare almeno un evento reale da `game.js`

Quando il linguaggio dei beat funziona, costruire il tool autore sopra quel linguaggio.
