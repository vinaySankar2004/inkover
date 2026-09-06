---
type: decision
id: D0008
status: accepted
date: 2026-09-05
affects: ["[[anchoring]]", "[[pen]]", "[[highlighter]]"]
supersedes: []
---
# D0008: Anchor ink to DOM elements in v1

## Context
The page that started this project had many in-page tabs. Ink stored at document coordinates sits over the wrong content the moment a tab swaps. Anchoring highlights to text ranges would fix text but not circles and arrows. Anchoring every stroke to the DOM element under its first point handles both, at the cost of some drift for strokes that span elements.

## Decision
Every stroke anchors to a DOM element, with a text fingerprint for repair. This ships in v1, not later.

## Consequences
- Ink hides when its element hides and returns when it returns.
- Strokes spanning elements follow only the first. Accepted.
- Re-rendering listens to DOM mutations, which adds the observer machinery in architecture, Anchoring.
- Storage carries a locator per stroke, so stored ink is larger than raw coordinates.
