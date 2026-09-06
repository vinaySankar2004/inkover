---
type: decision
id: D0002
status: superseded
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
- Superseded on 2026-09-06 by [[D0014-pencil-locks-on-contact]]. The finger stays native only while Unlocked; a resting palm scrolled the page under the strokes, so Locked now cancels every touch. Handing the Pencil back to Safari for a tap was tried and let the Pencil scroll, so the Pencil is never handed back.
