# Schema

The closed set of document types, the frontmatter they carry, and the naming they follow. When a file and this schema disagree, reconcile the same day.

## Document types

| `type:` | Lives at | Sections, in order |
|---|---|---|
| product | `docs/product.md` | Purpose, Who it is for, Platform, Non-goals, Glossary |
| architecture | `docs/architecture.md` | One H2 per shared mechanism. Feature specs link to these by heading. |
| feature | `docs/features/<slug>.md` | Purpose, Behaviour, Edge cases, Acceptance |
| decision | `docs/decisions/D<NNNN>-<slug>.md` | Context, Decision, Consequences |
| index | `docs/index.md` | Generated. Never hand-edited. |

## Frontmatter

Feature:

```yaml
---
type: feature
id: F03                 # F + two digits, assigned once, never reused
status: specified       # proposed · accepted · specified · built · verified
depends: ["[[pencil-input]]"]        # features this one cannot work without
decisions: ["[[D0001-ipad-only]]"]   # decisions that shaped this spec
updated: 2026-09-05     # date of the last edit to the body
---
```

Decision:

```yaml
---
type: decision
id: D0001               # D + four digits, assigned once, never reused
status: accepted        # proposed · accepted · blocked · superseded
date: 2026-09-05
affects: ["[[pencil-input]]"]        # specs that cite this decision
supersedes: []          # decision ids this replaces, if any
---
```

## Naming

- File names are kebab-case slugs. The H1 is the human title.
- Wikilinks use the file name without extension: `[[anchoring]]`, `[[D0008-anchor-to-dom]]`.
- Feature ids and decision ids are assigned in order of creation and never reused, even after deletion.
- Glossary terms in `docs/product.md` are used with exactly that spelling everywhere, including in code identifiers.

## Behaviour rules and edge cases

- Behaviour is a numbered list. Each rule is testable on its own and under 30 words.
- Edge cases are a two-column table: Situation, Expected. Every row states what happens, never "handle gracefully."
- Acceptance is a checklist a person runs on a real iPad. Each item is one observable result.
- A spec at `specified` or later has no "TBD", no open question, no "maybe." Open questions become a decision with `status: proposed`.
