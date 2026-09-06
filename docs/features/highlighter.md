---
type: feature
id: F04
status: verified
depends: ["[[pen]]"]
decisions: ["[[D0006-hold-still-snap]]"]
updated: 2026-09-06
---
# Highlighter

## Purpose
Wide translucent ink for marking lines of text. Text shows through, and a stroke never darkens where it crosses itself.

## Behaviour
1. Same input, anchoring, undo and save as [[pen]]. Only the differences are listed here.
2. Width is the slider's value, 8 to 40 px, default 20, and ignores pressure. See [[toolbar]] rule 10.
3. Opacity is 0.35, applied to the whole stroke as one path, so self-crossings do not darken.
4. Two different highlighter strokes that overlap do stack darker. Matches paper.
5. Colours are the four highlighter colours in [[toolbar]]. The highlighter colour is remembered separately from the pen colour.
6. Caps are square, so a snapped line is a clean bar.
7. Straight-line snap arms when the Pencil has travelled at least 20 px and then stays within 6 px for 500 ms.
8. Snap applies only if the stroke's bounding box is at least 5 times wider than tall, or 5 times taller than wide.
9. When snap arms, the live stroke redraws as a straight line from first point to current point. Lifting confirms it; moving more than 6 px cancels it and freehand resumes.
10. A snapped stroke stores `straight: true` and only its first and last points.

## Edge cases
| Situation | Expected |
|---|---|
| Hold still at the end of a loop | No snap. Rule 8 fails. The loop is kept. |
| Hold still before moving 20 px | No snap. |
| Pencil lifts 100 ms into the hold | Freehand kept. |
| Highlighter on a dark page | Barely visible. Accepted. There is no multiply blend, and the user picks a lighter colour. |
| Snapped line drawn diagonally | Kept diagonal. There is no axis lock. |
| Snap arms, then the finger scrolls the page | Current point is in document coordinates; the preview line follows the content. |

## Acceptance
- [x] Highlight a line, pause half a second, lift: a perfectly straight bar.
- [x] Draw a highlighter loop that crosses itself: no darker patch at the crossing.
- [x] Switch to Pen and back: the highlighter colour is the one last used for Highlighter.
