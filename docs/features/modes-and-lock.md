---
type: feature
id: F01
status: built
depends: []
decisions: ["[[D0002-pencil-draws-finger-browses]]"]
updated: 2026-09-05
---
# Modes and lock

## Purpose
Inkover must never get in the way of reading. Three modes make it explicit whether the Pencil belongs to the page or to Inkover. The lock is Draw mode, and it captures only the Pencil.

## Behaviour
1. Modes are Off, View and Draw. Exactly one is active per tab at any time.
2. Off: no overlay, no toolbar, no ink drawn. The page behaves as if Inkover were not installed.
3. View: ink is drawn over the page. Pencil and finger both behave natively. The toolbar shows collapsed.
4. Draw: the Pencil is captured. Every Pencil contact goes to the active tool and never reaches the page.
5. In Draw, finger input is untouched: scroll, pinch, tap, long press all work exactly as without Inkover. The one exception is while the Pencil is down and for 1.5 s after, per [[pencil-input]] rule 9.
6. The Safari toolbar button toggles Off and on. Turning on enters View if the page has ink, otherwise Draw.
7. The lock button on the Inkover toolbar toggles View and Draw.
8. On page load, a page with stored ink opens in View. A page without ink opens in Off.
9. With a hardware keyboard, Escape leaves Draw for View.
10. Mode is not remembered across navigation. Rule 8 applies to every load.

## Edge cases
| Situation | Expected |
|---|---|
| Pencil taps a link in Draw | Nothing happens on the page. With Pen active, a dot is drawn. |
| Finger taps a link in Draw | Page navigates. Rule 8 applies on the new page. |
| Pencil touches inside an iframe in Draw | Captured; ink is drawn. A finger on that iframe scrolls the outer page, not the iframe, until View. |
| Site has its own Pencil handling, for example a drawing canvas | Inkover wins in Draw. View hands the Pencil back to the site. |
| Page enters fullscreen video | Overlay and toolbar hide until fullscreen exits. Mode is preserved. |
| Palm rests on the glass in Draw | Ignored. A palm is a touch, not a pen. |
| System gesture interrupts a stroke, for example a Control Centre swipe | pointercancel ends the stroke as drawn so far. |
| Two toggles within 300 ms | The second is ignored. |
| Page is a PDF opened in Safari | Safari's PDF view is not a web page; the extension does not run. Accepted. |

## Acceptance
- [ ] In Draw, Pencil on a link draws and does not navigate.
- [ ] In Draw, finger scrolls, pinches and taps links.
- [ ] Reload a page with ink: it opens in View, ink visible, Pencil taps links.
- [ ] Escape on a Magic Keyboard leaves Draw.
- [ ] On a page with a YouTube embed, Pencil over the embed draws and finger outside it scrolls.
