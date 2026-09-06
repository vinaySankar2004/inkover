---
type: feature
id: F11
status: verified
depends: ["[[modes-and-lock]]"]
decisions: []
updated: 2026-09-06
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
6. Two states. Collapsed: one circle showing the current tool and colour. Expanded: the full pill. Tap toggles. Turning Inkover on expands it; Lock and Unlock leave it as it is.
7. Expanded contents, in groups: the grip; Lock, Pen, Highlight; Eraser, Trail, Spotlight; the colour swatches; the width slider; Undo, Redo; Hide, Clear; More. On a side edge each group is its own row of up to three, centred, so the column has no orphan cells.
8. Colour swatches: six pen colours for Pen and Trail, four highlighter colours for Highlighter, none for Eraser and Spotlight. Pen colours: black, white, red, orange, blue, green. Highlighter colours: yellow, green, pink, blue.
9. After the presets comes one custom swatch. With no colour picked yet it shows a rainbow and a tap opens the system colour picker. Once a colour is picked the swatch shows it: a tap selects it, a second tap opens the picker. Every colour picked replaces the swatch's colour, live while the picker is open. Pen and Highlighter each keep their own.
10. Width slider, with a dot showing the width in the current colour: Pen 1 to 12 px in half steps, default 3; Highlighter 8 to 40 px, default 20; Spotlight band 40 to 200 px in steps of 4, default 80. Hidden for Eraser and Trail. Moving it redraws the stroke in progress.
11. Tool, both colours, both custom colours, all three widths, preferences and position persist globally across pages.
12. Notices appear beside the toolbar for 3 s: lock changes, the tool switched by a tip double-tap, a reset, and storage problems.
13. Every tap target is 54 × 54 pt, or 44 × 44 pt with Compact on in [[preferences]]. Tool and action buttons carry a one-word label under the icon: Lock or Unlock, Pen, Highlight, Eraser, Trail, Spotlight, Undo, Redo, Hide or Show, Clear, More. Labels can be turned off there too.
14. The pill is a row when snapped to the top or bottom edge and wraps to a second row when the screen is too narrow for one, as on an 11-inch iPad in portrait. On the left or right edge it is two columns wide so it fits a landscape iPad.
15. Undo, Redo, Hide and Clear are disabled when they have nothing to act on.

## Edge cases
| Situation | Expected |
|---|---|
| Page has its own bottom-right floating button | The toolbar overlaps it. The user drags the toolbar away; the position is remembered. |
| Page uses the maximum z-index on something | Ties resolve by DOM order. The host is last in body, so the toolbar wins. |
| Page re-renders body and drops the host | The host is re-appended on the next mutation batch. |
| Safari Reader view | A different document. The extension does not run there. Accepted. |
| Pencil taps a toolbar button with Pen active | The button acts. No ink. |
| Finger taps a toolbar button while Locked | The button acts. The lock applies to the page, not the toolbar. |
| Toolbar dragged half off-screen | Snaps back fully inside on release. |
| Split View or Slide Over makes the page narrower than the pill | The row wraps again as needed. Every button stays on screen. |
| Page sends a Content-Security-Policy that forbids inline styles | The toolbar, colours and sizes render anyway. Styles are applied through the CSSOM, which the policy does not govern. |
| Page stylesheet has rules like `body > div { width: 280px }` | The toolbar keeps its size and position. Every property on the host is declared important. |
| Colour picker dismissed without touching it | Colour unchanged, swatch unchanged. |
| Colour picker slid across many colours | Ink colour and the swatch follow live. The picker stays open until dismissed; nothing the toolbar does closes it. |
| Custom swatch tapped while a preset is current | The custom colour is selected. The picker does not open. |
| Slider moved while a stroke is in progress | Impossible with one Pencil; a finger on the slider mid-stroke changes the next stroke only. |

## Acceptance
- [x] On claude.ai, which sends a strict policy, the colour swatches show their colours and the toolbar sits bottom right at full width.

## Acceptance
- [x] Drag the toolbar to the left edge, open another site: it is on the left.
- [x] Pinch-zoom the page: the toolbar keeps its size and stays on screen.
- [x] Every button is comfortably tappable with a finger.
- [x] Open the colour picker and slide the hue: the picker stays open and the ink colour follows.
