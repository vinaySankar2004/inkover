---
type: product
updated: 2026-09-15
---
# Inkover

## Purpose
Draw over any web page in Safari on iPad with Apple Pencil. Lock the page to draw with the hand resting on it; unlock to browse with Pencil or finger. Ink stays attached to the content it was drawn on and survives reload until it is cleared.

## Who it is for
Anyone reading on an iPad with a Pencil. Inkover has been a free download on the App Store since 2026-09-10. The Apple ID, the store URL and the exact listing text live in [[listing]].

It was built for one reader, and it is still designed as if it had one. That is the standard a change is held to: it earns its place by making reading better for a person circling a sentence, not by widening the audience. The non-goals below are what that standard has already ruled out, and being on the store does not reopen them.

## Platform
iPadOS 17 or later, Safari, any Apple Pencil. See [[D0001-ipad-only]].

## Non-goals
Recorded so nobody builds them. See [[D0009-non-goals]].
- Export, print, share, screenshot.
- Mac, iPhone, other browsers.
- Sync between devices, cloud storage of any kind.
- Typed text notes, sticky notes, shape tools.
- Finger drawing.

## Glossary
Use these words exactly, in docs and in code identifiers.

| Term | Meaning |
|---|---|
| Ink | Everything stored for one page: all of its strokes. |
| Stroke | One continuous Pencil-down to Pencil-up path with its tool, colour, size and points. |
| Trail | Transient ink that fades in under a second and is never stored. |
| Mode | Off, Unlocked or Locked. See [[modes-and-lock]]. |
| Lock | Locked, the Pencil draws and the page ignores the hand. Unlocked, nothing is captured. The Lock button switches; nothing switches on its own. |
| Tool | Pen, Highlighter, Eraser, Trail or Spotlight. Exactly one is active. |
| Anchor | The DOM element a stroke is attached to, so it moves and hides with its content. See [[anchoring]]. |
| Frame | An iframe on the page. One that runs Inkover has its own overlay and ink. See [[frames]]. |
| Page key | The URL without its fragment. Ink is stored per page key. See [[D0010-page-key]]. |
| Toolbar | The floating control pill Inkover adds to the page. See [[toolbar]]. |
| Notice | A short line of text shown beside the toolbar for a few seconds. |
