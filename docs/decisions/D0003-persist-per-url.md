---
type: decision
id: D0003
status: accepted
date: 2026-09-05
affects: ["[[persistence]]", "[[clear]]"]
supersedes: []
---
# D0003: Ink persists per URL until cleared

## Context
Session-only ink loses work on an accidental reload or when Safari purges a background tab. Per-URL storage is cheap and local. The alternative, wiping on tab close, was offered and declined.

## Decision
Ink is saved per page key in extension local storage and stays until the user clears it.

## Consequences
- Clear is the explicit end of a session, and it is undoable.
- Old ink accumulates on pages the user never clears. There is no expiry in v1.
- Storage limits exist, so there is a per-page stroke cap.
