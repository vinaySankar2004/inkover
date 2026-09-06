---
type: feature
id: F17
status: verified
depends: ["[[toolbar]]", "[[persistence]]"]
decisions: []
updated: 2026-09-06
---
# Preferences

## Purpose
A small panel on the toolbar for the few things a person wants to set once: whether buttons carry labels, whether they are compact, and a way back to the default colours and widths. It lives on the toolbar, not in the wrapper app, because the app and the extension cannot share settings without native plumbing, and the toolbar is where you are when you want to change them.

## Behaviour
1. The last toolbar button, More, opens and closes the panel. It opens above the pill on the top and bottom edges and beside it on the left and right edges.
2. Labels: on by default. Off hides the word under every button; the buttons keep their size.
3. Compact buttons: off by default. On makes every button 44 pt and hides the labels.
4. Reset colours and widths: restores the default pen and highlighter colours, the default widths and band height, and forgets both custom colours. It does not touch ink.
5. Every preference is saved with the other settings and applies on every page.
6. Collapsing the toolbar closes the panel.

## Edge cases
| Situation | Expected |
|---|---|
| Panel open, then the toolbar is dragged to another edge | The panel re-anchors to the new edge on the next open. |
| Compact on and Labels on | Compact wins; labels are hidden. Turning Compact off brings them back. |
| Reset while Highlighter is active with a custom colour | The highlighter returns to yellow, the pen to black, and both custom swatches show the rainbow again. |

## Acceptance
- [x] Tap More, turn Labels off: words vanish, buttons stay the same size.
- [x] Turn Compact on: buttons shrink to 44 pt.
- [x] Reset after choosing a custom colour and a wide pen: black, default width, rainbow swatch.
