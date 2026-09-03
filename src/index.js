/**
 * foot-size - convert a measured foot length to a European shoe size, and make
 * sense of the size strings real catalogues actually contain.
 *
 * Zero dependencies, ES module, works in a browser and in Node.
 *
 * The extension is .js rather than .mjs on purpose: package.json declares
 * "type": "module", so Node reads it as an ES module either way, while plenty
 * of static file servers still hand .mjs to the browser as
 * application/octet-stream - and browsers then refuse to run it, strictly, with
 * an error that looks like a bug in this library rather than in the host. The
 * demo hit exactly that.
 *
 * WHY FOOT LENGTH AND NOT A BRAND CHART
 * -------------------------------------
 * Published EU-to-US conversion tables disagree with each other by up to a full
 * size, because the brands themselves disagree: a 42 from one maker and a 42
 * from another are not the same shoe. Foot length is the one input that does
 * not move. So this library converts from centimetres and deliberately refuses
 * to guess a US or UK equivalent - see the README for why that refusal is the
 * point rather than a missing feature.
 */

/**
 * Foot length in centimetres to EU size.
 *
 * The standard Mondopoint relation: last length is foot length plus roughly
 * 1.5 cm of ease, and an EU size is that last length measured in Paris points
 * of two thirds of a centimetre each. The table is written out rather than
 * computed so that it can be read, checked and corrected by a person.
 */
export const FOOT_EU = Object.freeze([
  [22.5, 36],
  [23.0, 37],
  [23.5, 37.5],
  [24.0, 38],
  [24.5, 39],
  [25.0, 39.5],
  [25.5, 40],
  [26.0, 41],
  [26.5, 42],
  [27.0, 42.5],
  [27.5, 43],
  [28.0, 44],
  [28.5, 45],
  [29.0, 45.5],
  [29.5, 46],
]);

/** Half a Paris point. Beyond this the nearest row is not a fair answer. */
const DEFAULT_TOLERANCE = 0.6;

/**
 * The EU size for a measured foot, or null when the measurement falls outside
 * the table.
 *
 * Returning null rather than clamping is deliberate: a 20 cm foot is a child's
 * and a 34 cm foot is outside almost every adult range, and answering "36" or
 * "46" to either would be a confident wrong answer to someone about to spend
 * money on a shoe they cannot return.
 *
 * @param {number} cm         foot length in centimetres
 * @param {object} [opts]
 * @param {number} [opts.tolerance=0.6]  how far from a table row still counts
 * @returns {number|null}     EU size, possibly a half size
 */
export function euFromFootCm(cm, { tolerance = DEFAULT_TOLERANCE } = {}) {
  const n = Number(cm);
  if (!Number.isFinite(n)) return null;
  let best = null;
  let gap = Infinity;
  for (const [len, eu] of FOOT_EU) {
    const d = Math.abs(len - n);
    if (d < gap) {
      gap = d;
      best = eu;
    }
  }
  return gap <= tolerance ? best : null;
}

/**
 * The foot length an EU size is cut for, or null if the size is off the table.
 * The inverse of euFromFootCm, for showing a reader what a size assumes.
 */
export function footCmFromEu(eu) {
  const n = Number(eu);
  if (!Number.isFinite(n)) return null;
  for (const [len, size] of FOOT_EU) if (size === n) return len;
  return null;
}

/**
 * The whole EU size a catalogue's size string belongs to, or null.
 *
 * REAL CATALOGUES ARE MESSY AND THIS IS THE USEFUL PART OF THIS LIBRARY.
 * One inventory of 149 pairs produced all of these for the same three shelves:
 *
 *     "42"        plain
 *     "42.5"      decimal half
 *     "42½"       typographic half
 *     "42⅓"       typographic third, which EU sizing really does use
 *     "42⅔"       and two thirds
 *     "42  1/3"   ascii third, with a DOUBLE space, straight from a supplier's
 *                 own album title
 *
 * A shopper asking for a 42 wants every one of them. Treating them as six
 * distinct sizes is how a size filter silently returns almost nothing.
 *
 * @param {string|number} value
 * @returns {number|null} the whole EU number, e.g. 42 for all of the above
 */
export function normaliseEu(value) {
  const m = String(value)
    .trim()
    .match(/^(\d{2})/);
  if (!m) return null;
  const n = Number(m[1]);
  // 30 to 52 covers every adult EU shoe scale with room at both ends; anything
  // outside it is a different measurement wearing a familiar shape.
  return n >= 30 && n <= 52 ? n : null;
}

/**
 * Every distinct whole EU size present in a list of size strings.
 * @param {Array<string|number>} sizes
 * @returns {number[]} ascending, deduplicated
 */
export function wholeSizes(sizes) {
  return [...new Set((sizes ?? []).map(normaliseEu).filter((n) => n !== null))].sort((a, b) => a - b);
}

/**
 * Filter an inventory down to the items that exist in a given EU size.
 *
 * Deliberately generic: it knows nothing about your item shape beyond how to
 * reach its size list, which is the only reason this is a library rather than
 * one site's private function.
 *
 * @param {Array<T>} items
 * @param {number} eu                       whole EU size to match
 * @param {(item: T) => Array<string|number>} [getSizes]  defaults to item.sizes
 * @returns {Array<T>}
 * @template T
 */
export function inSize(items, eu, getSizes = (i) => i.sizes) {
  const want = normaliseEu(eu);
  if (want === null) return [];
  return (items ?? []).filter((i) => wholeSizes(getSizes(i)).includes(want));
}

/**
 * How many items exist in each size, for showing a reader where an inventory is
 * actually deep and where it is one pair.
 *
 * This is the number worth publishing. On the inventory this library was
 * written against, the middle sizes existed in every single pair and the
 * largest size existed in seven per cent of them - a difference a shopper
 * otherwise discovers one product page at a time.
 *
 * @returns {Map<number, number>} EU size to count, ascending
 */
export function sizeHistogram(items, getSizes = (i) => i.sizes) {
  const counts = new Map();
  for (const item of items ?? []) {
    for (const s of wholeSizes(getSizes(item))) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return new Map([...counts.entries()].sort((a, b) => a[0] - b[0]));
}
