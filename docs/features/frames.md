---
type: feature
id: F18
status: built
depends: ["[[modes-and-lock]]", "[[persistence]]", "[[anchoring]]", "[[undo-redo]]", "[[clear]]", "[[hide-ink]]", "[[toolbar]]"]
decisions: ["[[D0016-every-frame]]"]
updated: 2026-09-06
---
# Frames

## Purpose
Pages that show their content inside an iframe, claude.ai artifacts and embedded document viewers among them, get ink that attaches to the words inside the frame and scrolls with them. Without this, ink over a frame sticks to the frame's edge while the words move underneath. Mechanism in architecture, Frames.

## Behaviour
1. Inkover runs in the top frame and in every iframe with an http or https URL. Each frame draws its own ink on its own overlay.
2. Only the top frame has the toolbar. It owns the mode, the hidden state and the settings; every frame follows them at once.
3. A frame's ink is stored under its own page key: the parent's page key, then the frame's origin. See [[D0016-every-frame]].
4. Locked, a frame captures the Pencil and cancels touches inside itself, exactly as the top frame does. A parent never shields a frame that runs Inkover.
5. A frame without Inkover, for example about:blank or srcdoc, is shielded while Locked, and ink over it belongs to the parent, anchored to the frame element.
6. Undo and Redo act on whichever frame holds the newest entry, so the order across frames is the order the changes were made.
7. Clear empties every frame on the page. Each frame's clear is its own undo entry.
8. Hide hides ink in every frame. A stroke in any frame while hidden shows ink everywhere.
9. On load, a page opens Unlocked when the top frame or any frame has stored ink.
10. Escape, Cmd+Z and Shift+Cmd+Z work with the keyboard focus in any frame.
11. A notice raised in a frame, such as a full page, appears beside the toolbar.
12. Tip double-tap in a frame toggles the eraser for the whole page.

## Edge cases
| Situation | Expected |
|---|---|
| Frame finishes loading before the top frame | The frame keeps announcing itself until the top answers, then loads its ink. |
| Frame is added later, for example a lazy embed | It announces itself, receives the mode, and joins. |
| Frame navigates to a new URL | The new document joins on load. Its ink is looked up under its new origin. |
| Same origin embedded twice on one page | Both frames share one ink store. Accepted. |
| Artifact is republished at a new path | Same origin, same ink. Repair by text re-attaches strokes to unchanged paragraphs. |
| Top page navigates in place to a new page key | Every frame switches to the key derived from the new one. |
| Frame nested inside another frame | The same rules apply at each level. Its key chains through each parent. |
| Frame is 1 px, hidden or off screen | It runs but receives no input. Nothing to draw. |
| Pinch zoom on the top page | Frame overlays scale with their frames. |
| Frame shows a PDF | Safari's PDF view is not a web page. The frame is shielded, rule 5. |
| Page removes a frame while it holds ink | Its ink stays in storage under its key. It returns when a frame of that origin returns. |

## Acceptance
- [ ] On a claude.ai artifact: Lock, circle a phrase, Unlock, scroll the artifact: the circle stays on the phrase.
- [ ] Reload the artifact page: it opens Unlocked with the ink in place.
- [ ] Draw in the artifact and on the surrounding page, Undo twice: both strokes go, newest first.
- [ ] Clear: the page and the artifact are both empty. Undo restores both.
- [ ] Hide: ink in the artifact hides too. Draw in the artifact: everything shows.
- [ ] Locked, rest the palm on the artifact and write: nothing scrolls inside it.
- [ ] On a page with a YouTube embed: Locked, the Pencil over the embed draws inside it; Unlocked, the embed plays.
- [ ] With a Magic Keyboard and focus inside the artifact, Escape unlocks.
