---
type: decision
id: D0014
status: superseded
date: 2026-09-06
affects: ["[[modes-and-lock]]", "[[pencil-input]]"]
supersedes: ["D0002"]
---
# D0014: Pencil locks on contact, Unlock frees the hand

## Context
[[D0002-pencil-draws-finger-browses]] left the finger fully native at all times, on the theory that telling the two apart per event makes a lock unnecessary. On the iPad it did not hold up. While writing, the hand rests on the glass and drifts, and a drifting palm is a finger to Safari: the page scrolled under the strokes. Ignoring touches only while the Pencil was down, plus a short grace after, closed most of it but not all, and it made the finger unresponsive at unpredictable moments. A pass-through tap for the Pencil was also tried and turned out unnecessary, since the hand can tap.

## Decision
Three modes. Unlocked: the hand browses, the Pencil is captured, and the Pencil's first contact switches to Locked and draws. Locked: the Pencil draws and every finger and palm touch on the page is cancelled. Unlock is the only way back. The Pencil is never handed to Safari while Inkover is on.

## Consequences
- Nothing to lock before writing, and no timing rule to learn. Touching the page with the Pencil is the lock.
- While writing, the page cannot scroll or select, whatever the palm does. This replaces the palm grace period.
- Reading again costs one tap on Unlock.
- The Pencil never taps links, fields or buttons. The hand does that while Unlocked.
- Touch is intercepted in exactly one mode, Locked, and only outside the toolbar.
- Superseded the same day by [[D0015-manual-lock]]: after Unlock the finger stayed dead until every touch lifted, and the automatic hand-off was hard to predict.
