---
type: feature
id: F14
status: verified
depends: ["[[pen]]", "[[eraser]]", "[[undo-redo]]"]
decisions: ["[[D0007-pencil-double-tap]]"]
updated: 2026-09-06
---
# Scribble to erase

## Purpose
A fast zig-zag over existing strokes with the Pen removes them, the Apple Notes gesture. It replaces the Pencil double-tap Safari cannot provide, so erasing never needs the toolbar.

## Behaviour
1. Applies to the Pen only. Detection runs live during the stroke.
2. A swing is the travel along one axis between two changes of direction, counted after at least 8 px in the new direction. A full swing covers at least 60 percent of the stroke's extent on that axis.
3. A scribble is detected when the stroke has at least 5 full swings on one axis and its path length is at least 2.5 times the bounding box width plus height. Handwriting has swings, but a letter's swings are short against the word's width, so writing does not qualify.
4. Once detected, a visible stroke is marked when it is within eraser reach ([[eraser]] rule 2) of a scribble point and the scribble's box, padded by that reach, covers at least 40 percent of the stroke's box. Marked strokes render at 0.3 opacity as a preview.
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
| Writing a word fast, with m and w in it | Swings are short against the word. Kept as ink. |
| Writing a new word across an old underline | The underline is far wider than the word's box. Not marked, not erased. |
| Scribble over a hidden stroke | Hidden strokes are out of reach. Unaffected. |
| Scribble reaches the toolbar | Toolbar events are never captured; the scribble ends at the toolbar edge. |
| Undo after a scribble erase | All marked strokes return in one step. |

## Acceptance
- [x] Zig-zag over a circle: it dims while scribbling and is gone on lift.
- [x] Zig-zag on a blank area: the zig-zag stays as ink.
- [x] Undo once: the erased circle returns.
