---
type: decision
id: D0016
status: accepted
date: 2026-09-06
affects: ["[[frames]]", "[[modes-and-lock]]", "[[persistence]]", "[[anchoring]]"]
supersedes: []
---
# D0016: Every frame runs Inkover; the top frame owns the toolbar and the mode

## Context
Inkover ran in the top frame only. Ink over an iframe anchored to the frame element, so on claude.ai artifacts and embedded viewers the words scrolled under the ink. Two ways out: document it as a limit, or inject into every frame. A single overlay in the top frame fed by frame geometry is not possible across origins.

## Decision
The manifest injects into all frames. Each frame owns its overlay, ink, anchors and input capture. The top frame alone owns the toolbar, mode, hidden state and settings. Frames talk through postMessage: a child announces itself to its parent, the top broadcasts down the tree. A frame's page key is its parent's page key, a separator, and the frame's origin. The frame URL's path and query are ignored because frame URLs carry per-load tokens.

## Consequences
- Shields stay only for frames that cannot run the script.
- Undo needs one order across the page. Entries carry a time and the top routes each Undo to the frame with the newest entry.
- Two same-origin frames on one page share an ink store. Accepted.
- The background script is unchanged. The Safari button message reaches every frame and only the top acts on it.
- A republished artifact keeps its ink; a different artifact never sees it, because each artifact has its own origin.
- [[D0010-page-key]] still defines the top frame's key. This decision only adds the rule for frames.
