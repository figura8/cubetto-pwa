# Handoff

Data: 2026-03-22

## Contesto

Progetto: `cubetto-pwa-main`

Obiettivo della sessione:
- capire il progetto
- controllare con precisione il flusso di apertura della PWA sul telefono
- mantenere il level editor su `main`
- modificare solo la fase di avvio dell'app

## Cosa abbiamo fatto

1. Analisi del progetto
- App frontend vanilla HTML/CSS/JS.
- PWA installabile con `manifest.webmanifest` e `service-worker.js`.
- Logica principale in `js/core/game.js`.
- Tutorial e livello base in `js/levels/level1.js`.
- Editor livelli in `js/editor/level-editor.js`.
- Solver editor in `js/editor/solver.js`.

2. Modifica del launch flow
- All'apertura da icona, l'app ora mostra una schermata nera per 3 secondi.
- Dopo i 3 secondi, il nero sfuma e appare il menu iniziale.
- Rimosso il tap-to-skip della splash.
- Queste modifiche sono state fatte in:
  - `js/core/game.js`
  - `styles/app.css`

3. Allineamento colori splash di sistema
- `theme-color` in `index.html` impostato a nero.
- `background_color` e `theme_color` in `manifest.webmanifest` impostati a nero.
- Obiettivo: rendere piu coerente la splash nativa del sistema con la schermata nera custom dell'app.

## Commit fatti

- `6d2523b` `Add controlled black launch screen`
- `1f8b6e5` `Align launch colors with black startup screen`

Entrambi sono stati pushati su `origin/main`.

## Nota importante sulla splash iniziale con icona ingrandita

Prima della schermata nera custom compare una schermata di avvio di sistema con l'icona dell'app ingrandita.

Questa parte:
- non dipende da Netlify
- avviene prima che il JavaScript della pagina possa eseguire codice
- e molto probabilmente e gestita da Android/Chrome o da iOS, a seconda del dispositivo

Conclusione pratica:
- non si puo controllare completamente da JS
- si puo solo cercare di armonizzarla tramite manifest, icone e colori

## Come riprendere la prossima volta

Se vuoi ripartire da qui, puoi dire:

- `leggi docs/handoff.md e riprendiamo`

Oppure:

- `continuiamo dal launch flow della PWA`

## Prossimi step possibili

- verificare sul telefono se il nero di sistema e quello custom ora risultano piu uniformi
- decidere se cambiare anche l'icona per evitare l'effetto "ingrandita"
- eventualmente separare in futuro il comportamento di `main` da quello del branch live
