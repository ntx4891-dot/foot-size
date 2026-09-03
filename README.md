# foot-size

Convert a measured foot length to a European shoe size, and make sense of the size
strings that real catalogues actually contain.

Zero dependencies. One file. Works in a browser and in Node.

```js
import { euFromFootCm, normaliseEu, inSize, sizeHistogram } from 'foot-size';

euFromFootCm(26.5);        // 42
euFromFootCm(20);          // null, that is outside the table
normaliseEu('42  1/3');    // 42
inSize(inventory, 46);     // every item that really exists in a 46
sizeHistogram(inventory);  // Map { 40 => 149, 41 => 148, ... 46 => 11 }
```

## Why this exists

Two problems, and the second one is the interesting one.

**Published conversion charts disagree with each other.** Look up EU 42 in three
places and you get three different UK sizes, because the brands themselves
disagree: a 42 from one maker and a 42 from another are not the same shoe, and
the spread runs to a full size. The one input that does not move is the length of
the foot standing on the floor. So this library converts from centimetres, and
refuses to guess a UK or US equivalent. That refusal is the feature. A function
here that returned `US 9` would be inventing precision it does not have, and
somebody would order on it.

**Real catalogue data is messy in a way that quietly breaks size filters.** One
inventory of 149 pairs produced all six of these strings, for the same three
shelves:

```
42        plain
42.5      decimal half
42½       typographic half
42⅓       typographic third, which European sizing genuinely uses
42⅔       and two thirds
42  1/3   ascii third, with a double space, straight out of a supplier's own listing title
```

A shopper asking for a 42 wants every one of them. Treat them as six distinct
sizes and your filter returns almost nothing, silently, and looks like it is
working. `normaliseEu` folds all six to `42`.

## Install

```
npm install foot-size
```

Or copy `src/index.js`. It is about a hundred lines and has no dependencies.

## API

### `euFromFootCm(cm, { tolerance = 0.6 })`

The EU size for a measured foot, or `null` when the measurement falls outside the
table. It rounds to the nearest row within `tolerance` centimetres.

Returning `null` rather than clamping is deliberate. A 20 cm foot is a child's and
a 34 cm foot is past almost every adult range, and answering `36` or `46` to
either is a confident wrong answer to somebody about to buy a shoe they may not be
able to return.

### `footCmFromEu(eu)`

The inverse, for showing a reader what a size actually assumes about their foot.

### `normaliseEu(value)`

The whole EU size a catalogue string belongs to, or `null`. Handles the six
notations above. Rejects things that are not adult EU sizes, including a bare
`"9"` (a UK size wearing a familiar shape) and `"110cm"` (a belt length that
arrived in the same feed).

### `wholeSizes(sizes)`

A mixed size list collapsed to ascending, deduplicated whole sizes.

### `inSize(items, eu, getSizes?)`

Filter an inventory to the items that exist in a size. `getSizes` defaults to
`item.sizes`, so it works on most shapes without configuration and on the rest
with one argument.

### `sizeHistogram(items, getSizes?)`

How many items exist in each size, ascending, ready to render into a table.

This is the number worth publishing and almost nobody does. On the inventory this
library was written against, the middle sizes existed in every single pair and the
largest size existed in seven per cent of them. A shopper with big feet otherwise
discovers that one product page at a time.

## The table

Foot length in centimetres to EU size, from the standard Mondopoint relation: the
last is roughly 1.5 cm longer than the foot, and an EU size is that last length
measured in Paris points of two thirds of a centimetre each.

| Foot | EU | Foot | EU | Foot | EU |
|-----:|---:|-----:|---:|-----:|---:|
| 22.5 | 36 | 25.0 | 39.5 | 27.5 | 43 |
| 23.0 | 37 | 25.5 | 40 | 28.0 | 44 |
| 23.5 | 37.5 | 26.0 | 41 | 28.5 | 45 |
| 24.0 | 38 | 26.5 | 42 | 29.0 | 45.5 |
| 24.5 | 39 | 27.0 | 42.5 | 29.5 | 46 |

It is written out rather than computed so a person can read it, check it and
correct it. If you have measured evidence that a row is wrong, a pull request with
the measurement is very welcome.

## Measuring a foot properly

The library is only as good as the number you hand it.

1. Stand barefoot on a sheet of paper with your heel against a wall.
2. Mark the tip of your longest toe, which is not always the big one.
3. Measure from the wall to the mark in centimetres, and do both feet.
4. Take the larger figure, and measure in the evening when the foot is widest.

## Demo

`demo/index.html` is a single static file with no build step. Open it directly, or
serve the folder, and it will convert a measurement and filter a small sample
inventory.

## Licence

MIT.
