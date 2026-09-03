import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FOOT_EU,
  euFromFootCm,
  footCmFromEu,
  normaliseEu,
  wholeSizes,
  inSize,
  sizeHistogram,
} from '../src/index.js';

test('converts a measured foot to an EU size', () => {
  assert.equal(euFromFootCm(23.0), 37);
  assert.equal(euFromFootCm(26.5), 42);
  assert.equal(euFromFootCm(29.5), 46);
});

test('rounds to the nearest row inside the tolerance', () => {
  assert.equal(euFromFootCm(26.4), 42);
  assert.equal(euFromFootCm(26.7), 42);
});

test('returns null outside the table rather than clamping', () => {
  // A confident wrong answer here costs somebody a shoe they cannot return.
  assert.equal(euFromFootCm(20), null);
  assert.equal(euFromFootCm(34), null);
  assert.equal(euFromFootCm('not a number'), null);
  assert.equal(euFromFootCm(undefined), null);
});

test('the tolerance is adjustable and actually bites', () => {
  assert.equal(euFromFootCm(22.0), 36); // 0.5 away, inside the default
  assert.equal(euFromFootCm(22.0, { tolerance: 0.2 }), null);
});

test('inverts back to the length a size is cut for', () => {
  assert.equal(footCmFromEu(42), 26.5);
  assert.equal(footCmFromEu(37.5), 23.5);
  assert.equal(footCmFromEu(99), null);
});

test('every table row round-trips', () => {
  for (const [cm, eu] of FOOT_EU) {
    assert.equal(euFromFootCm(cm), eu, `${cm} cm should be EU ${eu}`);
    assert.equal(footCmFromEu(eu), cm, `EU ${eu} should be ${cm} cm`);
  }
});

test('normalises every size notation a real catalogue produced', () => {
  // All six of these appeared in one inventory of 149 pairs, for the same shelf.
  for (const s of ['42', '42.5', '42½', '42⅓', '42⅔', '42  1/3']) {
    assert.equal(normaliseEu(s), 42, `${JSON.stringify(s)} should normalise to 42`);
  }
  assert.equal(normaliseEu(42), 42);
  assert.equal(normaliseEu(' 40 '), 40);
});

test('rejects things that are not adult EU sizes', () => {
  assert.equal(normaliseEu('M'), null);
  assert.equal(normaliseEu(''), null);
  assert.equal(normaliseEu('9'), null); // a UK size wearing a familiar shape
  assert.equal(normaliseEu('110cm'), null); // a belt length from the same feed
  assert.equal(normaliseEu(null), null);
});

test('collapses a mixed size list to whole sizes', () => {
  assert.deepEqual(wholeSizes(['40', '40⅔', '41', '41⅓', '42']), [40, 41, 42]);
  assert.deepEqual(wholeSizes([]), []);
  assert.deepEqual(wholeSizes(undefined), []);
});

const stock = [
  { id: 'a', sizes: ['40', '41', '42'] },
  { id: 'b', sizes: ['42⅔', '43', '44'] },
  { id: 'c', sizes: ['45', '46'] },
];

test('filters an inventory by size', () => {
  assert.deepEqual(inSize(stock, 42).map((i) => i.id), ['a', 'b']);
  assert.deepEqual(inSize(stock, 46).map((i) => i.id), ['c']);
  assert.deepEqual(inSize(stock, 39), []);
  assert.deepEqual(inSize(stock, 'nonsense'), []);
});

test('reads sizes from wherever the caller keeps them', () => {
  const odd = [{ id: 'x', available: ['44'] }];
  assert.deepEqual(inSize(odd, 44, (i) => i.available).map((i) => i.id), ['x']);
});

test('counts how deep each size really is', () => {
  const h = sizeHistogram(stock);
  assert.equal(h.get(42), 2);
  assert.equal(h.get(46), 1);
  assert.equal(h.get(39), undefined);
  // ascending, so it can be rendered straight into a table
  assert.deepEqual([...h.keys()], [40, 41, 42, 43, 44, 45, 46]);
});

test('survives an empty or absent inventory', () => {
  assert.deepEqual(inSize([], 42), []);
  assert.deepEqual(inSize(undefined, 42), []);
  assert.equal(sizeHistogram(undefined).size, 0);
});
