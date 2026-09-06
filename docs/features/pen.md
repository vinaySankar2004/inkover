---
type: feature
id: F03
status: built
depends: ["[[pencil-input]]", "[[anchoring]]", "[[undo-redo]]", "[[persistence]]", "[[shape-snap]]", "[[scribble-to-erase]]"]
decisions: []
updated: 2026-09-05
---
# Pen

## Purpose
The default tool. Freehand ink for circling, underlining, arrows and doodles.

## Behaviour
1. A stroke is a continuous path from Pencil-down to Pencil-up, drawn live as it happens.
2. Width is the size base scaled by pressure: `base × (0.55 + 1.0 × pressure)`. A hard press is about three times a light one, and the lightest touch still leaves a visible line.
3. The base is the width slider's value, 1 to 12 CSS pixels, default 3. See [[toolbar]] rule 10.
4. Raw points are stored. Smoothing happens at render only. See architecture, Coordinates and rendering.
5. Opacity is 1. Colour is one of the six pen colours in [[toolbar]].
6. Caps and joins are round.
7. On Pencil-up the stroke is anchored, pushed to the undo stack and scheduled for save.
8. Holding still before lifting may snap the stroke to a line, ellipse or rectangle. See [[shape-snap]].
9. A fast zig-zag over existing ink erases it instead of drawing. See [[scribble-to-erase]].
10. A stroke is capped at 5,000 points. The stroke ends there and further movement is ignored until Pencil-up.

## Edge cases
| Situation | Expected |
|---|---|
| Finger scrolls while a Pencil stroke is in progress | Points convert to document coordinates on arrival, so the stroke follows the content, not the glass. |
| Stroke crosses two elements | Anchored to the element under the first point. Later points drift if only the second element reflows. Accepted. |
| Content shifts under the Pencil during page load | The stroke is anchored on Pencil-up to wherever its first point landed. |
| Finger taps a colour on the toolbar mid-stroke | The colour applies to the next stroke. The current stroke keeps its colour. |
| Two Pencils, or a second pen pointer | Only the first active pointer id is tracked until it lifts. |
| First point scrolled off screen before Pencil-up | The anchor was chosen at Pencil-down, so the stroke still attaches to the element it started on. |

## Acceptance
- [ ] Circle a paragraph, scroll away and back: the circle is exactly where it was.
- [ ] Size S at light pressure is still visible on a white page.
- [ ] A tap leaves a visible dot.
