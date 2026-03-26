# Boks Black Runtime

Questa cartella e riservata ai file Lottie runtime del character `boks_black`.

## Dove mettere i file

Metti qui tutti i `.json` esportati da After Effects / Lottie.

Percorso:

- `assets/animations/characters/boks_black/`

## Naming consigliato

### Idle direzionali

- `boks_black_idle_right.json`
- `boks_black_idle_left.json`
- `boks_black_idle_up.json`
- `boks_black_idle_down.json`

### Turn specifici per coppia di direzioni

- `boks_black_turn_right_to_up.json`
- `boks_black_turn_right_to_down.json`
- `boks_black_turn_up_to_right.json`
- `boks_black_turn_up_to_left.json`
- `boks_black_turn_left_to_up.json`
- `boks_black_turn_left_to_down.json`
- `boks_black_turn_down_to_right.json`
- `boks_black_turn_down_to_left.json`

## Convenzione pratica

- usa solo lettere minuscole
- usa underscore `_`
- evita versioni nel nome finche stiamo iterando sulla prima integrazione
- se proprio serve una variante temporanea, usa suffissi come:
  - `boks_black_idle_right_v02.json`

## Nota tecnica importante

Il runtime attuale supporta gia bene gli stati direzionali.
Per supportare in modo pieno le transizioni `from -> to` con Lottie dedicate, il prossimo step sara aggiornare il manifest/runtime del character.

Quindi puoi iniziare subito a consegnare:

1. i 4 idle
2. poi le turn transition una alla volta
