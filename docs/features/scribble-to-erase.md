---
type: feature
id: F14
status: built
depends: ["[[pen]]", "[[eraser]]", "[[undo-redo]]"]
decisions: ["[[D0007-pencil-double-tap]]"]
updated: 2026-09-05
---
# Scribble to erase

## Purpose
A fast zig-zag over existing strokes with the Pen removes them, the Apple Notes gesture. It replaces the Pencil double-tap Safari cannot provide, so erasing never needs the toolbar.

## Behaviour
1. Applies to the Pen only. Detection runs live during the stroke.
2. A reversal is a change of direction along either axis after at least 8 px of travel in the previous direction.
3. A scribble is detected when the stroke has at least 4 reversals on one axis and its path length is at least 2.5 times the bounding box width plus height.
4. Once detected, every visible stroke within eraser reach ([[eraser]] rule 2) of any point of the scribble is marked. Marked strokes render at 0.3 opacity as a preview.
5. On Pencil-up, marked strokes are removed as one undo entry and the scribble itself is discarded.
6. If nothing is marked on Pencil-up, the scribble is kept as an ordinary Pen stroke. A zig-zag over empty space is a doodle.
7. Until rule 3 is met the stroke draws as normal ink.
8. Scribble does not apply to Highlighter, Trail or Spotlight.

## Edge cases
| Situation | Expected |
|---|---|
| Hatching drawn on purpose over existing ink | Reads as a scribble and erases what it crosses. Accepted; hatch with the Highlighter instead. |
| Hatching over empty space | Kept as ink, per rule 6. |
| Wavy underline with a few gentle bends | Fails the path-length rule. Kept as ink. |
| Scribble over a hidden stroke | Hidden strokes are out of reach. Unaffected. |
| Scribble reaches the toolbar | Toolbar events are never captured; the scribble ends at the toolbar edge. |
| Undo after a scribble erase | All marked strokes return in one step. |

## Acceptance
- [ ] Zig-zag over a circle: it dims while scribbling and is gone on lift.
- [ ] Zig-zag on a blank area: the zig-zag stays as ink.
- [ ] Undo once: the erased circle returns.
