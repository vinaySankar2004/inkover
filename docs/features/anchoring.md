---
type: feature
id: F10
status: specified
depends: []
decisions: ["[[D0008-anchor-to-dom]]"]
updated: 2026-09-05
---
# Anchoring

## Purpose
Ink belongs to content, not to a spot on the page. When a site swaps a tab, expands a section, lazy-loads an image or reflows on rotation, every stroke moves with the element it was drawn on and hides while that element is hidden. Mechanism in architecture, Anchoring.

## Behaviour
1. On Pencil-up each stroke attaches to the anchor element under its first point: the nearest block-level ancestor with visible content.
2. Points are stored as offsets from the anchor's top-left, with the anchor's width at draw time.
3. At render, horizontal offsets scale with the anchor's current width. Vertical offsets do not.
4. A stroke whose anchor cannot be found or is not visible is hidden, not deleted. It returns when the anchor does.
5. Re-render happens on scroll, resize, rotation, pinch and any DOM mutation, coalesced to one frame.
6. When a stored locator fails, Inkover finds an element with the same tag and same leading text and repairs the locator.
7. Strokes drawn over nothing in particular, meaning body or html, anchor to the document at absolute coordinates.

## Edge cases
| Situation | Expected |
|---|---|
| Tabs swap content in place with display:none | Ink on tab A hides when tab B shows and returns with tab A. |
| Tabs destroy and recreate their content | Locator fails; rule 6 repairs it by text; ink returns. |
| Accordion expands above the anchored paragraph | The paragraph moves down and the ink moves with it. |
| Rotate the iPad, text reflows narrower | Ink stretches horizontally with its element. A circle around a word stays around roughly that word. |
| Infinite-scroll feed removes old posts from the DOM | Their ink hides. If a post returns with the same text, its ink returns. |
| Two elements with identical tag and text | Repair picks the first in document order. Accepted. |
| Stroke spans two elements | Follows the first only. |
| Site re-renders on every keystroke | Each mutation batch is one frame. Re-resolution is limited to once per 100 ms. |
| Element under the first point is a 1 px spacer or invisible overlay | Skipped. Candidates need 16 px of height and text or media. |
| Dark-mode toggle changes classes on every element | One re-render. Nothing moves. |
| Page uses random ids on every load | Id lookup fails; text repair finds the element. |

## Acceptance
- [ ] On a tabbed page, ink on tab one disappears on tab two and returns on tab one.
- [ ] Expand a collapsed section above your ink: the ink moves down with its text.
- [ ] Rotate the iPad: ink stays on its words.
- [ ] Reload a page with per-load random ids: ink is still attached.
