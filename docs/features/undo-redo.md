---
type: feature
id: F07
status: specified
depends: ["[[persistence]]"]
decisions: []
updated: 2026-09-05
---
# Undo and redo

## Purpose
Every change to ink can be taken back and put back again.

## Behaviour
1. Undo entries are: add a stroke, remove strokes, clear the page. One gesture is one entry.
2. Undo and Redo are toolbar buttons. Cmd+Z and Shift+Cmd+Z work with a hardware keyboard in View and Draw.
3. A new entry after an undo discards the redo stack.
4. The stack holds the last 200 entries per page per tab session. It is not persisted. Reload empties it.
5. Each button is disabled when its stack is empty.
6. Undo and redo write through to [[persistence]] like any other change.

## Edge cases
| Situation | Expected |
|---|---|
| Undo an add whose anchor has since vanished | The stroke is removed from ink. Nothing visible changes. Redo restores it, still hidden. |
| Undo a Clear on a page with 800 strokes | All 800 return in one step. |
| Cmd+Z while a page text field is focused | The page's own undo runs. Inkover only handles the shortcut when nothing on the page is focused. |
| Same page open in two tabs | Independent stacks. Both write to the same stored ink; the last save wins. |
| 201st entry | The oldest entry is dropped. |

## Acceptance
- [ ] Draw three strokes, undo three times, redo three times: identical to the start.
- [ ] Clear, then undo: everything returns.
