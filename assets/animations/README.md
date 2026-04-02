# Animations

Questa cartella contiene i dati di animazione del gioco, non gli asset visivi.

Convenzione:

- `characters/<character-id>/manifest.js`
- `characters/registry.json` per elencare i manifest da caricare
- `decor/<decor-id>.json` per clip Lottie decorative leggere
- eventuali sottocartelle runtime per frame, clip o sheet per stato

Uso previsto:

- definizione degli stati come `idle:right`, `move:left`, `turn:up`
- timing, fallback e transizioni
- mapping tra stato logico e art in `assets/characters/` o `assets/props/`
- clip decorative ambientali come `bee_swarm_hover.json`, foglie o particellari leggeri
- gli asset statici non animati devono restare in `assets/characters/` o `assets/props/`, non in `assets/animations/`

## Supporto Lottie (Bodymovin)

Ogni stato personaggio puo usare:

- raster/SVG classico: `src`
- Lottie JSON: `lottieSrc`

Campi opzionali per stato Lottie:

- `previewSrc`: immagine fallback mostrata mentre Lottie non e pronto o non disponibile
- `lottieLoop`: default `true`
- `lottieAutoplay`: default `true`
- `lottieRenderer`: `svg` (default) o `canvas`

Nota runtime:

- per abilitare il playback Lottie, aggiungere `js/vendor/lottie.min.js`
- se il file non esiste, il gioco resta funzionante e usa il fallback immagine
