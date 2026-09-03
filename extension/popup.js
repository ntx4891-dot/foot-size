/**
 * The popup: set a foot length once, then ask whether that size is in any list.
 *
 * The stored value is the foot length in centimetres, never the EU size. Sizes
 * are a derived, brand-dependent thing; the measurement is not. If the table is
 * ever corrected, everyone's answer improves without anyone re-entering
 * anything.
 */
import { euFromFootCm, parseSizeList } from './lib/foot-size.js';

const cm = document.getElementById('cm');
const mine = document.getElementById('mine');
const list = document.getElementById('list');
const verdict = document.getElementById('verdict');

let myEu = null;

function showMine(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) {
    myEu = null;
    mine.textContent = 'Enter it once. It is remembered.';
    return;
  }
  myEu = euFromFootCm(n);
  mine.innerHTML =
    myEu === null
      ? 'That is outside the table, so there is no honest answer for it.'
      : `Your size: <b>EU ${myEu}</b>`;
}

/**
 * The whole point of the extension. `parseSizeList` folds "42", "42.5", "42½",
 * "42⅓", "42⅔" and "42  1/3" to the same 42, which is what makes a real shop's
 * size row answerable instead of a wall of near-identical strings.
 */
function judge() {
  const text = list.value.trim();
  verdict.className = 'verdict';
  if (!text) {
    verdict.textContent = 'Waiting for a list.';
    return;
  }
  // Split on anything that is not part of a size. The double space in
  // "42  1/3" survives because the fraction is glued back on by normaliseEu.
  const found = parseSizeList(text);
  if (!found.length) {
    verdict.textContent = 'No European sizes found in that text.';
    return;
  }
  const foundLine = `<span class="found">Found in the list: ${found.join(', ')}</span>`;
  if (myEu === null) {
    verdict.innerHTML = `Enter your foot length above to compare.${foundLine}`;
    return;
  }
  const hit = found.includes(Math.trunc(myEu));
  verdict.className = `verdict ${hit ? 'yes' : 'no'}`;
  verdict.innerHTML = hit
    ? `Yes — EU ${myEu} is in this list.${foundLine}`
    : `No — EU ${myEu} is not in this list.${foundLine}`;
}

chrome.storage.local.get(['footCm'], ({ footCm }) => {
  if (footCm != null) cm.value = footCm;
  showMine(cm.value);
  judge();
});

cm.addEventListener('input', () => {
  showMine(cm.value);
  judge();
  const n = parseFloat(cm.value);
  chrome.storage.local.set({ footCm: Number.isFinite(n) ? n : null });
});

list.addEventListener('input', judge);

// A size list copied from a shop arrives through the context menu too. Showing
// it here as well means the popup always reflects the last thing asked about.
chrome.storage.local.get(['lastSelection'], ({ lastSelection }) => {
  if (lastSelection && !list.value) {
    list.value = lastSelection;
    judge();
  }
});
