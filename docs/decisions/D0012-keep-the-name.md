---
type: decision
id: D0012
status: accepted
date: 2026-09-05
affects: []
supersedes: []
---
# D0012: Keep the name Inkover

## Context
Before the App Store listing, a search found no app named Inkover on the App Store, but the name is in use elsewhere: inkover.ink is an AI manga translation service, and there are clothing and tattoo pages under the same word. None is a software product for annotation, and none appears to hold a registered mark in that class.

## Decision
Keep Inkover. Register the App Store name at listing time so it is held.

## Consequences
- The bundle identifier `com.inkover.Inkover` was already registered to another Apple developer account, so the app uses `com.vinayaksankaranarayanan.inkover`, which is tied to the owner's name and cannot collide. Users never see it.
- Small risk of a future objection from an unrelated business. If it comes, renaming is a listing change and an icon change; the bundle identifier can stay.
- The marketing site lives on GitHub Pages under the repository name, not on an inkover domain.
- Do not describe Inkover in any way that could be confused with translation or apparel.
