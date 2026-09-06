---
type: feature
id: F06
status: built
depends: ["[[pencil-input]]"]
decisions: ["[[D0005-trail-on-contact]]"]
updated: 2026-09-05
---
# Trail

## Purpose
A fidget. Ink that follows the Pencil and fades away, for tracing along a sentence while reading it without leaving a mark.

## Behaviour
1. Trail is a tool. It is active only while Inkover is on and only while selected, so the Pencil is captured like any other tool.
2. While the Pencil is down, every new point adds a segment that fades from full opacity to zero over 800 ms and is then removed.
3. Width tapers from twice the pen size base at the head to zero at the oldest visible point.
4. Colour is the current pen colour.
5. Trail is never stored, never anchored and never undoable.
6. Trail lives in screen space. It does not scroll with the page; it fades where it was drawn.
7. Trail renders on its own canvas in a frame loop that runs only while segments exist.
8. Lifting the Pencil ends input. The tail keeps fading.
9. Each Pencil-down starts a new tail. Nothing ever connects the end of one stroke to the start of the next, even while the previous tail is still fading.

## Edge cases
| Situation | Expected |
|---|---|
| Pencil held still | No new segments. The tail fades to nothing under the tip. |
| Tool switched mid-fade | The remaining tail finishes fading. |
| Draw left mid-fade | The tail clears immediately. |
| Finger scrolls while trailing | The tail stays put on screen and fades. Not a bug. |
| Continuous trail for 30 s | Only the last 800 ms of segments ever exist. Memory is bounded. |
| Pressure varies | Ignored. Trail width is by age only. |
| Writing letters quickly, one stroke after another | Each letter has its own tail. No straight line jumps from one letter to the next. |

## Acceptance
- [ ] Trace a sentence: the tail visibly follows and is gone within about a second.
- [ ] Trailing for a full minute does not make scrolling sluggish.
- [ ] Nothing from the trail survives a reload.
