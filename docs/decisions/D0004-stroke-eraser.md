---
type: decision
id: D0004
status: accepted
date: 2026-09-05
affects: ["[[eraser]]"]
supersedes: []
---
# D0004: Stroke eraser only

## Context
Strokes are stored as vectors so they can re-render on scroll and anchor to content. A pixel eraser would need erase strokes stored as subtractive geometry, which complicates undo and anchoring. A stroke eraser is a hit test and a removal.

## Decision
The eraser removes whole strokes. There is no pixel eraser in v1.

## Consequences
- Undo of an erase gesture is a single entry.
- Removing part of a long stroke means redrawing it.
- A pixel eraser can be added later as a new feature without changing storage.
