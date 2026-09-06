---
type: feature
id: F08
status: built
depends: ["[[undo-redo]]", "[[persistence]]"]
decisions: []
updated: 2026-09-05
---
# Clear

## Purpose
Ending a reading session. Wipes all ink on the page in one tap.

## Behaviour
1. Clear removes every stroke for the current page key and saves the empty ink immediately.
2. There is no confirmation dialog. Clear is one undo entry.
3. After Clear the page stays in its current mode.
4. Clear affects only the current page key.
5. When ink is already empty the button is disabled.

## Edge cases
| Situation | Expected |
|---|---|
| Clear, close the tab, reopen the page | Opens in Off with no ink. |
| Clear, undo, close the tab, reopen | Ink is back. Undo wrote through to storage. |
| Finger taps Clear while a Pencil stroke is in progress | The stroke in progress ends and is discarded. Then Clear runs. |

## Acceptance
- [ ] One tap empties the page and the button greys out.
- [ ] Undo brings everything back.
