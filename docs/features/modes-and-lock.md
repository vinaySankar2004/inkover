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
Inkover must never get in the way of reading, and it must never need to be locked before use. The Pencil and the finger are told apart on every event, so when Inkover is on, the Pencil draws and the finger browses, with nothing to switch. Unlocking is the exception: it hands the Pencil to the page for one tap.

## Behaviour
1. Modes are Off, View and Draw. Exactly one is active per tab at any time.
2. Off: no overlay, no toolbar, no ink drawn. The page behaves as if Inkover were not installed.
3. View: ink is drawn over the page and the Pencil behaves natively, so it can tap a link, place a cursor or use Scribble. View lasts for one Pencil tap; see rule 11.
4. Draw: the Pencil is captured. Every Pencil contact goes to the active tool and never reaches the page.
5. In Draw, finger input is untouched: scroll, pinch, tap, long press all work exactly as without Inkover. The one exception is while the Pencil is down and for 1.5 s after, per [[pencil-input]] rule 9.
6. The Safari toolbar button toggles Off and on. Turning on always enters Draw.
7. The lock button on the Inkover toolbar hands the Pencil to the page, entering View. In View the same button returns to Draw at once.
8. On page load, a page with stored ink opens in Draw. A page without ink opens in Off.
9. With a hardware keyboard, Escape hands the Pencil to the page, the same as the lock button.
10. Mode is not remembered across navigation. Rule 8 applies to every load.
11. Auto-lock: in View, the first Pencil-up on the page returns to Draw 300 ms later, after the page has received its tap. A notice says so when View is entered. Taps on the Inkover toolbar do not count.

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
| Unlock, then tap a link with the Pencil | The link opens. On the new page, rule 8 applies. On the same page, Draw returns 300 ms later. |
| Unlock, then scroll with a finger for a minute | View stays until the Pencil touches the page. |
| Unlock, then a Pencil drag on the page, for example to select text | The drag is the page's. Draw returns when the Pencil lifts. |
| Unlock to type in a field with the Pencil and Scribble | Each Scribble stroke is a Pencil-up, so Draw returns after the first stroke. Tap Unlock again for the next word, or use a finger to focus the field and the keyboard to type. |
| Page is a PDF opened in Safari | Safari's PDF view is not a web page; the extension does not run. Accepted. |

## Acceptance
- [ ] In Draw, Pencil on a link draws and does not navigate.
- [ ] In Draw, finger scrolls, pinches and taps links.
- [ ] Reload a page with ink: it opens in Draw with the ink visible, and the Pencil draws at once.
- [ ] Tap Unlock, tap a link with the Pencil: the link opens. Tap Unlock, tap empty space: Draw is back a moment later without touching the toolbar.
- [ ] Escape on a Magic Keyboard leaves Draw.
- [ ] On a page with a YouTube embed, Pencil over the embed draws and finger outside it scrolls.
