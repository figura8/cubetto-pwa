# Handoff

Data: 2026-03-22

## Contesto

Progetto: `cubetto-pwa-main`

Obiettivo della sessione:
- capire il progetto
- controllare con precisione il flusso di apertura della PWA sul telefono
- mantenere il level editor su `main`
- portare temporaneamente la produzione su GitHub Pages
- rendere verificabile subito dal telefono quale build e online

## Cosa abbiamo fatto

1. Analisi del progetto
- App frontend vanilla HTML/CSS/JS.
- PWA installabile con `manifest.webmanifest` e `service-worker.js`.
- Logica principale in `js/core/game.js`.
- Tutorial e livello base in `js/levels/level1.js`.
- Editor livelli in `js/editor/level-editor.js`.
- Solver editor in `js/editor/solver.js`.

2. Prima modifica del launch flow
- All'apertura da icona, l'app mostrava una schermata nera custom per alcuni secondi.
- L'obiettivo era uniformare la splash nativa del sistema con l'avvio dell'app.
- Queste modifiche erano state fatte in:
  - `js/core/game.js`
  - `styles/app.css`

3. Allineamento colori splash di sistema
- `theme-color` in `index.html` impostato a nero.
- `background_color` e `theme_color` in `manifest.webmanifest` impostati a nero.
- Obiettivo: rendere piu coerente la splash nativa del sistema con la schermata nera custom dell'app.

4. Preparazione icone Android maskable
- Aggiunte nuove icone Android `maskable`:
  - `icons/icon-192-maskable.png`
  - `icons/icon-512-maskable.png`
- Le nuove icone usano solo il personaggio centrale con piu margine, senza il riquadro bianco arrotondato originale.
- `manifest.webmanifest` aggiornato per dichiararle con `purpose: "maskable"`.
- `service-worker.js` aggiornato per includerle nel precache e portare `CACHE_VERSION` a `v7`.
- Obiettivo: ridurre l'effetto di icona troppo ingrandita nella splash di sistema Android e migliorare l'adaptive icon.

5. Rilascio su GitHub Pages
- Netlify e stato sospeso per esaurimento crediti.
- Il repository GitHub era gia presente: `figura8/cubetto-pwa`.
- E stato ricostruito il branch `live` partendo da `main` con una variante player-only.
- Poi si e deciso di pubblicare direttamente `main` su GitHub Pages.
- GitHub Pages ora deve puntare a:
  - branch `main`
  - cartella `/(root)`

6. Rimozione del nero custom e della splash intermedia
- Dopo i test su telefono, il nero custom da 3 secondi non serviva piu.
- E stato rimosso l'override nero iniziale.
- E stata rimossa anche la splash intermedia con loader che compariva tra la splash di sistema e il menu iniziale.
- Stato attuale del flow:
  - splash di sistema del telefono con icona piccola su nero
  - transizione molto rapida
  - menu iniziale

7. Build badge per verifica rapida da telefono
- Il badge build e stato mantenuto visibile all'avvio.
- Ora mostra:
  - numero build
  - data e ora della build
- La build corrente e centralizzata in `index.html` tramite `data-build`.
- Gli script dell'app vengono caricati tramite `js/core/app-loader.js` usando lo stesso build id per il cache-busting.
- E stato aggiunto lo script:
  - `scripts/stamp-build.ps1`
- Comando utile per aggiornare il numero build prima di pubblicare:
  - `powershell -ExecutionPolicy Bypass -File scripts\stamp-build.ps1`

8. Sostituzione della tartaruga con il personaggio dell'icona
- La tartaruga placeholder e stata sostituita con il personaggio identico dell'icona.
- E stato creato l'asset:
  - `icons/boks-character.png` (rimosso il 2026-03-25 durante il riordino icone)
- Il renderer del personaggio e stato aggiornato in:
  - `js/levels/level1.js`
- L'animazione base del personaggio e stata aggiunta in:
  - `styles/app.css`
- Poi il personaggio e stato ingrandito per aumentare la presenza nel tabellone.
- L'ombra sotto il personaggio e stata rimossa.

9. Strumenti locali per test rapido tra gioco ed editor
- Durante i test locali e stato aggiunto un bottone rapido `Editor` dentro il gioco.
- E stata aggiunta anche la shortcut da tastiera `E`.
- Il bottone e la shortcut ora funzionano come toggle:
  - entri nell'editor sul livello corrente
  - ripremi e torni al livello che stavi testando
- Questo e pensato come strumento di lavoro locale per iterare senza tornare ogni volta al menu iniziale.

## Commit fatti

- `6d2523b` `Add controlled black launch screen`
- `1f8b6e5` `Align launch colors with black startup screen`
- `1902713` `Add maskable Android app icons`
- `5e33f46` `Remove launch hold and add build stamp badge`
- `146258f` `Show build date and time in badge`
- `046b45c` `Remove intermediate splash loading state`
- `8c4ef1a` `Replace turtle with icon character sprite`
- `6a24b3b` `Scale up main character sprite`

Sono stati pushati su `origin/main`.

## Nota importante sulla splash iniziale con icona ingrandita

Prima delle modifiche finali compariva una schermata di avvio di sistema con l'icona dell'app ingrandita.

Questa parte:
- non dipende da Netlify
- avviene prima che il JavaScript della pagina possa eseguire codice
- e molto probabilmente e gestita da Android/Chrome o da iOS, a seconda del dispositivo

Conclusione pratica:
- non si puo controllare completamente da JS
- si puo solo cercare di armonizzarla tramite manifest, icone e colori

Aggiornamento:
- con le icone `maskable` l'icona iniziale di sistema risulta piu piccola e piu accettabile
- il problema principale non e piu la splash nativa, ma era la splash custom intermedia, che ora e stata rimossa

## Come riprendere la prossima volta

Se vuoi ripartire da qui, puoi dire:

- `leggi docs/handoff.md e riprendiamo`

Oppure:

- `continuiamo dal launch flow della PWA`

Oppure:

- `leggi docs/handoff.md e riprendiamo da GitHub Pages e build badge`

## Prossimi step possibili

- verificare dal telefono che GitHub Pages stia servendo davvero `main`
- controllare che il badge mostri sempre la build nuova dopo ogni push
- decidere in seguito se tornare a Netlify oppure restare su GitHub Pages
- decidere se tenere `main` come branch pubblicato o tornare a usare `live` come branch release
- rifinire ancora scala, animazione e feeling del personaggio principale
- decidere se il toggle rapido `Editor/Gioco` deve restare solo locale o diventare parte del flusso normale

---

# Aggiornamento

Data: 2026-03-23

## Contesto della sessione

Obiettivo della sessione:
- preparare il progetto per un nuovo personaggio 2D animato
- evitare che la struttura delle cartelle confondesse art e stati runtime
- rendere piu chiaro il flusso di salvataggio livelli dall'editor
- alleggerire `js/core/game.js` spostando fuori la persistenza livelli

## Cosa abbiamo fatto

1. Architettura personaggio
- E stato introdotto un renderer dedicato del personaggio in:
  - `js/core/character/character-renderer.js`
- E stato aggiunto un CSS dedicato del personaggio in:
  - `styles/character.css`
- Il gioco ora passa al renderer uno stato esplicito con:
  - `direction`
  - `action`
- Le azioni gestite attualmente sono:
  - `idle`
  - `move`
  - `turn`

2. Preparazione per animazioni future
- Anche senza avere ancora il personaggio finale o le animazioni definitive, il progetto ora e pronto a:
  - cambiare asset senza riscrivere il gameplay
  - aggiungere stati direzionali
  - aggiungere manifest e timing di animazione
- Il placeholder attuale resta solo come appoggio temporaneo.

3. Riorganizzazione cartelle asset
- E stata chiarita la convenzione:
  - `assets/characters/` contiene solo art dei personaggi
  - `assets/animations/` contiene stati, manifest e logica runtime delle animazioni
  - `assets/props/` contiene art dei prop
  - `assets/animations/props/` e pensata per animazioni dei prop
- Per `boks` ora la cartella personaggio contiene solo:
  - `assets/characters/boks/placeholder.png`
- Gli stati `idle/move/turn` non vivono piu dentro `assets/characters/`.

4. Manifest animazioni del personaggio
- E stato introdotto un manifest dedicato in:
  - `assets/animations/characters/boks/manifest.js`
- Questo manifest mappa gli stati runtime verso l'art del personaggio e i fallback temporanei.

5. Refactor della persistenza livelli editor
- La logica di persistenza livelli e stata estratta da `js/core/game.js` in:
  - `js/editor/level-storage.js`
- Dentro questo modulo ora vivono:
  - normalizzazione livelli custom
  - lettura/scrittura localStorage
  - import/export JSON
  - supporto File System Access API
  - persistenza file progetto
- `js/core/game.js` resta responsabile del flusso editor e tutorial, ma non della parte storage.

6. Verifica del salvataggio livelli reale nel progetto
- Durante la sessione e stato verificato il salvataggio manuale del file livelli nel progetto.
- Il file corretto da usare e:
  - `data/editor-levels.json`
- E stato confermato che, salvando li, Git vede davvero la modifica.
- E stato poi fatto commit e push del file livelli aggiornato.

## Flusso corretto per salvare un livello dall'editor

Per l'utente il flusso giusto e:
- aprire l'editor
- modificare il livello
- premere `Salva`
- se compare il file picker, selezionare il file progetto:
  - `data/editor-levels.json`
- controllare il messaggio finale

Interpretazione dei messaggi:
- `Livello salvato nel progetto: ora puoi fare commit`
  - il livello e davvero nel repo
- `Livello salvato solo in questa sessione`
  - il livello e solo locale nel browser e non ancora nel progetto

Conclusione pratica:
- se il salvataggio e nel progetto, dopo basta fare `git commit` e `git push`
- non servono modifiche manuali al codice per ogni livello

## Commit fatti in questa sessione

- `910ae42` `Prepare character animation architecture`
- `50e7801` `Extract editor level storage module`
- `bf6c94a` `Update editor levels`
- `a12179d` `Simplify character asset structure`

Sono stati pushati su `origin/main`.

## Stato attuale

- `main` e allineato a `origin/main`
- working tree pulito
- salvataggio livelli funzionante e verificato nel file progetto
- architettura personaggio pronta per asset e animazioni future
- separazione semantica piu chiara tra art (`characters`) e runtime animation (`animations`)

## Come riprendere la prossima volta

Se vuoi ripartire da qui, puoi dire:

- `leggi docs/handoff.md e riprendiamo dal character system`
- `leggi docs/handoff.md e continuiamo dal personaggio 2D`

---

# Aggiornamento

Data: 2026-03-24

## Contesto della sessione

Obiettivo della sessione:
- usare uno sprite sheet come base del personaggio di gioco
- creare un tool locale per ispezionare e correggere sprite sheet prima di integrarli
- rendere il tool raggiungibile dal menu iniziale
- aggiungere una diagnosi automatica per capire se uno sheet e adatto al progetto

## Cosa abbiamo fatto

1. Focus sul personaggio in gioco
- E stato verificato il rendering attuale del personaggio e il modo in cui il gioco lo posiziona sulla cella.
- Il contenitore runtime del personaggio resta sostanzialmente quasi quadrato e viene scalato dal gioco in:
  - `js/core/game.js`
- Il livello base continua a passare al renderer uno stato esplicito del personaggio in:
  - `js/levels/level1.js`

2. Tool standalone per sprite sheet
- E stato creato un tool locale dedicato in:
  - `tools/sprite-preview.html`
- Il tool permette di:
  - caricare uno sprite sheet dal progetto
  - caricare uno sprite sheet dal disco
  - impostare righe, colonne, intervallo frame, fps, scala e loop
  - vedere il frame animato e l'overview completa dello sheet

3. Spostamento del tool in cartella dedicata
- Il preview tool e stato tenuto fuori dalla root per non confonderlo con l'app principale.
- La posizione finale e:
  - `tools/sprite-preview.html`
- Il caricamento dei path del progetto e stato corretto in modo che valori come:
  - `icons/...`
  continuino a funzionare anche se la pagina vive sotto `tools/`.

4. Accesso dal menu iniziale
- E stato aggiunto un bottone nel gate iniziale dell'app per aprire direttamente il tool.
- I file toccati per questo sono:
  - `index.html`
  - `js/core/game.js`
  - `styles/app.css`
- Il bottone apre il preview tool in una nuova scheda, con fallback alla navigazione normale.

5. Modalita manuale per correggere sprite sheet imperfetti
- Il tool ora non si limita piu alla griglia uniforme.
- E stata aggiunta una modalita manuale con:
  - `offset X/Y`
  - `cell width/height`
  - `gap X/Y`
- E stato aggiunto anche il drag diretto sul riquadro attivo dentro l'overview dello sheet per:
  - spostare il crop
  - ridimensionare la cella
- Questo serve soprattutto per sheet generati male o con padding incoerente.

6. Analisi automatica di compatibilita col progetto
- Il tool ora prova a spiegare se uno sheet e sensato per questo gioco, non solo come ritagliarlo.
- L'analisi guarda:
  - proporzione del frame
  - frame vuoti
  - occupazione utile dello spazio
  - stabilita della baseline
  - drift orizzontale del soggetto
  - rischio clipping sui bordi
  - variazione di volume tra i frame
- L'obiettivo pratico e capire se:
  - lo sheet e gia pronto
  - va corretto col ritaglio manuale
  - conviene rigenerarlo

## Stato attuale

- il progetto ha ora un tool locale per validare sprite sheet prima di integrarli
- il menu iniziale dell'app puo aprire direttamente il tool
- il tool puo sia correggere manualmente i crop sia dare un giudizio tecnico di compatibilita
- resta ancora da decidere quale sprite sheet finale usare davvero per il personaggio in gioco

## Come riprendere la prossima volta

Se vuoi ripartire da qui, puoi dire:

- `leggi docs/handoff.md e riprendiamo dal tool sprite sheet`
- `leggi docs/handoff.md e valutiamo lo sprite del personaggio`
- `leggi docs/handoff.md e integriamo lo sheet finale nel renderer`
- `leggi docs/handoff.md e riprendiamo dal flusso di salvataggio editor`

## Prossimi step consigliati

- decidere il formato reale delle animazioni del personaggio:
  - frame sciolti
  - sprite sheet
  - animazioni CSS su singolo asset
- aggiungere una convenzione stabile di naming per stati e direzioni del character
- estrarre da `js/core/game.js` anche la parte stato tutorial/custom/editor
- pulire gli eventuali controlli UI editor non presenti nel markup

---

# Aggiornamento

Data: 2026-03-23

## Contesto della sessione

Obiettivo della sessione:
- chiarire il rapporto tra `main` e `live`
- verificare quale branch stesse servendo GitHub Pages
- automatizzare il rilascio di `live` partendo da `main`

## Cosa abbiamo chiarito

1. Stato branch
- Sul repository esistono ancora due branch:
  - `main`
  - `live`
- In locale esistono ancora due worktree separati:
  - `C:\Users\maurizio\Documents\cubetto-pwa-main` per `main`
  - `C:\Users\maurizio\Documents\cubetto-pwa` per `live`

2. Stato GitHub Pages
- E stato verificato che GitHub Pages stava servendo `live`, non `main`.
- Il contenuto pubblico corrispondeva alla variante player-only del branch `live`.

3. Regola operativa fissata
- `main` resta il branch di sviluppo quotidiano.
- `live` resta il branch di release pubblica per GitHub Pages.
- Quindi fare push su `main` da solo non aggiorna la produzione.

## Automazione introdotta

1. Flag di release nel markup
- In `index.html` sono stati aggiunti flag runtime tramite `data-*` per controllare:
  - canale release
  - editor abilitato/disabilitato
  - debug tools abilitati/disabilitati
  - build badge visibile/nascosto

2. Bootstrap runtime
- `js/core/app-loader.js` ora legge i flag runtime dal `body`.
- In base ai flag applica classi CSS e imposta `window.BOKS_RUNTIME_CONFIG`.
- In modalita `live` aggiorna anche il sottotitolo iniziale in versione player-only.

3. Guard rail nel gioco
- `js/core/game.js` ora legge i flag runtime e supporta:
  - `LEVEL_EDITOR_ENABLED`
  - `DEBUG_TOOLS_ENABLED`
- In modalita `live` vengono disattivati:
  - apertura editor
  - quick editor toggle
  - scorciatoie debug
  - caricamento iniziale dei livelli editor
- Se l'editor e disabilitato, il tutorial usa gli step ufficiali invece dei livelli custom.

4. Nascondimento UI release
- `styles/app.css` ora nasconde automaticamente in modalita `live`:
  - `startEditorBtn`
  - `quickEditorBtn`
  - toolbar editor
  - pannelli livelli/elementi
  - debug badge
  - build badge

5. Script nuovi
- E stato aggiunto:
  - `scripts/set-release-mode.ps1`
- Questo script imposta `main` o `live` aggiornando i flag in `index.html`.

- E stato aggiunto:
  - `scripts/release-live.ps1`
- Questo script:
  - controlla che `main` e `live` siano puliti
  - verifica che `main` sia gia pushato su `origin/main`
  - mostra un preflight esplicito sui livelli progetto (`data/editor-levels.json`)
  - chiede conferma umana prima di proseguire con la release
  - aggiorna il worktree `live`
  - mergea `origin/main` dentro `live`
  - esegue il build stamp
  - imposta la modalita `live`
  - crea il commit release
  - opzionalmente fa push su `origin/live`

- E stato esteso anche:
  - `scripts/stamp-build.ps1`
- Ora puo timbrare anche un repo/worktree passato via parametro `-RepoRoot`.

## Flusso corretto da ora in poi

Quando vuoi pubblicare una versione di `main` su `live`:

1. lavorare in `main`
2. fare commit su `main`
3. fare push su `origin/main`
4. controllare che i livelli/stili giusti siano davvero nel file progetto `data/editor-levels.json`
5. lanciare:
  - `powershell -ExecutionPolicy Bypass -File scripts\release-live.ps1 -Push`

Se invece vuoi solo preparare `live` localmente senza pubblicarlo ancora:
- `powershell -ExecutionPolicy Bypass -File scripts\release-live.ps1`

## Nota pratica importante

Lo script di release si ferma apposta se:
- `main` ha modifiche locali
- `live` ha modifiche locali
- `main` non e ancora stato pushato su `origin/main`
- il worktree non e sul branch giusto
- non confermi esplicitamente il preflight dei livelli progetto

Questo serve a evitare release incoerenti o pubblicazioni accidentali di codice non ancora sincronizzato.

Checklist minima prima di ogni release live:
- `main` pulito
- commit dei livelli gia fatto
- push su GitHub gia fatto
- `data/editor-levels.json` contiene davvero i livelli/stili che vuoi pubblicare
- solo dopo confermare il prompt dello script

## Come riprendere la prossima volta

Se vuoi ripartire da qui, puoi dire:

- `leggi docs/handoff.md e riprendiamo dal rilascio live`
- `leggi docs/handoff.md e verifichiamo il flusso main -> live`
- `leggi docs/handoff.md e continuiamo da GitHub Pages`

---

Data: 2026-03-25

## Handoff sessione grafica + personaggi

Obiettivo della sessione:
- iterare su stile grafico senza toccare la logica gameplay
- introdurre gestione stili per livello dentro editor
- introdurre pipeline personaggi scalabile (anche Lottie)

### Risultati principali

1. Tema `thomas` e resa "squadrata"
- Applicato stile senza arrotondamenti solo al tema `thomas`.
- Uniformato look squadrato agli elementi del tema per avvicinare il riferimento visuale.
- Confermato che il colore di sfondo globale resta quello richiesto (coerente con campagna).

2. Editor stili per livello
- Aggiunta sezione dedicata allo stile nel flusso editor, separata dall'editing classico.
- Possibilita di selezionare stile/tema e personalizzare colori.
- Aggiunta azione esplicita per applicare lo stile al livello selezionato.

3. UI/UX gioco
- Logo `BOKS` nel gioco reso cliccabile per tornare al menu principale.
- Stato hover/active del logo reso piu chiaro, con area click limitata alla sola scritta.
- Pulsante Play reso quadrato (senza angoli arrotondati) in gioco/menu/editor.
- Allineato anche feedback hover/active del Play.

4. Feedback quando premi Play senza blocchi
- Rimossa notifica testuale non necessaria.
- Aggiunta animazione sui blocchi disponibili per comunicare "servono blocchi prima di avviare".

5. Brand e icone
- Riordino cartella `icons` e pulizia asset non piu usati.
- Icone aggiornate con sola scritta `BOKS` (stesso font/look del riferimento, spaziatura piu stretta).
- Scritta titolo in gioco resa "asciutta" senza ombreggiature.

6. Architettura personaggi scalabile (1, 4, 10+ personaggi)
- Introdotto supporto `characterId` nei livelli custom/editor con fallback sicuro.
- Aggiunto picker personaggio nell'editor stile.
- Runtime ora risolve personaggio per livello/step in modo backward-compatible.

7. Supporto Lottie
- Integrato renderer con supporto immagine + Lottie.
- Loader aggiornato con registry personaggi (`assets/animations/characters/registry.json`).
- Supporto a libreria locale `js/vendor/lottie.min.js` con fallback CDN.
- Aggiunta documentazione base in `assets/animations/README.md`.

8. Asset personaggi
- Rinominata cartella personaggio da `boks` a `boks_black`.
- Aggiunto placeholder orientamento `bock_base` per test direzioni.
- Supportati stati direzionali `idle`/`move`/`turn` con fallback dove mancano asset.

9. Fix fluidita transizioni direzionali
- Migliorata transizione di turn (`up -> right`) renderizzando lo stato target durante rotazione.
- Ridotti flash Lottie:
  - avvio controllato senza autoplay immediato
  - seek prima del play
  - preview visibile durante il load
- Ultima regolazione: rotazione resa piu lenta e meccanica (`TURN_MS` da `320` a `520`).

### Note operative

- Branch operativo confermato: `main`.
- Modifiche fatte per mantenere separazione tra stile/visual e logica core di gioco.
