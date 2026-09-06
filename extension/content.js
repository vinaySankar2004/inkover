// Inkover content script. Skeleton: sections match docs/architecture.md H2s.
// No feature is implemented yet. Each section names the spec that governs it.
// Status of every feature: docs/index.md.

(() => {
  "use strict";
  if (window.top !== window) return; // top frame only (architecture: Pieces)
  if (window.__inkover) return;
  window.__inkover = true;

  // ── Mode state machine ─────────────────────────────────────────────
  // Spec: docs/features/modes-and-lock.md
  const Mode = Object.freeze({ Off: "off", View: "view", Draw: "draw" });
  let mode = Mode.Off;

  function setMode(next) {
    // TODO F01: create/remove canvases and toolbar host, clear trail on leaving Draw.
    mode = next;
  }

  // ── Input routing ──────────────────────────────────────────────────
  // Spec: docs/features/pencil-input.md, modes-and-lock.md
  // TODO F02: window capture listeners for pointer* (pen only in Draw),
  //           touch* passive:false (stylus only in Draw), keydown (Escape, Cmd+Z).
  // TODO F01: iframe shields while in Draw.

  // ── Coordinates and rendering ──────────────────────────────────────
  // Spec: docs/features/pen.md, highlighter.md; architecture: Coordinates and rendering
  // TODO F03/F04: ink canvas + trail canvas, DPR scaling, visualViewport mapping,
  //               coalesced redraw via requestAnimationFrame.

  // ── Anchoring ──────────────────────────────────────────────────────
  // Spec: docs/features/anchoring.md
  // TODO F10: candidate walk, locator, resolve + text repair, visibility,
  //           MutationObserver + ResizeObserver, 100 ms re-resolve limit.

  // ── Storage ────────────────────────────────────────────────────────
  // Spec: docs/features/persistence.md
  // TODO F09: pageKey(), load before first draw, debounced save, pagehide flush,
  //           2,000-stroke cap, version check.

  // ── Tools ──────────────────────────────────────────────────────────
  // Spec: docs/features/pen.md, highlighter.md, eraser.md, trail.md
  // TODO F03 pen, F04 highlighter (hold-still snap), F05 eraser (stroke hit test),
  //      F06 trail (screen-space fade loop).

  // ── Undo / redo / clear ────────────────────────────────────────────
  // Spec: docs/features/undo-redo.md, clear.md
  // TODO F07/F08: entry types add | remove | clear, 200-entry cap, write-through.

  // ── Toolbar host ───────────────────────────────────────────────────
  // Spec: docs/features/toolbar.md
  // TODO F11: shadow root, collapsed/expanded, drag + edge snap, colours, sizes,
  //           notices, re-append on removal.

  // ── Messages from background ───────────────────────────────────────
  browser.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "inkover:toggle") {
      // TODO F01 rule 6: Off -> View if ink exists else Draw; anything -> Off.
      setMode(mode === Mode.Off ? Mode.Draw : Mode.Off);
    }
  });
})();
