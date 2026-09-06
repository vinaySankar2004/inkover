---
type: feature
id: F11
status: built
depends: ["[[modes-and-lock]]"]
decisions: []
updated: 2026-09-05
---
# Toolbar

## Purpose
The only visible UI. A floating pill with every control, operated by finger or Pencil, kept out of the way of reading.

## Behaviour
1. Rendered inside a shadow root on a host appended last in body. Page CSS cannot reach it and Inkover CSS cannot leak out.
2. Sits above the overlay. Pencil and finger both operate it. Pencil taps on it never draw.
3. Default position bottom-right, 16 px inside the visual viewport. Drag by its handle to move; on release it snaps to the nearest screen edge.
4. Position is remembered globally, not per page.
5. It stays inside the visual viewport during pinch-zoom, rotation and while the keyboard is up.
6. Two states. Collapsed: one circle showing the current tool and colour. Expanded: the full pill. Tap toggles. In View it starts collapsed.
7. Expanded contents in order: Lock, Pen, Highlighter, Eraser, Trail, Spotlight, colour row, size row, Undo, Redo, Hide, Clear, Collapse.
8. Colour row: six pen colours for Pen and Trail, four highlighter colours for Highlighter, none for Eraser and Spotlight.
9. Pen colours: black, white, red, orange, blue, green. Highlighter colours: yellow, green, pink, blue.
10. Size row: S, M, L for Pen, Highlighter and Spotlight. Hidden for Eraser and Trail.
11. Tool, both colours, size and position persist globally across pages.
12. Notices appear beside the toolbar for 3 s. Only [[persistence]] raises them in v1.
13. Every tap target is at least 44 × 44 pt.
14. The pill is a single row when snapped to the top or bottom edge, and two columns wide when snapped to the left or right edge so it fits a landscape iPad.
15. Undo, Redo, Hide and Clear are disabled when they have nothing to act on.

## Edge cases
| Situation | Expected |
|---|---|
| Page has its own bottom-right floating button | The toolbar overlaps it. The user drags the toolbar away; the position is remembered. |
| Page uses the maximum z-index on something | Ties resolve by DOM order. The host is last in body, so the toolbar wins. |
| Page re-renders body and drops the host | The host is re-appended on the next mutation batch. |
| Safari Reader view | A different document. The extension does not run there. Accepted. |
| Pencil taps a toolbar button with Pen active | The button acts. No ink. |
| Toolbar dragged half off-screen | Snaps back fully inside on release. |

## Acceptance
- [ ] Drag the toolbar to the left edge, open another site: it is on the left.
- [ ] Pinch-zoom the page: the toolbar keeps its size and stays on screen.
- [ ] Every button is comfortably tappable with a finger.
