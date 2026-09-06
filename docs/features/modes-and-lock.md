---
type: feature
id: F01
status: built
depends: []
decisions: ["[[D0014-pencil-locks-on-contact]]"]
updated: 2026-09-06
---
# Modes and lock

## Purpose
Reading and writing alternate without a switch. The hand browses until the Pencil touches the page; from that contact the page is locked so a resting palm cannot scroll or tap anything while writing. One tap on Unlock gives the page back to the hand. The Pencil is never handed to Safari while Inkover is on, so it can never scroll.

## Behaviour
1. Modes are Off, Unlocked and Locked. Exactly one is active per tab at any time.
2. Off: no overlay, no toolbar, no ink drawn. The page behaves as if Inkover were not installed.
3. Unlocked: finger input is untouched. Scroll, pinch, tap and long press work exactly as without Inkover.
4. Unlocked: the Pencil is captured. Its first contact with the page switches to Locked, and that contact is the start of a stroke with the active tool.
5. Locked: the Pencil is captured and every contact goes to the active tool. Nothing the Pencil does reaches the page or Safari's own gestures.
6. Locked: finger and palm touches on the page do nothing. No scroll, pinch, tap, long press or text selection. The toolbar still answers to both.
7. Unlock, on the toolbar, switches Locked to Unlocked. Lock, the same button, switches Unlocked to Locked without a Pencil contact. A notice names each change; after Unlock, while anything still touches the page, it says to lift the hand first.
8. The Safari toolbar button toggles between Off and Unlocked.
9. On page load, a page with stored ink opens Unlocked. A page without ink opens in Off.
10. With a hardware keyboard, Escape unlocks. It does nothing while Unlocked.
11. Mode is not remembered across navigation. Rule 9 applies to every load.

## Edge cases
| Situation | Expected |
|---|---|
| Pencil taps a link, in either on mode | Nothing happens on the page. With Pen active, a dot is drawn and the mode is Locked. |
| Finger taps a link while Unlocked | Page navigates. Rule 9 applies on the new page. |
| Finger taps a link while Locked | Nothing. Tap Unlock first. |
| Palm lands beside the Pencil while Locked | Ignored. |
| Palm lands and drifts before the Pencil touches, while Unlocked | The page may scroll until the Pencil lands, then it locks. iPadOS drops most palm touches once the Pencil is near. |
| Finger is mid-scroll when the Pencil lands | The scroll already under way finishes. No new finger gesture starts until Unlock. |
| Unlock tapped while the palm still rests on the page | Safari settles scrolling once per touch sequence, and that sequence was cancelled while Locked. Nothing scrolls until every finger and the palm lift; then the next touch scrolls. The Unlock notice says so. |
| Pencil is drawing when a finger taps Unlock on the toolbar | The stroke continues and ends normally. The mode is Unlocked from then on. |
| Pencil touches inside an iframe | Captured; ink is drawn. While Unlocked a finger on that iframe scrolls the outer page, not the iframe. |
| Site has its own Pencil handling, for example a drawing canvas | Inkover wins while it is on. Turn Inkover off from Safari's button to use the site's canvas. |
| Trackpad or mouse on a Magic Keyboard while Locked | Not a hand. Unaffected. |
| Page enters fullscreen video | Overlay and toolbar hide until fullscreen exits. Mode is preserved. |
| System gesture interrupts a stroke, for example a Control Centre swipe | pointercancel ends the stroke as drawn so far. |
| Two Safari button toggles within 300 ms | The second is ignored. |
| Page is a PDF opened in Safari | Safari's PDF view is not a web page; the extension does not run. Accepted. |
| Selecting text or tapping a field with the Pencil | Not possible while Inkover is on. Use a finger while Unlocked. |

## Acceptance
- [ ] Turn Inkover on: the toolbar shows an open lock. Scroll with a finger: the page scrolls.
- [ ] Touch the page with the Pencil: ink appears from that first contact and the lock closes.
- [ ] While Locked, scroll and tap links with a finger: nothing happens.
- [ ] While Locked, rest the palm and write: the page stays still and the strokes are unbroken.
- [ ] Tap Unlock, lift everything off the glass: a finger scrolls and taps again. Touch with the Pencil: it locks and draws.
- [ ] Drag the Pencil while Unlocked: it draws and nothing scrolls.
- [ ] Reload a page with ink: it opens Unlocked with the ink visible.
- [ ] Escape on a Magic Keyboard unlocks.
- [ ] On a page with a YouTube embed, Pencil over the embed draws and, while Unlocked, a finger outside it scrolls.
