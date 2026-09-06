---
type: decision
id: D0013
status: accepted
date: 2026-09-06
affects: ["[[toolbar]]"]
supersedes: []
---
# D0013: The system colour picker, not a custom one

## Context
The owner wanted any colour, not only presets, and wanted chosen colours remembered. A custom picker in the toolbar means building hue wheels, sliders and hex entry, and testing them with a Pencil. iPadOS already has a colour picker that Notes and Freeform use, and Safari opens it from a colour input.

## Decision
The rainbow swatch is a colour input. It opens the system picker. Confirmed colours are remembered, three per tool, most recent first.

## Consequences
- Zero picker UI to build or maintain, and it looks like the rest of iPadOS.
- The picker's own layout is Apple's; it cannot be restyled.
- Colours are stored as hex strings beside the palette keys, and the paint code accepts both.
