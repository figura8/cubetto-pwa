# Game Assets

`assets/` contiene solo materiale di gioco.
Le icone installabili della PWA restano in `icons/`.

Struttura corrente:

- `characters/`
  Personaggi in-game, organizzati per personaggio.
- `animations/`
  Manifest stati, timing e transizioni per personaggi e prop.
- `audio/`
  Audio di gioco.
- `props/`
  Oggetti di scena, elementi ambientali e asset gameplay non-personaggio.

Convenzione consigliata:

- `characters/<character-id>/idle/`
- `characters/<character-id>/move/`
- `characters/<character-id>/turn/`
- `animations/characters/<character-id>/`
- `animations/props/<prop-id>/`
- `audio/sfx/`
- `audio/music/`
- `props/<theme>/`

Nota:

- `assets/animations/` e il percorso canonico da usare da ora in avanti.
- L'eventuale vecchia cartella `assets/animation-data/` puo essere rimossa in una pulizia successiva.
