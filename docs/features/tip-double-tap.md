---
type: feature
id: F16
status: verified
depends: ["[[pencil-input]]", "[[eraser]]"]
decisions: ["[[D0007-pencil-double-tap]]"]
updated: 2026-09-06
---
# Tip double-tap

## Purpose
Two quick taps of the Pencil tip on the page switch to the Eraser; two more switch back to the tool you had. It stands in for the Pencil's barrel double-tap, which Safari never delivers to a web page.

## Behaviour
1. A tap is a Pencil contact shorter than 250 ms that moves less than 6 px. A double-tap is two taps less than 350 ms apart and less than 30 px apart.
2. A double-tap with Pen, Highlighter or Eraser active toggles between the Eraser and the previous tool. Neither tap leaves ink: the first tap's dot is removed and the second is never drawn.
3. The previous tool is whatever was active when the Eraser was chosen, by double-tap or on the toolbar. Choosing the Eraser on the toolbar records it the same way.
4. The toolbar shows the new tool and a notice names it, so the switch is visible even with the toolbar collapsed.
5. Trail and Spotlight ignore double-taps.
6. A single tap behaves as before: a dot with the Pen or Highlighter, a spot erase with the Eraser.

## Edge cases
| Situation | Expected |
|---|---|
| Dotting an i twice in the same place, fast | Reads as a double-tap. The dots vanish and the tool switches. Tap once more to switch back; the third tap is a single tap. |
| Two taps far apart | Two dots. Nothing switches. |
| Tap, pause half a second, tap | Two dots. |
| Double-tap on empty space with the Eraser | Switches back to the previous tool. |
| Previous tool was the Eraser itself, or none recorded | Switches to the Pen. |

## Acceptance
- [x] Draw with the Pen, double-tap the page: the Eraser is active and no dots remain.
- [x] Double-tap again: the Pen is back.
- [x] Tap the Eraser on the toolbar while on Highlighter, then double-tap: Highlighter returns.
