---
type: feature
id: F02
status: built
depends: ["[[modes-and-lock]]"]
decisions: ["[[D0001-ipad-only]]", "[[D0007-pencil-double-tap]]"]
updated: 2026-09-05
---
# Pencil input

## Purpose
Everything Inkover knows about the Pencil as a device: what is read from it and what is deliberately ignored.

## Behaviour
1. Only pointer events with pointerType `pen` produce ink. Touch never does, with any tool.
2. Pressure is read from every event and stored with every point, from 0 to 1.
3. A point reporting pressure 0 is stored as 0.5, so a stroke never vanishes.
4. Coalesced events are used when available, so fast strokes have no gaps.
5. Tilt, azimuth, barrel roll and hover are ignored.
6. Pencil double-tap does nothing. Safari does not expose it to web content. See [[D0007-pencil-double-tap]].
7. A stroke ends on pointerup or pointercancel. A stroke with a single point is kept as a dot.
8. In Draw, stylus touch events are cancelled at capture, so Safari does not scroll, select text or start Scribble from a Pencil contact.
9. In Draw, while the Pencil is down and for 1.5 s after it lifts, finger and palm touches do nothing to the page. A resting palm that drifts would otherwise start a scroll, and Safari cancels the Pencil stroke when a scroll starts.

## Edge cases
| Situation | Expected |
|---|---|
| First-generation Pencil | Works identically. Hover is unused on every Pencil. |
| Pencil battery dies mid-stroke | pointercancel; the stroke is kept as drawn. |
| Pencil down on a text field in Draw | No keyboard, no Scribble. Ink is drawn. |
| Pencil down on a text field in View | The tap focuses the field. Scribble cannot write, since View swallows Pencil drags. |
| Pressure reported as 0 for a whole stroke | Stroke drawn at mid pressure per rule 3. |
| Very fast flick | No visible gaps per rule 4. |
| Two strokes in quick succession | Two separate strokes. There is no join threshold. |
| Pencil Pro squeeze | Ignored. Not exposed to web content. |
| Palm rests on the page, then the hand drifts while writing | The page does not scroll and the stroke continues. |
| Finger scrolls right after a stroke | Scrolling resumes 1.5 s after the Pencil lifts. |
| Finger scrolls while the Pencil is up for longer than that | Scrolls as normal. |

## Acceptance
- [ ] Light and hard presses visibly differ in width with the Pen tool.
- [ ] Pencil in Draw over a search box does not open the keyboard.
- [ ] A finger with any tool leaves no ink.
