---
type: feature
id: F01
status: verified
depends: []
decisions: ["[[D0015-manual-lock]]"]
updated: 2026-09-06
---
# Modes and lock

## Purpose
One switch. Unlocked, Inkover shows the ink and the toolbar and captures nothing, so Pencil and finger both browse the page as usual. Locked, the Pencil draws and the hand does nothing on the page, so a resting palm cannot move it. Nothing switches on its own.

## Behaviour
1. Modes are Off, Unlocked and Locked. Exactly one is active per tab at any time.
2. Off: no overlay, no toolbar, no ink drawn. The page behaves as if Inkover were not installed.
3. Unlocked: ink and toolbar are shown and no input is captured. Pencil and finger scroll, tap, pinch and select exactly as without Inkover. Nothing draws.
4. Locked: the Pencil is captured. Every contact goes to the active tool and never reaches the page or Safari's own gestures.
5. Locked: finger and palm touches on the page do nothing. No scroll, pinch, tap, long press or text selection. The toolbar still answers to both.
6. The Lock button toggles Unlocked and Locked. Its icon shows the state, its label names the action. A notice names each change; after Unlock, while anything still touches the page, it says to lift the hand first.
7. The Safari toolbar button toggles between Off and Locked.
8. On page load, a page with stored ink opens Unlocked. A page without ink opens in Off.
9. With a hardware keyboard, Escape unlocks. It does nothing while Unlocked.
10. Mode is not remembered across navigation. Rule 8 applies to every load.

## Edge cases
| Situation | Expected |
|---|---|
| Pencil taps a link while Unlocked | The link opens. Rule 8 applies on the new page. |
| Pencil taps a link while Locked | Nothing happens on the page. With Pen active, a dot is drawn. |
| Finger taps a link while Locked | Nothing. Tap Unlock first. |
| Palm rests beside the Pencil while Locked | Ignored. |
| Unlock tapped while the palm still rests on the page | Safari settles scrolling once per touch sequence, and that sequence was cancelled while Locked. Nothing scrolls until every finger and the palm lift; then the next touch scrolls. The Unlock notice says so. |
| Finger is mid-scroll when Lock is tapped | The scroll already under way finishes. No new finger gesture starts until Unlock. |
| Pencil is drawing when a finger taps Unlock | The stroke continues and ends normally. The mode is Unlocked from then on. |
| Pencil touches inside an iframe while Locked | Captured; ink is drawn. Unlocked, the iframe is native for both. |
| Site has its own Pencil handling, for example a drawing canvas | Locked, Inkover wins. Unlock to use the site's canvas. |
| Trackpad or mouse on a Magic Keyboard while Locked | Not a hand. Unaffected. |
| Page enters fullscreen video | Overlay and toolbar hide until fullscreen exits. Mode is preserved. |
| System gesture interrupts a stroke, for example a Control Centre swipe | pointercancel ends the stroke as drawn so far. |
| Two Safari button toggles within 300 ms | The second is ignored. |
| Page is a PDF opened in Safari | Safari's PDF view is not a web page; the extension does not run. Accepted. |

## Acceptance
- [x] Turn Inkover on: the toolbar shows a closed lock and the Pencil draws at once.
- [x] Locked: scroll and tap links with a finger, and scroll with the Pencil: nothing moves.
- [x] Locked: rest the palm and write: the page stays still and the strokes are unbroken.
- [x] Tap Unlock, lift everything: the Pencil and a finger both scroll and open links. Nothing draws.
- [x] Tap Lock: the Pencil draws again.
- [x] Reload a page with ink: it opens Unlocked with the ink visible.
- [x] Escape on a Magic Keyboard unlocks.
- [x] On a page with a YouTube embed: Locked, the Pencil over the embed draws; Unlocked, the embed plays.
