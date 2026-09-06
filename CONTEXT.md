# The feature lifecycle

The flow in one line: propose it, decide it, spec it, build it, verify it. A feature is a file in `docs/features/` and its `status` field is where it is in the flow.

| Status | Meaning | Who moves it forward | Human check before the next status |
|---|---|---|---|
| `proposed` | Idea with a purpose paragraph only | Anyone | Owner accepts or rejects. Rejected specs move to `docs/decisions/` as a decision, and the file is deleted. |
| `accepted` | Will be built; not yet fully specified | Owner | None. |
| `specified` | Behaviour, edge cases and acceptance are complete | Agent or owner | Owner reads the whole spec and edits it in place. |
| `built` | Code in `extension/` implements every rule | Agent | Owner runs the Acceptance list on a real iPad. |
| `verified` | Acceptance list passed on device | Owner | None. Regressions send it back to `built`. |

Decisions have their own tiny lifecycle: `proposed`, then `accepted` or `blocked`, and eventually `superseded`. A decision is never deleted, only superseded by a newer one that links back.

Factory, stable across all features: `_meta/` and `docs/architecture.md`.
Product, one per feature: the spec file and the code that implements it.

Status of the whole project is whatever `docs/index.md` says after a rebuild. If the index and the files disagree, the files win and the index is stale: rebuild it.
