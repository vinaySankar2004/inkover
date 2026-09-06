# Contributing

Inkover is a small project with one hard rule: the docs are the source of truth. If the code and a spec disagree, one of them is wrong, and the pull request that fixes it says which.

## Before you change anything

Read [CLAUDE.md](CLAUDE.md). It routes you to the one or two files you need. Do not try to read all of `docs/` first.

## Making a change

1. Find the feature spec in `docs/features/`. If there is none, copy `_meta/feature-template.md` and open a pull request with the spec alone, at `status: proposed`. Wait for it to be accepted before writing code.
2. Edit the spec first. Update `updated:` in its frontmatter.
3. If the change involves a choice that could reasonably have gone another way, add a decision file from `_meta/decision-template.md` and link it from the spec.
4. Then change the code in `extension/`.
5. Run `python3 scripts/build-index.py`. It regenerates `docs/index.md` and fails on broken links.
6. Test on a real iPad with an Apple Pencil. The simulator cannot produce Pencil pressure, and a Mac has no Pencil at all. Tick the spec's Acceptance items you verified in the pull request description.

Spec and code land in the same pull request. A pull request that changes behaviour without touching a spec is sent back.

## Writing

Follow `_meta/writing-rules.md`. In particular: no em dashes, no arrows in prose, no filler, present tense, under 30 words per behaviour rule.

## Reporting a bug

Open an issue that names the spec and the rule or edge case that is not being honoured, and the page URL where it happens. If no rule covers the situation, say so; that is a spec bug and just as welcome.
