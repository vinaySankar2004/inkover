---
type: decision
id: D0007
status: blocked
date: 2026-09-05
affects: ["[[pencil-input]]", "[[scribble-to-erase]]"]
supersedes: []
---
# D0007: Pencil double-tap cannot toggle the eraser

## Context
The owner chose double-tap to toggle the eraser, as in Notes. Safari does not expose Apple Pencil double-tap or squeeze to web content: there is no DOM event for them, and a Safari Web Extension has no native hook into Safari's input. The wrapper app cannot observe Safari's Pencil either.

## Decision
Double-tap does nothing. Blocked by the platform, not by choice. Revisit if WebKit ships a Pencil interaction event.

## Consequences
- Tool switching is on the toolbar only.
- Scribble to erase is proposed as the no-toolbar way to erase.
- The toolbar's Eraser button is placed where a thumb reaches it while the Pencil hand keeps drawing.
