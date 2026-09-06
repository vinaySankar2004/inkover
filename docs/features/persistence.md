---
type: feature
id: F09
status: verified
depends: []
decisions: ["[[D0003-persist-per-url]]", "[[D0010-page-key]]"]
updated: 2026-09-06
---
# Persistence

## Purpose
Ink survives reload, tab close and Safari restart until the user clears it. Nothing ever leaves the device.

## Behaviour
1. Ink is stored in extension local storage under the page key. See architecture, Storage. A frame has its own key, per [[frames]] rule 3.
2. A save is scheduled 500 ms after any change and flushed immediately on pagehide.
3. On load, ink for the page key is read before the overlay first draws, so there is no flash of missing ink.
4. A page holds at most 2,000 strokes. When full, new strokes are refused and a notice says "Page is full. Clear to continue."
5. Stored ink carries a version. An unknown version shows a notice, treats the page as empty, and leaves the stored data untouched.
6. Same-document navigation changes the page key only when the path or query changes. Then the old key is saved and the new key is loaded.

## Edge cases
| Situation | Expected |
|---|---|
| Same page open in two tabs | Each tab loads on open. Later saves overwrite whole. No merge. Accepted for one user. |
| Safari evicts extension storage | Ink is gone. There is no backup. Accepted; see non-goals. |
| Tracking query parameters differ per visit | Different page key, different ink. Accepted in [[D0010-page-key]]. |
| Storage write fails | Notice once per page. Ink stays in memory for the session. |
| Private browsing | Safari may give the extension no storage. Ink may not persist. Accepted. |
| Hash changes because the site uses it for tabs | Same page key. Anchoring handles the tab switch. |

## Acceptance
- [x] Draw, reload: ink is present before the page finishes loading.
- [x] Draw, force-quit Safari, reopen: ink is present.
- [x] Clear one page: another page's ink is untouched.
