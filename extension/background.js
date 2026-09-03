/**
 * The context-menu path: select the sizes on any shop, right-click, get an
 * answer in a notification.
 *
 * ⚠ THIS IS WHY THE EXTENSION ASKS FOR NO HOST PERMISSIONS. A context menu
 * registered for the "selection" context receives `info.selectionText` on its
 * own, so nothing here reads, injects into, or even knows the URL of the page
 * the user is on. An extension that scraped the page for sizes would be more
 * automatic and would need permission to read every site the user visits, which
 * is a bad trade for a size converter and a slow Chrome Web Store review.
 */
import { euFromFootCm, parseSizeList } from './lib/foot-size.js';

const MENU_ID = 'foot-size-check';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Is my size in this list?',
    contexts: ['selection'],
  });
});

const notify = (title, message) =>
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/128.png',
    title,
    message,
  });

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return;
  const text = (info.selectionText ?? '').trim();

  // Kept so the popup shows the same thing the notification just answered.
  chrome.storage.local.set({ lastSelection: text });

  const { footCm } = await chrome.storage.local.get(['footCm']);
  const eu = footCm == null ? null : euFromFootCm(footCm);
  if (eu === null) {
    notify('Foot Size', 'Open the extension and enter your foot length first.');
    return;
  }

  const found = parseSizeList(text);
  if (!found.length) {
    notify('Foot Size', 'No European sizes found in that selection.');
    return;
  }

  const hit = found.includes(Math.trunc(eu));
  notify(
    hit ? `Yes — EU ${eu} is available` : `No — EU ${eu} is not in this list`,
    `Sizes found: ${found.join(', ')}`
  );
});
