---
type: decision
id: D0006
status: accepted
date: 2026-09-05
affects: ["[[highlighter]]", "[[shape-snap]]"]
supersedes: []
---
# D0006: Hold still to snap

## Context
Straightening a highlighter stroke needs a modifier, and there is no Shift key on iPad. Apple Notes uses "pause before lifting" and the gesture is already learned. Auto-straightening every highlighter stroke was rejected because it removes the option of a freehand highlight.

## Decision
Snapping is triggered by holding the Pencil still for 400 ms before lifting. The highlighter uses it for straight lines. Any future snap uses the same gesture.

## Consequences
- The gesture is one rule shared across tools; thresholds live in the highlighter spec and are reused.
- Slow, deliberate drawers may trigger it by accident. The aspect-ratio rule limits false positives.
- The Pen uses the same hold for lines, ellipses and rectangles. See shape-snap.
