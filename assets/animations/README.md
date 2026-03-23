# Animations

Questa cartella contiene i dati di animazione del gioco, non gli asset visivi.

Convenzione:

- `characters/<character-id>/manifest.js`
- `props/<prop-id>/manifest.js`
- eventuali sottocartelle runtime per frame, clip o sheet per stato

Uso previsto:

- definizione degli stati come `idle:right`, `move:left`, `turn:up`
- timing, fallback e transizioni
- mapping tra stato logico e art in `assets/characters/` o `assets/props/`
