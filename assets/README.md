# Game Assets

`assets/` contiene solo materiale di gioco.
Le icone installabili della PWA restano in `icons/`.

Struttura corrente:

- `characters/`
  Art e materiale visivo dei personaggi, organizzati per personaggio.
- `animations/`
  Manifest stati, timing e transizioni per personaggi e prop.
- `audio/`
  Audio di gioco.
- `props/`
  Oggetti di scena, elementi ambientali e asset gameplay non-personaggio.

Convenzione consigliata:

- `characters/<character-id>/`
- `animations/characters/<character-id>/`
- `animations/props/<prop-id>/`
- `audio/sfx/`
- `audio/music/`
- `props/<theme>/`

Nota:

- `assets/animations/` e il percorso canonico da usare da ora in avanti.
- `assets/characters/` non deve contenere cartelle di stati come `idle`, `move`, `turn`.
- Gli stati del runtime vivono in `assets/animations/`.
