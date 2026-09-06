---
type: decision
id: D0005
status: accepted
date: 2026-09-05
affects: ["[[trail]]"]
supersedes: []
---
# D0005: Trail on Pencil contact, as a tool

## Context
Pencil hover is only available on M2 and later iPads with Pencil 2 or Pro, and Safari's hover events are less reliable than contact. Finger-driven trail conflicts with scrolling. Contact-only works on every iPad and Pencil.

## Decision
Trail is a tool selected on the toolbar. It draws only while the Pencil is touching the glass while Locked.

## Consequences
- No hover handling anywhere in the code.
- Trail cannot run at the same time as Pen; switching tools is required.
- Trail is never stored, so it has no anchoring or undo.
