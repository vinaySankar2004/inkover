---
type: decision
id: D0002
status: accepted
date: 2026-09-05
affects: ["[[modes-and-lock]]", "[[pencil-input]]"]
supersedes: []
---
# D0002: Pencil draws, finger browses

## Context
A lock that blocks all input forces constant toggling to scroll. On iPad the Pencil and the finger are distinguishable per event, so the lock can capture only the Pencil and leave the finger fully native. This also gives palm rejection for free, since a palm is a touch.

## Decision
Draw mode captures pen pointer events only. Touch is never intercepted, in any mode. Finger drawing is a non-goal.

## Consequences
- The overlay canvas never blocks events itself; capture happens in window-level listeners.
- Scrolling, pinching and tapping links all work while locked.
- Iframes need a shield overlay in Draw, because their events do not reach the parent.
- Users without a Pencil get nothing from Inkover. Accepted.
- Because the two are told apart on every event, there is no reason to make the user lock before drawing. Since 2026-09-06, on means Draw, and Unlock is a one-tap pass-through that locks itself again. See modes-and-lock rule 11.
