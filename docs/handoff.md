# BÖKS — Handoff

Ultimo aggiornamento: 2026-09-30

Branch di lavoro: `main`

Ultimo commit rilevante: `c1895da Update editor levels`

## Ripresa rapida

Il progetto è una PWA statica vanilla HTML/CSS/JavaScript: non ha `package.json` né build step.

Per avviarla in locale dalla root:

```powershell
python -m http.server 8080
```

Aprire `http://localhost:8080`.

Prima di modificare o fare commit:

```powershell
git status --short
```

Al momento esiste una cartella non tracciata `UnityExport/`: non aggiungerla a un commit senza una richiesta esplicita.

## Struttura essenziale

- Entry point: `index.html`
- Bootstrap e ordine script: `js/core/app-loader.js`
- Runtime principale e UI editor: `js/core/game.js`
- Stili principali: `styles/app.css`
- Storage livelli: `js/editor/level-storage.js`
- Solver: `js/editor/solver.js`
- Helper editor: `js/editor/level-editor.js`
- Livelli salvati: `data/editor-levels.json`
- Livelli/temi base: `js/levels/level1.js`
- Renderer personaggi: `js/core/character/character-renderer.js`
- Tutorial: `js/tutorial/tutorial-engine.js`, `js/tutorial/tutorial-data.js`
- Service worker: `service-worker.js`

Gli script sono caricati in sequenza e condividono API globali `window.BOKS_*`; non convertire parti isolate a ES modules.

## Level Editor — stato attuale

L’editor desktop è organizzato in **tre colonne reali**:

1. **Sinistra**: BUILD, Salva, Stile, VFX Tool, Lottie Tool, Torna al gioco, stato editor e livelli.
2. **Centro**: tab `Elementi`, `Decorazioni`, `Stile livello` e relativo contenuto.
3. **Destra**: lavagna live, blocchi disponibili e programma.

La colonna della lavagna è sticky nel layout desktop; i pannelli centrali hanno scroll interno. Evitare pannelli con `position: fixed` o `absolute` nell’editor.

### Tab dell’editor

- **Elementi**: BÖKS, Goal, Mattone, direzione iniziale, personaggio e proprietà livello.
- **Decorazioni**: Gomma, Alberello, Margherita, Api e Ponte. I controlli mantengono i dati in `activeLevelDecorations` e non vanno duplicati in altre palette.
- **Stile livello**: temi, personaggi, colori e stili salvati.

Lo stato selezionato delle tab è UI-only (`editorWorkspaceTab` e `editorStylePanelOpen` in `js/core/game.js`). Conservare gli ID esistenti, perché sono usati dagli handler:

- `editorElementsTab` / `editorElementsPane`
- `editorDecorationsTab` / `editorDecorationsPane`
- `editorStyleTab` / `editorStylePane`
- `elementPalette`, `decorationPalette`, `themePicker`

Il badge stato editor è `#debugBadge`: è parte della colonna sinistra, tra toolbar e livelli, in normale document flow. Il testo continua a essere aggiornato dal runtime esistente.

## Livelli e temi

- `data/editor-levels.json` contiene attualmente 23 livelli editor.
- I temi selezionabili sono definiti in `js/levels/level1.js`: Base, Prato, Città, Universo, Zelda Greco, Manuale01 e Thomas.
- Ogni livello può salvare `baseLevel`, `characterId`, `themeOverrides`, ostacoli, direzione iniziale, blocchi e decorazioni.

Per salvare un livello nel repository:

1. Aprire il Level Editor.
2. Modificare il livello e premere `Salva`.
3. Se richiesto, scegliere `data/editor-levels.json`.
4. Verificare che il messaggio confermi il salvataggio nel progetto, non solo nel browser/sessione.
5. Controllare il diff prima del commit.

## Tutorial

Il tutorial è data-driven e parte dalla bolla tutorial del menu.

- Runtime: `js/tutorial/tutorial-engine.js`
- Dati runtime: `js/tutorial/tutorial-data.js`
- Sorgente editor/tutorial: `src/tutorial/tutorialData.ts`
- Editor locale: `dev/tutorial-editor/index.html`
- Server editor: `node dev/tutorial-editor/server.js`

Regola UX: il tutorial usa audio e timing, ma non caption testuali visibili di default. Non rimuovere beat `narration` solo per nascondere testo: controllano anche il timing.

## PWA e offline

`service-worker.js` usa attualmente `CACHE_VERSION = 'v38'`.

Quando si aggiunge o rinomina una risorsa necessaria offline:

1. aggiungerla al precache se appropriato;
2. incrementare `CACHE_VERSION`;
3. eseguire `node --check service-worker.js`.

In locale il service worker viene disregistrato tramite `js/core/sw-register.js`; in produzione resta attivo.

## Verifiche rapide

```powershell
node --check .\js\core\game.js
node --check .\js\core\debug-tools.js
node --check .\js\tutorial\tutorial-engine.js
node --check .\js\tutorial\tutorial-data.js
node --check .\service-worker.js
git diff --check
git status -sb
```

Per modifiche UI dell’editor, verificare manualmente:

- apertura dell’editor su desktop;
- tab Elementi, Decorazioni e Stile livello;
- selezione/rimozione decorazioni;
- salvataggio livello;
- lavagna e programma sempre visibili senza sovrapposizioni.

## Git e release

- Sviluppo: `main`
- Release pubblica GitHub Pages: `live`
- Remote: `origin` → `https://github.com/figura8/cubetto-pwa.git`

Flusso normale:

```powershell
git add <file mirati>
git commit -m "Descrizione"
git push origin main
```

Per una release live usare gli script in `scripts/`, in particolare:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-live.ps1 -Push
```

Prima della release, verificare sempre `data/editor-levels.json`, il service worker e lo stato pulito dei worktree coinvolti.
