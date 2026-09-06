---
type: decision
id: D0011
status: accepted
date: 2026-09-05
affects: []
supersedes: []
---
# D0011: Free at launch, then paid up front at $5.99

## Context
Inkover will ship on the App Store. Every direct competitor is a one-time purchase between $2.99 and $4.99, none charges a subscription, and Inkover has no running cost. A free app with a one-time unlock would need StoreKit in the wrapper and a native-messaging entitlement check in the extension. A subscription would be out of step with the category. The owner wants to start free and charge later.

## Decision
Launch free with no in-app purchase, no ads and no purchase code. When the owner decides, switch the App Store price to $5.99 in the United States and Apple's matching tiers elsewhere. The model stays paid up front; the only thing that changes is the price field.

## Consequences
- Zero purchase code, now and later. The extension may not contain purchases under guideline 4.4 anyway.
- Everyone who downloads during the free period keeps it free, including re-downloads. That is the cost of the ratings the free period buys.
- The switch is one field in App Store Connect and one line in `docs/store/listing.md`. Update both the same day.
- Refunds and family sharing are Apple's either way.
- Market notes in `docs/store/market.md`.
