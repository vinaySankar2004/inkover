---
type: feature
id: F12
status: verified
depends: ["[[modes-and-lock]]", "[[pencil-input]]"]
decisions: []
updated: 2026-09-06
---
# Reading spotlight

## Purpose
A focus aid. While the Pencil is down with the Spotlight tool, the page dims except a horizontal band around the tip, so one or two lines stand out. Lifting restores the page. Nothing is stored.

## Behaviour
1. Spotlight is a tool, active only while Locked. The Pencil is captured like any other tool.
2. Pencil-down dims the whole visual viewport with black at 0.7 opacity, except a band centred on the Pencil's vertical position.
3. Band height is the slider's value, 40 to 200 visual pixels, default 80. The band spans the full width. See [[toolbar]] rule 10.
4. Band edges are soft: a 16 px gradient on each side.
5. The band follows the Pencil's vertical position on every move, in the same frame.
6. Pencil-up removes the dim at once. There is no fade.
7. Horizontal movement is ignored.
8. Ink inside the band stays bright. Ink outside dims with the page.
9. Spotlight never creates strokes, undo entries or saves.

## Edge cases
| Situation | Expected |
|---|---|
| Finger scrolls while the Pencil is held | The band stays at the Pencil's screen position; content scrolls beneath it. |
| Pencil slides off the screen edge | pointercancel or pointerup. The dim is removed. |
| Pinch-zoom while holding | The band stays in screen space at the same visual height. |
| Toolbar tapped while holding | The toolbar sits above the dim and stays bright. The tap acts. |
| Dark page | The dim is still black at 0.7 and the band is subtle. Accepted. |
| Trail still fading when Spotlight starts | The trail finishes fading above the dim. |

## Acceptance
- [x] Hold the Pencil on a line: everything but that line and its neighbours darkens.
- [x] Move the Pencil down the page: the band follows with no visible lag.
- [x] Lift: the page is fully bright at once.
