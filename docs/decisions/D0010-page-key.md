---
type: decision
id: D0010
status: accepted
date: 2026-09-05
affects: ["[[persistence]]"]
supersedes: []
---
# D0010: Page key is the URL without its fragment

## Context
Ink needs a storage key per page. Fragments often drive in-page tabs and scroll positions, so they must not split ink. Query strings sometimes carry tracking noise but also often select real content, so they cannot be dropped safely.

## Decision
Page key = origin + path + query. The fragment is removed. Nothing else is normalised.

## Consequences
- Hash-driven tabs share one ink store; anchoring handles the visibility.
- Two visits with different tracking parameters get different ink. Accepted.
- Same-document navigation that changes path or query switches ink stores.
