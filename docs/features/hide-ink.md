---
type: feature
id: F15
status: verified
depends: ["[[toolbar]]", "[[persistence]]"]
decisions: []
updated: 2026-09-06
---
# Hide ink

## Purpose
A toolbar toggle that hides all ink on the page without clearing it, for rereading clean, then shows it again.

## Behaviour
1. Hide is a toolbar button. It toggles hidden on and off.
2. While hidden the ink canvas draws nothing, in every frame. Strokes stay in memory and in storage.
3. Hidden is per tab session. A reload shows ink again.
4. Drawing a new stroke while hidden turns hidden off first, so the new stroke and the old ink appear together.
5. The Eraser and scribble to erase find no strokes while hidden.
6. Undo, Redo and Clear work while hidden. Their results show when ink is shown again.
7. The button shows its state: a crossed-out eye while hidden.
8. Trail and Spotlight are unaffected.

## Edge cases
| Situation | Expected |
|---|---|
| Hide, then Clear, then show | Nothing to show. Undo restores the ink. |
| Hide, close the tab, reopen | Ink shows. Hidden is not stored. |
| Hide, then Unlock and browse | Ink stays hidden. The next stroke after Lock shows it, per rule 4. |
| Hide on a page with no ink | The button is disabled. |

## Acceptance
- [x] Tap Hide: ink disappears and the page stays interactive. Tap again: ink returns.
- [x] Hide, then draw: everything appears.
