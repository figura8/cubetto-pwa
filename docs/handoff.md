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
  - `icons/boks-character.png`
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
