---
type: feature
id: F08
status: verified
depends: ["[[undo-redo]]", "[[persistence]]"]
decisions: []
updated: 2026-09-07
---
# Clear

## Purpose
Ending a reading session. Wipes all ink on the page in one tap.

## Behaviour
1. Clear removes every stroke on the page, in the top frame and in every frame, and removes each stored record at once. See [[frames]] rule 7 and [[persistence]] rule 7.
2. There is no confirmation dialog. Clear is one undo entry.
3. After Clear the page stays in its current mode.
4. Clear affects only the current page and its frames. Other pages keep their ink.
5. When ink is already empty the button is disabled.

## Edge cases
| Situation | Expected |
|---|---|
| Clear, close the tab, reopen the page | Opens in Off with no ink. |
| Clear, undo, close the tab, reopen | Ink is back. Undo wrote through to storage. |
| Finger taps Clear while a Pencil stroke is in progress | The stroke in progress ends and is discarded. Then Clear runs. |

## Acceptance
- [x] One tap empties the page and the button greys out.
- [x] Undo brings everything back.
