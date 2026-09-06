---
type: feature
id: F13
status: built
depends: ["[[pen]]", "[[highlighter]]"]
decisions: ["[[D0006-hold-still-snap]]"]
updated: 2026-09-05
---
# Shape snap

## Purpose
Circling things is the main use. Holding still at the end of a Pen stroke turns a rough loop into a clean ellipse or rectangle, and a near-straight stroke into a straight line. It is the same hold gesture as the highlighter. Freehand stays the default.

## Behaviour
1. Applies to the Pen only. The hold gesture and thresholds are those of [[highlighter]] rules 7 and 9: at least 20 px travelled, then within 6 px for 500 ms.
2. When the hold arms, the stroke is classified as line, ellipse, rectangle or none.
3. Line: the bounding box is at least 5 times longer than wide, and every point lies within 8 percent of the long side from the line between the first and last points.
4. Closed: the distance from first to last point is at most 20 percent of the bounding box perimeter. Ellipse and rectangle require closed.
5. Ellipse: the mean of `|((x-cx)/a)² + ((y-cy)/b)² - 1|` over all points is at most 0.25, with a and b half the box width and height.
6. Rectangle: the mean distance from each point to the nearest box edge is at most 5 percent of the shorter side, and at least 70 percent of points lie within that distance of an edge. A circle fails the second test, which keeps circles from reading as squares.
7. When both ellipse and rectangle qualify, the lower normalised error wins.
8. None: the stroke stays freehand and nothing is shown.
9. The preview replaces the live stroke the moment the hold arms. Lifting confirms; moving more than 6 px cancels and freehand resumes.
10. A snapped stroke is stored as ordinary points sampled along the shape: 64 for an ellipse, 5 for a rectangle, 2 for a line, all at the stroke's mean pressure, with `shape` set to the kind.
11. Width and colour are unchanged by snapping.

## Edge cases
| Situation | Expected |
|---|---|
| Slow, deliberate drawing that pauses mid-stroke | The hold arms and a preview may appear. Moving again cancels it. |
| Loop smaller than 20 px of travel | No snap, per rule 1. |
| Spiral | Not closed. Freehand. |
| Loop that overshoots and crosses itself | Closed by rule 4 if the ends are near. Ellipse if round enough. |
| Carefully drawn rounded rectangle | Rectangle usually wins. Either result is acceptable. |
| Snapped ellipse over text, then the column narrows | Anchored like any stroke. It scales horizontally with its element. |
| Stroke of 3 points | Below the travel threshold in practice. Freehand. |

## Acceptance
- [ ] Circle a word roughly, pause, lift: a clean ellipse around the word.
- [ ] Box a paragraph, pause, lift: a clean rectangle.
- [ ] Underline, pause, lift: a straight line.
- [ ] Circle a word and lift without pausing: freehand, untouched.
