#!/usr/bin/env python3
"""Rebuild docs/index.md from frontmatter and report broken wikilinks.

Usage:
  python3 scripts/build-index.py                 rebuild the index, fail on broken links
  python3 scripts/build-index.py --blast <slug>  list every file a spec or decision reaches
  python3 scripts/build-index.py --blast <slug> <word>...  also every prose line using those words

The blast radius of a change is the set of files that must be re-read before the
change lands: everything that links to the spec, and every piece of prose that
describes the behaviour in its own words. Exit code 1 if any wikilink does not
resolve, so it can gate a commit.
"""
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
FEATURES = DOCS / "features"
DECISIONS = DOCS / "decisions"
INDEX = DOCS / "index.md"

# Prose that restates behaviour outside docs/. Anything here can go stale when a spec changes.
PROSE = [
    "README.md", "CONTRIBUTING.md", "CLAUDE.md", "index.md", "support.md",
    "Inkover/Inkover/Resources/Base.lproj/Main.html", "extension/manifest.json", "dev/harness.html",
]

FM_RE = re.compile(r"^---\n(.*?)\n---\n", re.S)
LINK_RE = re.compile(r"\[\[([^\]|#]+)")
CODE_RE = re.compile(r"```.*?```|`[^`\n]*`", re.S)  # links inside code are not links


def frontmatter(text):
    m = FM_RE.match(text)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        value = value.split("#", 1)[0].strip()
        fm[key.strip()] = value
    return fm


def title(text):
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return "(untitled)"


def collect(folder):
    rows = []
    for path in sorted(folder.glob("*.md")):
        text = path.read_text()
        fm = frontmatter(text)
        rows.append({
            "slug": path.stem,
            "id": fm.get("id", "?"),
            "status": fm.get("status", "?"),
            "updated": fm.get("updated") or fm.get("date", "?"),
            "title": title(text),
        })
    return sorted(rows, key=lambda r: r["id"])


def all_slugs():
    return {p.stem for p in DOCS.rglob("*.md")} | {p.stem for p in (ROOT / "_meta").glob("*.md")}


def broken_links():
    slugs = all_slugs()
    problems = []
    for path in list(DOCS.rglob("*.md")) + list((ROOT / "_meta").glob("*.md")):
        if path == INDEX:
            continue
        for target in LINK_RE.findall(CODE_RE.sub("", path.read_text())):
            if target.strip() not in slugs:
                problems.append((path.relative_to(ROOT), target))
    return problems


def blast(slug, words):
    """Print what a change to `slug` can reach. Exit 1 if the slug does not exist."""
    if slug not in all_slugs():
        print(f"no document named {slug}")
        return 1
    print(f"Blast radius of {slug}")
    print("\nLinks to it (re-read each; frontmatter depends/decisions/affects and body links):")
    hits = 0
    for path in sorted(list(DOCS.rglob("*.md")) + list((ROOT / "_meta").glob("*.md"))):
        if path == INDEX or path.stem == slug:
            continue
        if slug in LINK_RE.findall(CODE_RE.sub("", path.read_text())):
            print(f"  {path.relative_to(ROOT)}")
            hits += 1
    if not hits:
        print("  none")
    print("\nCode that cites it:")
    hits = 0
    for path in sorted((ROOT / "extension").glob("*.js")):
        for n, line in enumerate(path.read_text().splitlines(), 1):
            if f"{slug}.md" in line:
                print(f"  {path.relative_to(ROOT)}:{n}")
                hits += 1
    if not hits:
        print("  none")
    if words:
        pat = re.compile("|".join(re.escape(w) for w in words), re.I)
        print(f"\nProse using {', '.join(words)} (check each still tells the truth):")
        hits = 0
        for rel in PROSE + [str(p.relative_to(ROOT)) for p in sorted(DOCS.rglob("*.md")) if p != INDEX]:
            path = ROOT / rel
            if not path.exists():
                continue
            for n, line in enumerate(path.read_text().splitlines(), 1):
                if pat.search(line) and not line.startswith(("depends:", "decisions:", "affects:", "supersedes:")):
                    print(f"  {rel}:{n}: {line.strip()[:110]}")
                    hits += 1
        if not hits:
            print("  none")
    return 0


def table(rows, kind):
    out = [f"| {kind} | Id | Status | Updated |", "|---|---|---|---|"]
    for r in rows:
        out.append(f"| [{r['title']}]({kind.lower()}s/{r['slug']}.md) | {r['id']} | `{r['status']}` | {r['updated']} |")
    return "\n".join(out)


def main():
    features = collect(FEATURES)
    decisions = collect(DECISIONS)
    counts = {}
    for r in features:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    summary = ", ".join(f"{n} {s}" for s, n in sorted(counts.items()))

    body = "\n".join([
        "---",
        "type: index",
        f"generated: {date.today().isoformat()}",
        "---",
        "# Index",
        "",
        "GENERATED by `scripts/build-index.py`. Do not edit. Rebuild after any change under `docs/`.",
        "",
        f"Features: {summary}.",
        "",
        "## Features",
        "",
        table(features, "Feature"),
        "",
        "## Decisions",
        "",
        table(decisions, "Decision"),
        "",
    ])
    INDEX.write_text(body)
    print(f"wrote {INDEX.relative_to(ROOT)}: {len(features)} features, {len(decisions)} decisions")

    problems = broken_links()
    for path, target in problems:
        print(f"broken link in {path}: [[{target}]]")
    return 1 if problems else 0


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--blast":
        sys.exit(blast(sys.argv[2], sys.argv[3:]))
    sys.exit(main())
