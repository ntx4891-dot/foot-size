# Privacy policy

**Foot Size** browser extension. Last updated 3 September 2026.

## What it collects

Nothing.

## What it stores

One number: the foot length in centimetres that you type in yourself. It is kept
in your own browser through `chrome.storage.local`, on your machine. It is used
to work out your size and nothing else. Clearing the extension's data or
uninstalling it removes it.

It also keeps the last text you right-clicked on, so the popup can show you the
same answer the notification just gave. That is overwritten the next time you use
it and never leaves your browser either.

## What it sends

Nothing, to anyone. There is no server, no analytics, no error reporting and no
network code in the extension at all. You can check that yourself: the whole
thing is about two hundred lines and the source is at
https://github.com/ntx4891-dot/foot-size

## What it can see

Only text you deliberately select and right-click on.

The extension requests no host permissions, so it cannot read the pages you
visit, cannot change them, and does not learn their addresses. A context menu
registered for selected text receives that text and nothing else.

## Permissions

- `storage`: remembers your foot length so you do not retype it
- `contextMenus`: adds the one right-click item
- `notifications`: shows the answer after a right-click

## Children

The extension collects no data from anyone, including children.

## Changes

Any change to this policy will be committed to the repository above, so the full
history of it is public.

## Contact

Open an issue: https://github.com/ntx4891-dot/foot-size/issues
