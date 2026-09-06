---
type: decision
id: D0001
status: accepted
date: 2026-09-05
affects: ["[[pencil-input]]"]
supersedes: []
---
# D0001: iPad only

## Context
The original idea was a Mac Safari extension. The actual use is reading on an iPad with an Apple Pencil, which is where pressure, palm rejection and the draw-with-Pencil, browse-with-finger split exist. A Mac build would need a second input model and adds nothing the owner wants.

## Decision
Build for iPadOS Safari only. The Xcode project targets iOS. No macOS target.

## Consequences
- Input handling assumes a pen pointer and touch pointers, never mouse hover.
- Keyboard shortcuts exist only for the hardware keyboard case and are never the primary path.
- Testing happens on a real iPad. The simulator cannot produce Pencil pressure.
