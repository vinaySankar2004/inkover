---
type: decision
id: D0015
status: accepted
date: 2026-09-06
affects: ["[[modes-and-lock]]", "[[pencil-input]]"]
supersedes: ["D0014"]
---
# D0015: A manual lock, nothing automatic

## Context
Three input models were tried on the iPad in one day. Capturing only the Pencil at all times ([[D0002-pencil-draws-finger-browses]]) let a resting palm scroll the page under the strokes. Handing the Pencil back to Safari for a tap let the Pencil scroll. Locking on the Pencil's first contact ([[D0014-pencil-locks-on-contact]]) drew well, but after Unlock the finger stayed dead until every touch had lifted, because Safari settles scrolling once per touch sequence, and the hand-off was hard to predict while reading.

## Decision
Two on-states and one switch. Unlocked captures nothing: Pencil and finger both browse. Locked captures the Pencil for ink and cancels every touch on the page. The Lock button, or Escape, is the only way between them.

## Consequences
- Every state is obvious from the lock icon, and nothing changes under the user's hand.
- Switching between reading and writing costs one tap each way. Accepted by the owner.
- No pass-through, no palm grace period, no contact detection. The input code is a mode check and two capture rules.
- The Pencil taps links, fields and selects text while Unlocked, natively.
