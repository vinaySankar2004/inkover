---
type: feature
id: F05
status: verified
depends: ["[[pen]]", "[[highlighter]]", "[[undo-redo]]"]
decisions: ["[[D0004-stroke-eraser]]"]
updated: 2026-09-06
---
# Eraser

## Purpose
Remove whole strokes by touching them. There is no partial erasing.

## Behaviour
1. While Eraser is active, every Pencil move tests the Pencil position against every visible stroke. Any stroke within reach is removed immediately, mid-gesture.
2. Reach is 12 px plus half the stroke's own width, measured in screen pixels.
3. Hit testing measures distance from the Pencil point to each segment of the stroke as currently rendered, so anchored and scaled strokes erase where they appear.
4. All strokes removed in one Pencil-down to Pencil-up gesture form one undo entry.
5. Hidden strokes, whose anchor is not visible, cannot be erased.
6. A translucent circle follows the Pencil at the reach radius, so the reach is visible.
7. Eraser has no size and no colour.

## Edge cases
| Situation | Expected |
|---|---|
| Tap without moving | Strokes under the tap are removed. |
| Drag across 40 strokes | All removed. One undo restores all 40. |
| Pencil-down on empty space, lift | Nothing happens. No undo entry. |
| Pen stroke under a highlighter stroke, both in reach | Both removed. There is no layer preference. |
| Erase, then the anchor's tab is switched away | Nothing to show. The removal is already saved. |
| 2,000 strokes on the page | Hit test runs against bounding boxes first, then segments. Stays under one frame. |

## Acceptance
- [x] Drag the eraser across three strokes, undo once: all three return.
- [x] Erase a size S pen stroke without hitting it exactly.
