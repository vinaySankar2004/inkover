---
type: product
updated: 2026-09-06
---
# Inkover

## Purpose
Draw over any web page in Safari on iPad with Apple Pencil. Lock the page to draw with the hand resting on it; unlock to browse with Pencil or finger. Ink stays attached to the content it was drawn on and survives reload until it is cleared.

## Who it is for
One person, reading. It exists so that reading a web page can involve circling, underlining, highlighting and doodling, the way paper does.

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
| Page key | The URL without its fragment. Ink is stored per page key. See [[D0010-page-key]]. |
| Toolbar | The floating control pill Inkover adds to the page. See [[toolbar]]. |
| Notice | A short line of text shown beside the toolbar for a few seconds. |
