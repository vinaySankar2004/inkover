---
type: product
updated: 2026-09-05
---
# Inkover

## Purpose
Draw over any web page in Safari on iPad with Apple Pencil. A finger keeps scrolling, tapping and pinching as normal. Ink stays attached to the content it was drawn on and survives reload until it is cleared.

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
| Mode | Off, View or Draw. See [[modes-and-lock]]. |
| Lock | Draw mode. The Pencil is captured by Inkover and never reaches the page. |
| Tool | Pen, Highlighter, Eraser or Trail. Exactly one is active. |
| Anchor | The DOM element a stroke is attached to, so it moves and hides with its content. See [[anchoring]]. |
| Page key | The URL without its fragment. Ink is stored per page key. See [[D0010-page-key]]. |
| Toolbar | The floating control pill Inkover adds to the page. See [[toolbar]]. |
| Notice | A short line of text shown beside the toolbar for a few seconds. |
