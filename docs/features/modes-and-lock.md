---
type: feature
id: F01
status: built
depends: []
decisions: ["[[D0002-pencil-draws-finger-browses]]"]
updated: 2026-09-06
---
# Modes and lock

## Purpose
Inkover must never get in the way of reading, and it must never need to be locked before use. The Pencil and the finger are told apart on every event, so when Inkover is on the Pencil draws and the finger browses, with nothing to switch. Safari never gets the Pencil back while Inkover is on, which is what keeps the Pencil from scrolling. When the Pencil needs to tap something on the page, Unlock passes exactly one tap through, delivered by Inkover itself.

## Behaviour
1. Modes are Off and Draw. Exactly one is active per tab at any time.
2. Off: no overlay, no toolbar, no ink drawn. The page behaves as if Inkover were not installed.
3. Draw: the Pencil is captured. Every Pencil contact goes to the active tool and never reaches the page or Safari's own gestures. Nothing the Pencil does scrolls the page; scrolling is the finger's.
4. In Draw, finger input is untouched: scroll, pinch, tap, long press all work exactly as without Inkover. The one exception is while the Pencil is down and for 1.5 s after, per [[pencil-input]] rule 9.
5. The Safari toolbar button toggles Off and Draw.
6. Unlock arms a pass-through. The next Pencil tap on the page, shorter than 250 ms and moving less than 6 px, is delivered by Inkover to the element under the tip: the element gets focus, then pointer, mouse and click events at that point. The tap leaves no ink and the pass-through is spent.
7. While a pass-through is armed, Pencil drags still draw, and the Unlock button shows an open lock labelled Tap page. Tapping it again cancels the pass-through.
8. On page load, a page with stored ink opens in Draw. A page without ink opens in Off.
9. With a hardware keyboard, Escape arms the pass-through, the same as Unlock.
10. Mode is not remembered across navigation. Rule 8 applies to every load.

## Edge cases
| Situation | Expected |
|---|---|
| Pencil taps a link in Draw with no pass-through armed | Nothing happens on the page. With Pen active, a dot is drawn. |
| Unlock, then the Pencil taps a link | The link opens. On the new page, rule 8 applies. |
| Unlock, then the Pencil drags | The drag draws as usual. The pass-through stays armed for the next tap. |
| Unlock, then the Pencil taps a text field | The field gets focus and the keyboard appears. Typing is the keyboard's. Scribble needs a native Pencil, which the page never gets while Inkover is on. |
| Unlock, then the Pencil taps inside a cross-origin iframe | Nothing. A tap cannot be delivered into another origin. Use a finger. |
| Unlock, then the Pencil taps a control that listens only for touch events | Inkover sends pointer, mouse and click events. A control that ignores all three does not respond. Use a finger. |
| Unlock with the Eraser active, then tap | The tap goes to the page and erases nothing. |
| Finger taps a link in Draw | Page navigates. Rule 8 applies on the new page. |
| Pencil touches inside an iframe in Draw | Captured; ink is drawn. A finger on that iframe scrolls the outer page, not the iframe, while Inkover is on. |
| Site has its own Pencil handling, for example a drawing canvas | Inkover wins while it is on. Turn Inkover off from Safari's button to use the site's canvas. |
| Page enters fullscreen video | Overlay and toolbar hide until fullscreen exits. Mode is preserved. |
| Palm rests on the glass in Draw | Ignored. A palm is a touch, not a pen. |
| System gesture interrupts a stroke, for example a Control Centre swipe | pointercancel ends the stroke as drawn so far. |
| Two toggles within 300 ms | The second is ignored. |
| Page is a PDF opened in Safari | Safari's PDF view is not a web page; the extension does not run. Accepted. |
| Selecting text with the Pencil | Not possible while Inkover is on. Use a finger. |

## Acceptance
- [ ] In Draw, Pencil on a link draws and does not navigate.
- [ ] In Draw, finger scrolls, pinches and taps links.
- [ ] Reload a page with ink: it opens in Draw with the ink visible, and the Pencil draws at once.
- [ ] Tap Unlock, then tap a link with the Pencil: the link opens and the lock closes by itself.
- [ ] Tap Unlock, then drag the Pencil across the page: it draws and nothing scrolls. Then tap: the tap goes through.
- [ ] Escape on a Magic Keyboard arms Unlock.
- [ ] On a page with a YouTube embed, Pencil over the embed draws and finger outside it scrolls.
