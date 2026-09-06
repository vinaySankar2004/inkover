// Inkover content script. Sections match the H2s in docs/architecture.md.
// Behaviour rules cite their spec as docs/features/<slug>.md rule N.

(() => {
  "use strict";
  if (window.top !== window) return; // top frame only (architecture: Pieces)
  if (window.__inkover) return;
  window.__inkover = true;
  if (!document.body) return;

  const DEV = window.__inkoverDev === true; // dev harness: mouse acts as the Pencil
  const api = typeof browser !== "undefined" ? browser : (typeof chrome !== "undefined" ? chrome : null);
  if (!api || !api.storage || !api.runtime) return;

  // ── Constants ──────────────────────────────────────────────────────────

  const Mode = Object.freeze({ Off: "off", Unlocked: "unlocked", Locked: "locked" }); // modes-and-lock.md rule 1
  const Tool = Object.freeze({ Pen: "pen", Highlighter: "highlighter", Eraser: "eraser", Trail: "trail", Spotlight: "spotlight" });

  const PEN_COLORS = { black: "#1c1c1e", white: "#ffffff", red: "#ff3b30", orange: "#ff9500", blue: "#007aff", green: "#34c759" }; // toolbar.md rule 9
  const HL_COLORS = { yellow: "#ffd60a", green: "#30d158", pink: "#ff2d55", blue: "#0a84ff" };
  const WIDTH = { // pen.md rule 3, highlighter.md rule 2, reading-spotlight.md rule 3
    pen: { min: 1, max: 12, step: 0.5, def: 3 },
    highlighter: { min: 8, max: 40, step: 1, def: 20 },
    spotlight: { min: 40, max: 200, step: 4, def: 80 },
  };
  const PEN_BASE = { s: 1.5, m: 3, l: 6 };      // legacy size keys, for ink and settings saved before widths were numbers
  const HL_WIDTH = { s: 12, m: 20, l: 32 };
  const SPOT_BAND = { s: 48, m: 80, l: 140 };
  const HL_ALPHA = 0.35;                         // highlighter.md rule 3
  const HEX = /^#[0-9a-f]{6}$/i;

  // A colour is a palette key or a hex string from the picker. Pen and Highlighter palettes reuse names.
  function colorHex(tool, c) {
    const pal = tool === Tool.Highlighter ? HL_COLORS : PEN_COLORS;
    if (pal[c]) return pal[c];
    if (HEX.test(c || "")) return c;
    return tool === Tool.Highlighter ? HL_COLORS.yellow : PEN_COLORS.black;
  }
  const SPOT_DIM = 0.7;                          // reading-spotlight.md rule 2
  const SPOT_FEATHER = 16;                       // reading-spotlight.md rule 4
  const LIMITS = { strokes: 2000, points: 5000, undo: 200 };
  const HOLD = { travel: 20, jitter: 6, ms: 500 }; // highlighter.md rule 7
  const ERASER_REACH = 12;                       // eraser.md rule 2
  const TRAIL_TTL = 800;                         // trail.md rule 2
  const SCRIBBLE = { step: 8, reversals: 5, swing: 0.6, ratio: 2.5, cover: 0.4 }; // scribble-to-erase.md rules 2 to 4
  const MARK_ALPHA = 0.3;                        // scribble-to-erase.md rule 4
  const STORAGE_VERSION = 1;
  const SAVE_DEBOUNCE = 500;                     // persistence.md rule 2
  const REPAIR_INTERVAL = 100;                   // anchoring.md edge case: re-resolution limit
  const TOGGLE_GUARD = 300;                      // modes-and-lock.md edge case
  const TAP = { ms: 250, move: 6, gap: 350, apart: 30 }; // tip-double-tap.md rule 1
  const MEDIA_TAGS = new Set(["IMG", "VIDEO", "CANVAS", "SVG", "PICTURE", "IFRAME", "OBJECT", "EMBED"]);
  const TAU = Math.PI * 2;

  // ── State ──────────────────────────────────────────────────────────────

  const defaultSettings = () => ({
    tool: Tool.Pen, prevTool: Tool.Pen,
    penColor: "black", hlColor: "yellow",
    penWidth: WIDTH.pen.def, hlWidth: WIDTH.highlighter.def, spotBand: WIDTH.spotlight.def,
    customPen: null, customHl: null,   // toolbar.md rule 9: one custom colour per tool, hex or null
    labels: true, compact: false,
    toolbar: { edge: "bottom", along: 1 },
  });

  const state = {
    mode: Mode.Off,
    hidden: false,          // hide-ink.md
    strokes: [],
    undo: [],
    redo: [],
    settings: defaultSettings(),
    pageKey: pageKey(),
    fullscreen: false,
    toggleAt: 0,
  };

  function pageKey() { return location.origin + location.pathname + location.search; } // D0010
  const inkKey = (key) => "ink:" + key;

  // ── Storage ────────────────────────────────────────────────────────────

  let saveTimer = 0;
  let saveFailedNoticed = false;

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, SAVE_DEBOUNCE);
  }

  function flushSave() {
    clearTimeout(saveTimer);
    saveTimer = 0;
    const payload = { v: STORAGE_VERSION, strokes: state.strokes };
    Promise.resolve(api.storage.local.set({ [inkKey(state.pageKey)]: payload })).catch(() => {
      if (saveFailedNoticed) return;
      saveFailedNoticed = true;
      notice("Could not save ink on this page.");
    });
  }

  function saveSettings() {
    Promise.resolve(api.storage.local.set({ settings: state.settings })).catch(() => {});
  }

  async function loadInk(key) {
    const result = (await api.storage.local.get([inkKey(key)])) || {};
    const data = result[inkKey(key)];
    if (!data) return [];
    if (data.v !== STORAGE_VERSION) {
      notice("Ink on this page was saved by a newer Inkover.");
      return [];
    }
    return Array.isArray(data.strokes) ? data.strokes.filter(validStroke).map(normalizeStroke) : [];
  }

  function validStroke(s) {
    return s && typeof s.id === "string" && Array.isArray(s.points) && s.points.length > 0 && s.anchor && typeof s.anchor.kind === "string";
  }

  // Ink saved before widths were numbers carries a size key. Give it the width that key meant.
  function normalizeStroke(s) {
    if (typeof s.width !== "number" || !(s.width > 0)) {
      s.width = s.tool === Tool.Highlighter ? (HL_WIDTH[s.size] || WIDTH.highlighter.def) : (PEN_BASE[s.size] || WIDTH.pen.def);
    }
    delete s.size;
    return s;
  }

  // ── Viewport ───────────────────────────────────────────────────────────

  const vp = { scale: 1, ox: 0, oy: 0, w: 0, h: 0, sx: 0, sy: 0, dpr: 1 };

  function readViewport() {
    const vv = window.visualViewport;
    vp.scale = vv && vv.scale ? vv.scale : 1;
    vp.ox = vv ? vv.offsetLeft : 0;
    vp.oy = vv ? vv.offsetTop : 0;
    vp.w = vv ? vv.width : window.innerWidth;
    vp.h = vv ? vv.height : window.innerHeight;
    vp.sx = window.scrollX;
    vp.sy = window.scrollY;
    vp.dpr = window.devicePixelRatio || 1;
  }

  const kFactor = () => vp.scale * vp.dpr;
  const clientToDoc = (cx, cy) => [cx + vp.sx, cy + vp.sy];
  const clientToScreen = (cx, cy) => [(cx - vp.ox) * vp.scale, (cy - vp.oy) * vp.scale];
  const docWidth = () => Math.max(document.documentElement.scrollWidth, window.innerWidth);

  // ── Overlay DOM ────────────────────────────────────────────────────────

  let inkCanvas = null, fxCanvas = null, inkCtx = null, fxCtx = null;
  let host = null;
  const shields = [];

  function isOwn(node) {
    return node === host || node === inkCanvas || node === fxCanvas || (node instanceof Element && node.classList.contains("inkover-shield"));
  }

  function ensureDom() {
    if (inkCanvas) return;
    inkCanvas = document.createElement("canvas");
    inkCanvas.className = "inkover-canvas";
    fxCanvas = document.createElement("canvas");
    fxCanvas.className = "inkover-canvas";
    inkCtx = inkCanvas.getContext("2d");
    fxCtx = fxCanvas.getContext("2d");
    document.documentElement.append(inkCanvas, fxCanvas);
    buildToolbar();
    applyFullscreen();
    readViewport();
    layoutCanvases();
  }

  function removeDom() {
    clearShields();
    if (inkCanvas) inkCanvas.remove();
    if (fxCanvas) fxCanvas.remove();
    if (host) host.remove();
    inkCanvas = fxCanvas = inkCtx = fxCtx = host = null;
    ui.root = null;
  }

  function layoutCanvases() {
    if (!inkCanvas) return false;
    const W = Math.max(1, Math.round(vp.w * vp.scale * vp.dpr));
    const H = Math.max(1, Math.round(vp.h * vp.scale * vp.dpr));
    let resized = false;
    for (const c of [inkCanvas, fxCanvas]) {
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; resized = true; }
      c.style.setProperty("width", vp.w + "px", "important");
      c.style.setProperty("height", vp.h + "px", "important");
      c.style.setProperty("transform", `translate(${vp.ox}px, ${vp.oy}px)`, "important");
    }
    return resized;
  }

  function applyFullscreen() { // modes-and-lock.md edge case: fullscreen video
    state.fullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    for (const el of [inkCanvas, fxCanvas, host]) if (el) el.classList.toggle("inkover-hidden", state.fullscreen);
  }

  // ── Mode state machine ─────────────────────────────────────────────────

  const isOn = () => state.mode !== Mode.Off;

  function setMode(next) {
    if (next === state.mode) return;
    const prev = state.mode;
    state.mode = next;
    if (next === Mode.Off) {
      cancelLive();
      trail.length = 0;
      pageTouches.clear();
      removeDom();
      return;
    }
    if (prev === Mode.Off) { ensureDom(); ui.collapsed = false; }
    // Unlocked and Locked share the overlay; a stroke in progress survives an Unlock tapped by a finger.
    updateToolbar();
    requestRender();
    requestFx();
  }

  function toggleFromButton() { // modes-and-lock.md rule 8
    const now = performance.now();
    if (now - state.toggleAt < TOGGLE_GUARD) return;
    state.toggleAt = now;
    setMode(isOn() ? Mode.Off : Mode.Locked); // modes-and-lock.md rule 7
  }

  function toggleLock() { // modes-and-lock.md rule 6
    if (!isOn()) return;
    if (state.mode === Mode.Locked) {
      setMode(Mode.Unlocked);
      // Safari settles scrolling once per touch sequence. A palm still resting was cancelled while
      // Locked, so nothing scrolls until everything lifts. modes-and-lock.md edge case.
      notice(pageTouches.size ? "Unlocked. Lift your hand, then scroll." : "Unlocked. Pencil and finger browse.");
    } else {
      setMode(Mode.Locked);
      notice("Locked. The Pencil draws.");
    }
  }

  // ── Input routing ──────────────────────────────────────────────────────

  let activePointer = null;

  function isPen(e) { return e.pointerType === "pen" || (DEV && e.pointerType === "mouse"); }
  function isHand(e) { return e.pointerType === "touch"; }
  function onToolbar(e) { return !!host && e.composedPath().includes(host); }

  function swallow(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  // Nothing below captures anything unless the mode is Locked. modes-and-lock.md rules 3 to 5.
  const locked = () => state.mode === Mode.Locked && !state.fullscreen;

  function onPointerDown(e) {
    if (!locked() || onToolbar(e)) return;
    if (isHand(e)) { swallow(e); return; }
    if (!isPen(e)) return;
    if (DEV && e.button !== 0) return;
    swallow(e);
    suppressClickUntil = performance.now() + 1500;
    if (activePointer !== null) return; // pen.md edge case: first pointer only
    activePointer = e.pointerId;
    beginStroke(e);
  }

  function onPointerMove(e) {
    if (locked() && isHand(e) && !onToolbar(e)) { swallow(e); return; }
    if (activePointer === null || e.pointerId !== activePointer) return;
    swallow(e);
    if (onToolbar(e)) { activePointer = null; endStroke(e, false); return; }
    const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    if (events.length) for (const ce of events) extendStroke(ce);
    else extendStroke(e);
  }

  function onPointerUp(e) {
    if (locked() && isHand(e) && !onToolbar(e)) { swallow(e); return; }
    if (activePointer === null || e.pointerId !== activePointer) return;
    swallow(e);
    activePointer = null;
    endStroke(e, false);
  }

  function onPointerCancel(e) {
    if (activePointer === null || e.pointerId !== activePointer) return;
    activePointer = null;
    endStroke(e, true); // pencil-input.md rule 6
  }

  let suppressClickUntil = 0;

  function onClick(e) { // modes-and-lock.md rules 4 and 5: nothing captured ever reaches the page
    if (!locked() || onToolbar(e)) return;
    if (isPen(e) || isHand(e) || performance.now() < suppressClickUntil) swallow(e);
  }

  const pageTouches = new Set(); // identifiers of touches currently on the page, toolbar excluded

  function onTouch(e) { // pencil-input.md rules 8 and 9: while Locked, no touch scrolls and page scripts see none
    if (!isOn() || state.fullscreen) return;
    if (host && e.composedPath().includes(host)) return;
    for (const t of e.changedTouches) { if (e.type === "touchstart") pageTouches.add(t.identifier); else if (e.type !== "touchmove") pageTouches.delete(t.identifier); }
    if (locked()) swallow(e);
  }

  function onKey(e) { // undo-redo.md rule 2
    if (!isOn()) return;
    const ae = document.activeElement;
    if (ae && ae !== document.body && ae !== document.documentElement && ae !== host) return;
    if (e.key === "Escape") { // modes-and-lock.md rule 9
      if (state.mode === Mode.Locked) { e.preventDefault(); toggleLock(); }
      return;
    }
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    }
  }

  function pressureOf(e) { // pencil-input.md rules 2 and 3
    if (DEV && e.pointerType === "mouse") return 0.5;
    const p = typeof e.pressure === "number" ? e.pressure : 0;
    return p > 0 ? Math.min(1, p) : 0.5;
  }

  // ── Iframe shields ─────────────────────────────────────────────────────

  function updateShields() {
    if (!locked()) { clearShields(); return; } // Unlocked, iframes are native
    let i = 0;
    for (const f of document.querySelectorAll("iframe, embed, object")) {
      const r = f.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom < 0 || r.right < 0 || r.top > window.innerHeight || r.left > window.innerWidth) continue;
      let sh = shields[i];
      if (!sh) {
        sh = document.createElement("div");
        sh.className = "inkover-shield";
        document.documentElement.appendChild(sh);
        shields[i] = sh;
      }
      sh.style.setProperty("left", r.left + "px", "important");
      sh.style.setProperty("top", r.top + "px", "important");
      sh.style.setProperty("width", r.width + "px", "important");
      sh.style.setProperty("height", r.height + "px", "important");
      i++;
    }
    for (let j = i; j < shields.length; j++) shields[j].remove();
    shields.length = i;
  }

  function clearShields() {
    for (const sh of shields) sh.remove();
    shields.length = 0;
  }

  // ── Stroke geometry ────────────────────────────────────────────────────

  function penWidth(base, p) { return base * (0.55 + 1.0 * p); } // pen.md rule 2

  function strokeWidth(s) {
    if (s.tool === Tool.Highlighter) return s.width;
    let max = 0;
    for (const p of s.points) if (p[2] > max) max = p[2];
    return penWidth(s.width, max);
  }

  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function padBox(b, pad) { return { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 }; }
  function intersects(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  // Path2D in the coordinate space of pts. pts: [x, y, pressure].
  function buildPath(tool, width, pts, straight) {
    const path = new Path2D();
    if (!pts.length) return path;
    if (tool === Tool.Highlighter) {
      const first = pts[0], last = pts[pts.length - 1];
      path.moveTo(first[0], first[1]);
      if (straight || pts.length === 1) {
        path.lineTo(last[0] + (pts.length === 1 ? 0.01 : 0), last[1]);
        return path;
      }
      for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        path.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      }
      path.lineTo(last[0], last[1]);
      return path;
    }
    return outlinePath(pts, width);
  }

  // Filled outline with per-point width and round caps. pen.md rules 2, 4, 6.
  function outlinePath(pts, base) {
    const path = new Path2D();
    const P = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = P[P.length - 1], b = pts[i];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) >= 0.75 || i === pts.length - 1) P.push(b);
    }
    const m = P.length;
    if (m === 1 || (m === 2 && Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]) < 0.5)) {
      path.arc(P[0][0], P[0][1], penWidth(base, P[0][2]) / 2, 0, TAU);
      return path;
    }
    const left = new Array(m), right = new Array(m), tan = new Array(m);
    for (let i = 0; i < m; i++) {
      const prev = P[Math.max(0, i - 1)], next = P[Math.min(m - 1, i + 1)];
      let tx = next[0] - prev[0], ty = next[1] - prev[1];
      const len = Math.hypot(tx, ty) || 1;
      tx /= len; ty /= len;
      tan[i] = [tx, ty];
      const r = penWidth(base, P[i][2]) / 2;
      left[i] = [P[i][0] - ty * r, P[i][1] + tx * r];
      right[i] = [P[i][0] + ty * r, P[i][1] - tx * r];
    }
    path.moveTo(left[0][0], left[0][1]);
    smoothAlong(path, left, false);
    capArc(path, P[m - 1], left[m - 1], right[m - 1], tan[m - 1]);
    smoothAlong(path, right, true);
    capArc(path, P[0], right[0], left[0], [-tan[0][0], -tan[0][1]]);
    path.closePath();
    return path;
  }

  function smoothAlong(path, arr, reverse) {
    const n = arr.length;
    const at = (i) => arr[reverse ? n - 1 - i : i];
    if (n < 3) { for (let i = 1; i < n; i++) path.lineTo(at(i)[0], at(i)[1]); return; }
    for (let i = 1; i < n - 1; i++) {
      const a = at(i), b = at(i + 1);
      path.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    const l = at(n - 1);
    path.lineTo(l[0], l[1]);
  }

  function capArc(path, c, from, to, tipDir) {
    const r = Math.hypot(from[0] - c[0], from[1] - c[1]);
    if (r <= 0) return;
    const a0 = Math.atan2(from[1] - c[1], from[0] - c[0]);
    const a1 = Math.atan2(to[1] - c[1], to[0] - c[0]);
    const am = Math.atan2(tipDir[1], tipDir[0]);
    const norm = (a) => ((a % TAU) + TAU) % TAU;
    const anticlockwise = norm(am - a0) > norm(a1 - a0);
    path.arc(c[0], c[1], r, a0, a1, anticlockwise);
  }

  // Distance from point to polyline, in the polyline's coordinate space.
  function distToPolyline(pts, x, y) {
    if (pts.length === 1) return Math.hypot(pts[0][0] - x, pts[0][1] - y);
    let best = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], ay = pts[i][1], bx = pts[i + 1][0], by = pts[i + 1][1];
      const dx = bx - ax, dy = by - ay;
      const l2 = dx * dx + dy * dy;
      let t = l2 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const d = Math.hypot(ax + t * dx - x, ay + t * dy - y);
      if (d < best) best = d;
    }
    return best;
  }

  // ── Shape snap ─────────────────────────────────────────────────────────
  // shape-snap.md rules 3 to 7; highlighter.md rule 8 for the line case.

  function classifyShape(pts, allowClosed) {
    if (pts.length < 3) return null;
    const b = bbox(pts);
    const long = Math.max(b.w, b.h), short = Math.min(b.w, b.h);
    const first = pts[0], last = pts[pts.length - 1];
    if (long >= 5 * Math.max(short, 1)) {
      const dx = last[0] - first[0], dy = last[1] - first[1];
      const L = Math.hypot(dx, dy) || 1;
      let maxd = 0;
      for (const p of pts) {
        const d = Math.abs((p[0] - first[0]) * dy - (p[1] - first[1]) * dx) / L;
        if (d > maxd) maxd = d;
      }
      if (maxd <= 0.08 * long) return "line";
    }
    if (!allowClosed || short < 10) return null;
    const perimeter = 2 * (b.w + b.h);
    if (Math.hypot(last[0] - first[0], last[1] - first[1]) > 0.2 * perimeter) return null;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, a = b.w / 2, bb = b.h / 2;
    let eErr = 0, rSum = 0, rNear = 0;
    const tol = 0.05 * short;
    for (const p of pts) {
      const ex = (p[0] - cx) / a, ey = (p[1] - cy) / bb;
      eErr += Math.abs(ex * ex + ey * ey - 1);
      const d = Math.min(p[0] - b.x, b.x + b.w - p[0], p[1] - b.y, b.y + b.h - p[1]);
      rSum += d;
      if (d <= tol) rNear++;
    }
    eErr /= pts.length;
    const rErr = rSum / pts.length;
    const ellipseOk = eErr <= 0.25;
    const rectOk = rErr <= tol && rNear / pts.length >= 0.7;
    if (ellipseOk && rectOk) return rErr / tol < eErr / 0.25 ? "rect" : "ellipse";
    if (rectOk) return "rect";
    if (ellipseOk) return "ellipse";
    return null;
  }

  function shapePoints(kind, pts) { // shape-snap.md rule 10
    const b = bbox(pts);
    let p = 0;
    for (const q of pts) p += q[2];
    p /= pts.length;
    if (kind === "line") {
      const f = pts[0], l = pts[pts.length - 1];
      return [[f[0], f[1], p], [l[0], l[1], p]];
    }
    if (kind === "rect") {
      return [[b.x, b.y, p], [b.x + b.w, b.y, p], [b.x + b.w, b.y + b.h, p], [b.x, b.y + b.h, p], [b.x, b.y, p]];
    }
    const out = [];
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * TAU;
      out.push([cx + (b.w / 2) * Math.cos(t), cy + (b.h / 2) * Math.sin(t), p]);
    }
    return out;
  }

  // ── Scribble detection ─────────────────────────────────────────────────
  // scribble-to-erase.md rules 2 and 3.

  function newScribbleTracker(x, y) {
    return { x0: x, y0: y, x1: x, y1: y, len: 0, lx: x, ly: y, dirX: 0, dirY: 0, extX: x, extY: y, fromX: x, fromY: y, swingsX: [], swingsY: [], detected: false };
  }

  // A swing is the travel along one axis between two reversals. Handwriting has swings too,
  // but they are short compared to the letter's width; a scribble-out sweeps the whole width every time.
  function scribbleStep(t, x, y) {
    t.len += Math.hypot(x - t.lx, y - t.ly);
    t.lx = x; t.ly = y;
    if (x < t.x0) t.x0 = x; if (x > t.x1) t.x1 = x;
    if (y < t.y0) t.y0 = y; if (y > t.y1) t.y1 = y;
    const axis = (v, dirKey, extKey, fromKey, swings) => {
      const dir = t[dirKey], ext = t[extKey];
      if (dir === 0) {
        if (Math.abs(v - ext) >= SCRIBBLE.step) { t[dirKey] = v > ext ? 1 : -1; t[extKey] = v; }
        return;
      }
      if (dir > 0) {
        if (v > ext) t[extKey] = v;
        else if (ext - v >= SCRIBBLE.step) { swings.push(Math.abs(ext - t[fromKey])); t[fromKey] = ext; t[dirKey] = -1; t[extKey] = v; }
      } else {
        if (v < ext) t[extKey] = v;
        else if (v - ext >= SCRIBBLE.step) { swings.push(Math.abs(ext - t[fromKey])); t[fromKey] = ext; t[dirKey] = 1; t[extKey] = v; }
      }
    };
    axis(x, "dirX", "extX", "fromX", t.swingsX);
    axis(y, "dirY", "extY", "fromY", t.swingsY);
    if (!t.detected) {
      const w = t.x1 - t.x0, h = t.y1 - t.y0;
      const fullX = t.swingsX.filter((s) => s >= SCRIBBLE.swing * w).length;
      const fullY = t.swingsY.filter((s) => s >= SCRIBBLE.swing * h).length;
      if (Math.max(fullX, fullY) >= SCRIBBLE.reversals && t.len >= SCRIBBLE.ratio * Math.max(w + h, 1)) t.detected = true;
    }
    return t.detected;
  }

  // ── Anchoring ──────────────────────────────────────────────────────────
  // anchoring.md; mechanism in architecture.md, Anchoring.

  let rectEpoch = 1;
  let rectCache = new Map();          // element -> { epoch, rect }
  const resolveCache = new Map();     // stroke id -> element | null
  const geoCache = new Map();         // stroke id -> { key, pts, path, box }
  let repairWindowStart = 0;  // start of the current repair window
  let repairSpent = 0;        // ms of scanning spent in that window
  const REPAIR_BUDGET = 3;    // ms of scanning allowed per window
  let repairDeferred = false; // a stroke was skipped this frame for lack of budget
  const ro = new ResizeObserver(() => { bumpEpoch(); requestRender(); });

  function bumpEpoch() {
    rectEpoch++;
    rectCache = new Map();
  }

  function invalidateResolutions() {
    resolveCache.clear();
    ro.disconnect();
  }

  function leadingText(el, limit) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let out = "";
    let node;
    while ((node = walker.nextNode()) && out.length < limit * 2) out += node.nodeValue + " ";
    return out.replace(/\s+/g, " ").trim().slice(0, limit);
  }

  function isBlockCandidate(el) {
    if (MEDIA_TAGS.has(el.tagName)) {
      const r = el.getBoundingClientRect();
      return r.width >= 16 && r.height >= 16;
    }
    const display = getComputedStyle(el).display;
    if (display.startsWith("inline") || display === "contents") return false;
    const r = el.getBoundingClientRect();
    if (r.height < 16 || r.width < 16) return false;
    return leadingText(el, 8).length > 0;
  }

  function findAnchor(clientX, clientY) { // anchoring.md rule 1
    let el = null;
    for (const e of document.elementsFromPoint(clientX, clientY)) {
      if (!isOwn(e)) { el = e; break; }
    }
    while (el && el !== document.body && el !== document.documentElement) {
      if (isBlockCandidate(el)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function uniqueId(el) { return el.id && document.getElementById(el.id) === el; }

  function locatorFor(el) {
    const text = leadingText(el, 60);
    const tag = el.tagName;
    if (uniqueId(el)) return { kind: "id", value: el.id, tag, text };
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body) {
      const parent = cur.parentElement;
      if (!parent) break;
      if (uniqueId(cur)) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      let idx = 0;
      for (const sib of parent.children) { if (sib.tagName === cur.tagName) { idx++; if (sib === cur) break; } }
      parts.unshift(cur.tagName.toLowerCase() + ":nth-of-type(" + idx + ")");
      cur = parent;
    }
    if (!parts.length || !parts[0].startsWith("#")) parts.unshift("body");
    return { kind: "path", value: parts.join(" > "), tag, text };
  }

  function lookup(a) {
    try {
      return a.kind === "id" ? document.getElementById(a.value) : document.querySelector(a.value);
    } catch (_) { return null; }
  }

  function textMatches(el, a) {
    if (!a.text) return true;
    return leadingText(el, 60).startsWith(a.text.slice(0, 30));
  }

  function repair(a) { // anchoring.md rule 6
    if (!a.text || a.text.length < 8 || !a.tag) return null;
    const now = performance.now();
    if (now - repairWindowStart >= REPAIR_INTERVAL) { repairWindowStart = now; repairSpent = 0; }
    if (repairSpent >= REPAIR_BUDGET) { repairDeferred = true; return undefined; } // budget used; retried next window
    const prefix = a.text.slice(0, 30);
    let found = null;
    for (const el of document.getElementsByTagName(a.tag)) {
      if (leadingText(el, 60).startsWith(prefix)) { found = el; break; }
    }
    repairSpent += performance.now() - now;
    return found;
  }

  function resolveAnchor(s) {
    if (resolveCache.has(s.id)) return resolveCache.get(s.id);
    const a = s.anchor;
    let el = lookup(a);
    if (el && !textMatches(el, a)) el = null;
    if (!el) {
      const fixed = repair(a);
      if (fixed === undefined) return null; // rate limited; not cached, retried next frame
      el = fixed;
      if (el) {
        const loc = locatorFor(el);
        a.kind = loc.kind; a.value = loc.value; a.tag = loc.tag; a.text = loc.text;
        scheduleSave();
      }
    }
    resolveCache.set(s.id, el);
    if (el) ro.observe(el);
    return el;
  }

  function anchorRect(el) { // anchoring.md rule 4
    const c = rectCache.get(el);
    if (c) return c;
    let rect = null;
    if (el.isConnected && (typeof el.checkVisibility !== "function" || el.checkVisibility())) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) rect = { left: r.left + vp.sx, top: r.top + vp.sy, width: r.width, height: r.height };
    }
    rectCache.set(el, rect);
    return rect;
  }

  function placeStroke(s) { // anchoring.md rules 2, 3, 7
    let rect;
    if (s.anchor.kind === "root") rect = { left: 0, top: 0, width: docWidth() };
    else {
      const el = resolveAnchor(s);
      if (!el) return null;
      rect = anchorRect(el);
      if (!rect) return null;
    }
    const key = rect.left + "," + rect.top + "," + rect.width;
    let g = geoCache.get(s.id);
    if (!g || g.key !== key) {
      const sx = s.anchor.width > 0 ? rect.width / s.anchor.width : 1;
      const pts = s.points.map((p) => [rect.left + p[0] * sx, rect.top + p[1], p[2]]);
      g = { key, pts, path: buildPath(s.tool, s.width, pts, s.straight), box: padBox(bbox(pts), strokeWidth(s) + 1) };
      geoCache.set(s.id, g);
    }
    return g;
  }

  function anchorFor(el, docPts) {
    if (el && el.isConnected) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        const loc = locatorFor(el);
        const left = r.left + vp.sx, top = r.top + vp.sy;
        return {
          anchor: { kind: loc.kind, value: loc.value, tag: loc.tag, text: loc.text, width: r.width },
          points: docPts.map((p) => [round1(p[0] - left), round1(p[1] - top), round2(p[2])]),
        };
      }
    }
    return {
      anchor: { kind: "root", value: "", tag: "", text: "", width: docWidth() },
      points: docPts.map((p) => [round1(p[0]), round1(p[1]), round2(p[2])]),
    };
  }

  const round1 = (v) => Math.round(v * 10) / 10;
  const round2 = (v) => Math.round(v * 100) / 100;

  const mo = new MutationObserver((records) => {
    if (host && !host.isConnected && state.mode !== Mode.Off) document.body.appendChild(host); // toolbar.md edge case
    let relevant = false;
    for (const r of records) { if (!isOwn(r.target)) { relevant = true; break; } }
    if (!relevant) return;
    bumpEpoch();
    invalidateResolutions();
    requestRender();
  });

  // ── Hit testing ────────────────────────────────────────────────────────

  function hitStrokes(x, y) { // eraser.md rules 2, 3, 5
    if (state.hidden) return [];
    const out = [];
    const base = ERASER_REACH / vp.scale;
    for (const s of state.strokes) {
      const g = placeStroke(s);
      if (!g) continue;
      const reach = base + strokeWidth(s) / 2;
      if (x < g.box.x - reach || x > g.box.x + g.box.w + reach || y < g.box.y - reach || y > g.box.y + g.box.h + reach) continue;
      if (distToPolyline(g.pts, x, y) <= reach) out.push(s);
    }
    return out;
  }

  // ── Ink model, undo, clear ─────────────────────────────────────────────

  function inkChanged() {
    bumpEpoch();
    scheduleSave();
    requestRender();
    updateToolbar();
  }

  function pushUndo(entry) { // undo-redo.md rules 1, 3, 4
    state.undo.push(entry);
    if (state.undo.length > LIMITS.undo) state.undo.shift();
    state.redo.length = 0;
  }

  function addStrokes(list) {
    const ids = new Set(state.strokes.map((s) => s.id));
    for (const s of list) if (!ids.has(s.id)) state.strokes.push(s);
    state.strokes.sort((a, b) => a.created - b.created);
  }

  function removeStrokes(list) {
    const ids = new Set(list.map((s) => s.id));
    state.strokes = state.strokes.filter((s) => !ids.has(s.id));
    for (const id of ids) { geoCache.delete(id); resolveCache.delete(id); }
  }

  function applyEntry(entry, forward) {
    const adding = (entry.type === "add") === forward;
    if (adding) addStrokes(entry.strokes); else removeStrokes(entry.strokes);
    inkChanged();
  }

  function undo() {
    const e = state.undo.pop();
    if (!e) return;
    applyEntry(e, false);
    state.redo.push(e);
    updateToolbar();
  }

  function redo() {
    const e = state.redo.pop();
    if (!e) return;
    applyEntry(e, true);
    state.undo.push(e);
    updateToolbar();
  }

  function clearPage() { // clear.md
    if (!state.strokes.length) return;
    cancelLive();
    pushUndo({ type: "clear", strokes: state.strokes.slice() });
    removeStrokes(state.strokes);
    inkChanged();
    flushSave(); // clear.md rule 1
  }

  function toggleHidden() { // hide-ink.md rule 1
    state.hidden = !state.hidden;
    requestRender();
    updateToolbar();
  }

  // ── Live stroke ────────────────────────────────────────────────────────

  let live = null;
  const trail = [];

  function beginStroke(e) {
    const tool = state.settings.tool;
    const [x, y] = clientToDoc(e.clientX, e.clientY);
    const [sx, sy] = clientToScreen(e.clientX, e.clientY);
    const p = pressureOf(e);
    live = { tool, points: [], pSmooth: p, hold: null, holdTimer: 0, snapped: null, scr: null, marked: null, erased: [], anchorEl: null, screen: [sx, sy], spotY: sy, t0: performance.now(), x0: x, y0: y, maxDist: 0 };
    if (tool === Tool.Pen || tool === Tool.Highlighter) {
      if (state.hidden) { state.hidden = false; requestRender(); updateToolbar(); } // hide-ink.md rule 4
      live.anchorEl = findAnchor(e.clientX, e.clientY);
      if (tool === Tool.Pen) live.scr = newScribbleTracker(x, y);
      live.hold = { x, y, travel: 0 };
      live.points.push([x, y, p]);
      armHold();
    } else if (tool === Tool.Eraser) {
      eraseAt(x, y);
    } else if (tool === Tool.Trail) {
      trail.push({ x: sx, y: sy, t: performance.now(), start: true }); // trail.md rule 9: no segment joins two strokes
    }
    requestFx();
  }

  function extendStroke(e) {
    if (!live) return;
    const [x, y] = clientToDoc(e.clientX, e.clientY);
    const [sx, sy] = clientToScreen(e.clientX, e.clientY);
    live.screen = [sx, sy];
    const tool = live.tool;
    const fromStart = Math.hypot(x - live.x0, y - live.y0);
    if (fromStart > live.maxDist) live.maxDist = fromStart;
    if (tool === Tool.Pen || tool === Tool.Highlighter) {
      if (live.points.length >= LIMITS.points) return; // pen.md rule 10
      live.pSmooth = live.pSmooth * 0.65 + pressureOf(e) * 0.35;
      const last = live.points[live.points.length - 1];
      const d = Math.hypot(x - last[0], y - last[1]);
      if (d < 0.5) return;
      live.points.push([x, y, live.pSmooth]);
      live.hold.travel += d;
      if (Math.hypot(x - live.hold.x, y - live.hold.y) > HOLD.jitter) { // highlighter.md rule 9
        live.hold.x = x; live.hold.y = y;
        live.snapped = null;
        armHold();
      }
      if (live.scr) {
        const wasDetected = live.scr.detected;
        if (scribbleStep(live.scr, x, y)) {
          if (!wasDetected) { live.marked = new Set(); for (const q of live.points) markAt(q[0], q[1]); }
          else markAt(x, y);
        }
      }
    } else if (tool === Tool.Eraser) {
      eraseAt(x, y);
    } else if (tool === Tool.Trail) {
      trail.push({ x: sx, y: sy, t: performance.now() });
    } else if (tool === Tool.Spotlight) {
      live.spotY = sy; // reading-spotlight.md rule 5
    }
    requestFx();
  }

  function armHold() {
    clearTimeout(live.holdTimer);
    live.holdTimer = setTimeout(holdCheck, HOLD.ms);
  }

  function holdCheck() {
    if (!live || !live.hold || live.snapped) return;
    if (live.hold.travel < HOLD.travel) return; // highlighter.md rule 7
    const kind = classifyShape(live.points, live.tool === Tool.Pen);
    if (!kind) return;
    live.snapped = { kind, points: shapePoints(kind, live.points) };
    requestFx();
  }

  function markAt(x, y) { // scribble-to-erase.md rule 4
    let changed = false;
    const t = live.scr;
    const pad = ERASER_REACH / vp.scale;
    const sb = { x: t.x0 - pad, y: t.y0 - pad, w: t.x1 - t.x0 + pad * 2, h: t.y1 - t.y0 + pad * 2 };
    for (const s of hitStrokes(x, y)) {
      if (live.marked.has(s.id)) continue;
      const g = geoCache.get(s.id);
      if (!g) continue;
      // Only strokes the scribble mostly covers. Writing a word across an old underline must not erase it.
      const ix = Math.max(0, Math.min(sb.x + sb.w, g.box.x + g.box.w) - Math.max(sb.x, g.box.x));
      const iy = Math.max(0, Math.min(sb.y + sb.h, g.box.y + g.box.h) - Math.max(sb.y, g.box.y));
      const covered = (ix * iy) / Math.max(1, g.box.w * g.box.h);
      if (covered < SCRIBBLE.cover) continue;
      live.marked.add(s.id);
      changed = true;
    }
    if (changed) requestRender();
  }

  function eraseAt(x, y) { // eraser.md rule 1
    const hits = hitStrokes(x, y);
    if (!hits.length) return;
    removeStrokes(hits);
    live.erased.push(...hits);
    inkChanged();
  }

  let lastTap = null; // tip-double-tap.md: { t, x, y, strokeId }

  function endStroke(e, cancelled) {
    const L = live;
    if (!L) return;
    live = null;
    clearTimeout(L.holdTimer);
    const now = performance.now();
    const quick = !cancelled && now - L.t0 < TAP.ms && L.maxDist < TAP.move;
    const tapTool = L.tool === Tool.Pen || L.tool === Tool.Highlighter || L.tool === Tool.Eraser;
    const isTap = tapTool && quick; // tip-double-tap.md rule 1
    if (isTap && lastTap && now - lastTap.t < TAP.gap && Math.hypot(L.x0 - lastTap.x, L.y0 - lastTap.y) < TAP.apart) {
      if (lastTap.strokeId) { // the first tap's dot never meant to be ink
        const first = state.strokes.find((s) => s.id === lastTap.strokeId);
        if (first) {
          removeStrokes([first]);
          const top = state.undo[state.undo.length - 1];
          if (top && top.type === "add" && top.strokes.length === 1 && top.strokes[0] === first) state.undo.pop();
          inkChanged();
        }
      }
      lastTap = null;
      toggleEraser();
      requestRender();
      requestFx();
      return;
    }
    let committedId = null;
    if (L.tool === Tool.Pen || L.tool === Tool.Highlighter) {
      if (L.marked && L.marked.size) { // scribble-to-erase.md rule 5
        const list = state.strokes.filter((s) => L.marked.has(s.id));
        removeStrokes(list);
        pushUndo({ type: "remove", strokes: list });
        inkChanged();
      } else {
        let pts = L.points, straight = false, shape = null;
        if (L.snapped && !cancelled) {
          pts = L.snapped.points;
          shape = L.snapped.kind;
          straight = shape === "line";
        }
        committedId = commitStroke(L, pts, straight, shape);
      }
    } else if (L.tool === Tool.Eraser) {
      if (L.erased.length) { pushUndo({ type: "remove", strokes: L.erased }); updateToolbar(); } // eraser.md rule 4
    }
    lastTap = isTap ? { t: now, x: L.x0, y: L.y0, strokeId: committedId } : null;
    requestRender();
    requestFx();
  }

  function commitStroke(L, docPts, straight, shape) {
    if (state.strokes.length >= LIMITS.strokes) { notice("Page is full. Clear to continue."); return null; } // persistence.md rule 4
    const placed = anchorFor(L.anchorEl, docPts);
    const s = {
      id: uuid(),
      tool: L.tool,
      color: L.tool === Tool.Highlighter ? state.settings.hlColor : state.settings.penColor,
      width: L.tool === Tool.Highlighter ? state.settings.hlWidth : state.settings.penWidth,
      straight,
      shape: shape || undefined,
      anchor: placed.anchor,
      points: placed.points,
      created: Date.now(),
    };
    state.strokes.push(s);
    pushUndo({ type: "add", strokes: [s] });
    inkChanged();
    return s.id;
  }

  function cancelLive() {
    if (!live) return;
    clearTimeout(live.holdTimer);
    if (live.tool === Tool.Eraser && live.erased.length) pushUndo({ type: "remove", strokes: live.erased });
    live = null;
    activePointer = null;
    requestRender();
    requestFx();
  }

  function uuid() {
    if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // ── Rendering ──────────────────────────────────────────────────────────

  let frameQueued = false, inkDirty = false, fxDirty = false;

  function requestRender() { inkDirty = true; queueFrame(); }
  function requestFx() { fxDirty = true; queueFrame(); }

  function queueFrame() {
    if (frameQueued || !inkCanvas) return;
    frameQueued = true;
    requestAnimationFrame(frame);
  }

  function frame() {
    frameQueued = false;
    if (!inkCanvas) return;
    readViewport();
    const resized = layoutCanvases();
    if (inkDirty || resized) { inkDirty = false; renderInk(); updateShields(); positionToolbar(); }
    if (repairDeferred) { repairDeferred = false; setTimeout(requestRender, REPAIR_INTERVAL); }
    if (fxDirty || resized || trail.length) { fxDirty = false; renderFx(); }
    if (trail.length) queueFrame();
  }

  function docTransform(ctx) {
    const k = kFactor();
    ctx.setTransform(k, 0, 0, k, -(vp.sx + vp.ox) * k, -(vp.sy + vp.oy) * k);
  }

  function paintStroke(ctx, tool, width, color, path, alpha) {
    ctx.globalAlpha = alpha;
    if (tool === Tool.Highlighter) {
      ctx.strokeStyle = colorHex(tool, color);
      ctx.lineWidth = width;
      ctx.lineCap = "square"; // highlighter.md rule 6
      ctx.lineJoin = "round";
      ctx.stroke(path);
    } else {
      ctx.fillStyle = colorHex(tool, color);
      ctx.fill(path);
    }
    ctx.globalAlpha = 1;
  }

  function renderInk() {
    const ctx = inkCtx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    if (state.hidden) return; // hide-ink.md rule 2
    docTransform(ctx);
    const view = { x: vp.sx + vp.ox, y: vp.sy + vp.oy, w: vp.w, h: vp.h };
    const marked = live && live.marked;
    for (const s of state.strokes) {
      const g = placeStroke(s);
      if (!g || !intersects(g.box, view)) continue;
      const alpha = (s.tool === Tool.Highlighter ? HL_ALPHA : 1) * (marked && marked.has(s.id) ? MARK_ALPHA : 1);
      paintStroke(ctx, s.tool, s.width, s.color, g.path, alpha);
    }
  }

  function renderFx() {
    const ctx = fxCtx;
    const W = fxCanvas.width, H = fxCanvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dpr = vp.dpr;

    if (live && live.tool === Tool.Spotlight) { // reading-spotlight.md rules 2 to 4
      ctx.fillStyle = "rgba(0,0,0," + SPOT_DIM + ")";
      ctx.fillRect(0, 0, W, H);
      const band = state.settings.spotBand * dpr, feather = SPOT_FEATHER * dpr;
      const y = live.spotY * dpr;
      const grad = ctx.createLinearGradient(0, y - band / 2 - feather, 0, y + band / 2 + feather);
      const inner0 = feather / (band + feather * 2), inner1 = 1 - inner0;
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(inner0, "rgba(0,0,0,1)");
      grad.addColorStop(inner1, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = grad;
      ctx.fillRect(0, y - band / 2 - feather, W, band + feather * 2);
      ctx.globalCompositeOperation = "source-over";
    }

    if (live && (live.tool === Tool.Pen || live.tool === Tool.Highlighter) && live.points.length) {
      docTransform(ctx);
      const pts = live.snapped ? live.snapped.points : live.points;
      const straight = !!live.snapped && live.snapped.kind === "line";
      const color = live.tool === Tool.Highlighter ? state.settings.hlColor : state.settings.penColor;
      const width = live.tool === Tool.Highlighter ? state.settings.hlWidth : state.settings.penWidth;
      paintStroke(ctx, live.tool, width, color, buildPath(live.tool, width, pts, straight), live.tool === Tool.Highlighter ? HL_ALPHA : 1);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    if (live && live.tool === Tool.Eraser) { // eraser.md rule 6
      ctx.beginPath();
      ctx.arc(live.screen[0] * dpr, live.screen[1] * dpr, ERASER_REACH * dpr, 0, TAU);
      ctx.fillStyle = "rgba(128,128,128,0.18)";
      ctx.fill();
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeStyle = "rgba(128,128,128,0.9)";
      ctx.stroke();
    }

    if (trail.length) { // trail.md rules 2, 3
      const now = performance.now();
      while (trail.length && now - trail[0].t > TRAIL_TTL) trail.shift();
      const base = state.settings.penWidth * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = colorHex(Tool.Pen, state.settings.penColor);
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i];
        if (b.start) continue; // a new stroke; nothing connects it to the previous one
        const life = 1 - (now - b.t) / TRAIL_TTL;
        if (life <= 0) continue;
        ctx.globalAlpha = life;
        ctx.lineWidth = Math.max(0.5, base * life) * dpr;
        ctx.beginPath();
        ctx.moveTo(a.x * dpr, a.y * dpr);
        ctx.lineTo(b.x * dpr, b.y * dpr);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  // ── Toolbar host ───────────────────────────────────────────────────────
  // toolbar.md. Markup and styles live in the shadow root.

  const ui = { root: null, pill: null, dot: null, noticeEl: null, colors: null, widths: null, wrange: null, wdot: null, panel: null, picker: null, pickerInput: null, pickerDot: null, buttons: {}, collapsed: true, panelOpen: false, dragging: false, posKey: "", version: 0 };
  let noticeTimer = 0;

  const ICONS = {
    lock: '<path d="M7 11V8a5 5 0 0 1 10 0v3"/><rect x="5" y="11" width="14" height="10" rx="2"/>',
    unlock: '<path d="M7 11V8a5 5 0 0 1 9.6-2"/><rect x="5" y="11" width="14" height="10" rx="2"/>',
    pen: '<path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z"/><path d="M14 7l3 3"/>',
    highlighter: '<path d="M9 19l-3-3L16 6l3 3L9 19z"/><path d="M6 16l-2 4h5"/><path d="M4 21h16"/>',
    eraser: '<path d="M16 4l4 4-9 9H8l-3-3L16 4z"/><path d="M7 17l3 3h9"/>',
    trail: '<circle cx="16" cy="8" r="3"/><path d="M13 10L4 19"/><path d="M13.5 13.5L8 19"/><path d="M10 9l-4 2"/>',
    spotlight: '<path d="M3 8h18"/><path d="M3 16h18"/><path d="M6 12h12" stroke-width="3.5"/>',
    undo: '<path d="M9 14l-4-4 4-4"/><path d="M5 10h9a5 5 0 0 1 0 10h-3"/>',
    redo: '<path d="M15 14l4-4-4-4"/><path d="M19 10h-9a5 5 0 0 0 0 10h3"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    grip: '<circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/>',
  };

  const svg = (name) => '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";

  const TOOLBAR_CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    #root { position: relative; font: 13px/1 -apple-system, system-ui, sans-serif; color: #fff; -webkit-user-select: none; user-select: none; }
    .pill, .dot, .panel { background: rgba(28,28,30,0.88); -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); box-shadow: 0 8px 28px rgba(0,0,0,0.30), 0 0 0 0.5px rgba(255,255,255,0.12) inset; }
    .pill { display: flex; flex-direction: row; flex-wrap: wrap; justify-content: center; align-items: center; padding: 4px; border-radius: 30px; }
    .group { display: contents; }
    .pill.vertical { flex-direction: column; flex-wrap: nowrap; width: 178px; max-width: none; border-radius: 28px; padding: 6px 4px; }
    .vertical .group { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; width: 100%; }
    .btn { position: relative; width: 54px; height: 54px; border: 0; margin: 0; padding: 0; background: transparent; color: #fff; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; touch-action: none; font: 600 9.5px/1 -apple-system, system-ui, sans-serif; }
    .btn small { font-size: 9.5px; font-weight: 600; opacity: 0.8; white-space: nowrap; }
    .btn.active { background: rgba(255,255,255,0.22); }
    .btn.active small { opacity: 1; }
    .btn:disabled { opacity: 0.32; cursor: default; }
    .compact .btn { width: 44px; height: 44px; border-radius: 12px; }
    .compact .btn small, .nolabels .btn small { display: none; }
    .btn.grip { width: 28px; color: rgba(255,255,255,0.55); cursor: grab; }
    .vertical .btn.grip { width: 100%; height: 26px; }
    .sep { width: 1px; height: 34px; background: rgba(255,255,255,0.16); margin: 0 3px; flex: none; }
    .vertical .sep { width: 60%; height: 1px; margin: 4px 0; }
    .swatch span { display: block; width: 26px; height: 26px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(255,255,255,0.25); }
    .swatch.active span { box-shadow: 0 0 0 3px #fff; }
    .swatch.picker span { position: relative; background: conic-gradient(#ff3b30, #ff9500, #ffd60a, #34c759, #007aff, #af52de, #ff3b30); }
    .swatch.picker i { display: none; position: absolute; inset: 4px; border-radius: 50%; }
    .swatch.picker.custom i { display: block; }
    .swatch.picker input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; margin: 0; padding: 0; border: 0; cursor: pointer; pointer-events: none; }
    .swatch.picker.pick input { pointer-events: auto; }
    .width { display: flex; align-items: center; gap: 8px; height: 54px; padding: 0 10px; }
    .compact .width { height: 44px; }
    .width .preview { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; flex: none; }
    .width .preview span { display: block; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px rgba(255,255,255,0.2); }
    .width input[type=range] { -webkit-appearance: none; appearance: none; width: 120px; height: 4px; margin: 0; background: rgba(255,255,255,0.28); border-radius: 2px; outline: none; }
    .width input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.45); cursor: pointer; }
    .vertical .width { flex-direction: column; height: auto; padding: 6px 0 4px; }
    .vertical .width input[type=range] { width: 140px; }
    .dot { position: relative; width: 56px; height: 56px; border: 0; margin: 0; padding: 0; border-radius: 28px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; touch-action: none; }
    .dot .tint { position: absolute; width: 12px; height: 12px; border-radius: 50%; right: 4px; bottom: 4px; box-shadow: 0 0 0 1.5px rgba(28,28,30,0.9); }
    .notice { position: absolute; left: 50%; transform: translateX(-50%); bottom: calc(100% + 10px); white-space: nowrap; background: rgba(28,28,30,0.92); color: #fff; padding: 8px 12px; border-radius: 10px; font-size: 13px; opacity: 0; transition: opacity 160ms ease; pointer-events: none; }
    #root[data-edge="top"] .notice { bottom: auto; top: calc(100% + 10px); }
    .notice.show { opacity: 1; }
    .panel { position: absolute; right: 0; bottom: calc(100% + 10px); width: 250px; padding: 12px 14px 14px; border-radius: 18px; }
    #root[data-edge="top"] .panel { bottom: auto; top: calc(100% + 10px); }
    #root[data-edge="right"] .panel { right: calc(100% + 10px); bottom: 0; }
    #root[data-edge="left"] .panel { right: auto; left: calc(100% + 10px); bottom: 0; }
    .panel h3 { margin: 0 0 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; opacity: 0.6; }
    .pref { display: flex; justify-content: space-between; align-items: center; min-height: 44px; font-size: 15px; }
    .switch { position: relative; width: 48px; height: 30px; border: 0; margin: 0; padding: 0; border-radius: 15px; background: rgba(255,255,255,0.28); cursor: pointer; }
    .switch.on { background: #34c759; }
    .switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: transform 150ms ease; }
    .switch.on::after { transform: translateX(18px); }
    .panel .text { display: block; width: 100%; margin-top: 10px; padding: 11px; border: 0; border-radius: 12px; background: rgba(255,255,255,0.12); color: #fff; font: inherit; font-size: 15px; cursor: pointer; }
    [hidden] { display: none !important; }
  `;

  function buildToolbar() {
    host = document.createElement("div");
    host.className = "inkover-host";
    const shadow = host.attachShadow({ mode: "open" });
    // Two copies of the same stylesheet, on purpose. A constructed sheet is CSSOM, which a page's
    // Content-Security-Policy cannot block, but Safari's isolated script world may not apply it to
    // the page's shadow root. A <style> element is what Safari has always honoured for content
    // scripts, but a policy could in principle block it. Whichever one takes, the toolbar is styled.
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(TOOLBAR_CSS);
      shadow.adoptedStyleSheets = [sheet];
    } catch (_) { /* no constructed sheets here */ }
    const style = document.createElement("style");
    style.textContent = TOOLBAR_CSS;
    shadow.appendChild(style);
    const root = document.createElement("div");
    root.id = "root";
    root.innerHTML = `
      <div class="pill" id="pill">
        <button class="btn grip" data-act="collapse" aria-label="Collapse toolbar">${svg("grip")}</button>
        <div class="group">
          <button class="btn" data-act="lock" aria-label="Lock">${svg("unlock")}<small>Lock</small></button>
          <button class="btn" data-tool="pen" aria-label="Pen">${svg("pen")}<small>Pen</small></button>
          <button class="btn" data-tool="highlighter" aria-label="Highlighter">${svg("highlighter")}<small>Highlight</small></button>
        </div>
        <div class="group">
          <button class="btn" data-tool="eraser" aria-label="Eraser">${svg("eraser")}<small>Eraser</small></button>
          <button class="btn" data-tool="trail" aria-label="Trail">${svg("trail")}<small>Trail</small></button>
          <button class="btn" data-tool="spotlight" aria-label="Reading spotlight">${svg("spotlight")}<small>Spotlight</small></button>
        </div>
        <div class="sep" id="sepColors"></div>
        <div class="group" id="colors"></div>
        <div class="group" id="widths"><div class="width"><span class="preview"><span id="wdot"></span></span><input type="range" id="wrange" aria-label="Width"></div></div>
        <div class="sep"></div>
        <div class="group">
          <button class="btn" data-act="undo" aria-label="Undo">${svg("undo")}<small>Undo</small></button>
          <button class="btn" data-act="redo" aria-label="Redo">${svg("redo")}<small>Redo</small></button>
        </div>
        <div class="group">
          <button class="btn" data-act="hide" aria-label="Hide ink">${svg("eye")}<small>Hide</small></button>
          <button class="btn" data-act="clear" aria-label="Clear page">${svg("trash")}<small>Clear</small></button>
        </div>
        <div class="group"><button class="btn" data-act="prefs" aria-label="Preferences">${svg("gear")}<small>More</small></button></div>
      </div>
      <button class="dot" id="dot" aria-label="Expand Inkover toolbar">${svg("pen")}<span class="tint"></span></button>
      <div class="panel" id="panel" hidden>
        <h3>Toolbar</h3>
        <div class="pref"><span>Labels</span><button class="switch" data-pref="labels" role="switch" aria-label="Labels"></button></div>
        <div class="pref"><span>Compact buttons</span><button class="switch" data-pref="compact" role="switch" aria-label="Compact buttons"></button></div>
        <button class="text" data-act="reset" type="button">Reset colours and widths</button>
      </div>
      <div class="notice" id="notice"></div>
    `;
    shadow.appendChild(root);
    document.body.appendChild(host);

    ui.root = root;
    ui.pill = root.querySelector("#pill");
    ui.dot = root.querySelector("#dot");
    ui.noticeEl = root.querySelector("#notice");
    ui.colors = root.querySelector("#colors");
    ui.widths = root.querySelector("#widths");
    ui.wrange = root.querySelector("#wrange");
    ui.wdot = root.querySelector("#wdot");
    ui.panel = root.querySelector("#panel");
    ui.buttons = {};
    for (const b of root.querySelectorAll("[data-act], [data-tool]")) ui.buttons[b.dataset.act || b.dataset.tool] = b;

    // The custom swatch is built once and never rebuilt: on iPadOS the colour input fires change on
    // every movement, and detaching the input closes the system picker. D0013.
    ui.picker = document.createElement("button");
    ui.picker.className = "btn swatch picker";
    ui.picker.setAttribute("aria-label", "Custom colour");
    const ring = document.createElement("span");
    ui.pickerDot = document.createElement("i");
    ring.appendChild(ui.pickerDot);
    ui.picker.appendChild(ring);
    ui.pickerInput = document.createElement("input");
    ui.pickerInput.type = "color";
    ui.picker.appendChild(ui.pickerInput);

    root.addEventListener("click", onToolbarClick);
    ui.wrange.addEventListener("input", () => { setCurrentWidth(+ui.wrange.value); previewWidth(); requestFx(); }); // toolbar.md rule 10
    ui.wrange.addEventListener("change", () => { saveSettings(); });
    ui.pickerInput.addEventListener("input", () => pickColor(ui.pickerInput.value, false)); // toolbar.md rule 9
    ui.pickerInput.addEventListener("change", () => pickColor(ui.pickerInput.value, true));
    installDrag(ui.buttons.collapse, () => { ui.collapsed = true; ui.panelOpen = false; updateToolbar(); });
    installDrag(ui.dot, () => { ui.collapsed = false; updateToolbar(); });
    updateToolbar();
  }

  function onToolbarClick(e) {
    const btn = e.target.closest("button");
    if (!btn || btn.disabled) return;
    const s = state.settings;
    if (btn.dataset.tool) { selectTool(btn.dataset.tool); return; }
    if (btn.dataset.color) { setColor(btn.dataset.color, true); return; }
    if (btn === ui.picker) { // toolbar.md rule 9: first tap selects the custom colour; when it is current the input is live and opens the picker
      const custom = s[customKey()];
      if (custom && custom !== currentColor()) setColor(custom, true);
      return;
    }
    if (btn.dataset.pref) { s[btn.dataset.pref] = !s[btn.dataset.pref]; saveSettings(); updateToolbar(); return; } // preferences.md
    switch (btn.dataset.act) {
      case "lock": toggleLock(); break; // toolbar.md rule 7
      case "undo": undo(); break;
      case "redo": redo(); break;
      case "hide": toggleHidden(); break;
      case "clear": clearPage(); break;
      case "prefs": ui.panelOpen = !ui.panelOpen; updateToolbar(); break;
      case "reset": resetPreferences(); break;
    }
  }

  function currentColor() { const s = state.settings; return s.tool === Tool.Highlighter ? s.hlColor : s.penColor; }
  function customKey() { return state.settings.tool === Tool.Highlighter ? "customHl" : "customPen"; }

  function setColor(c, rebuild) {
    const s = state.settings;
    if (s.tool === Tool.Highlighter) s.hlColor = c; else s.penColor = c;
    if (rebuild) { saveSettings(); updateToolbar(); }
  }

  function pickColor(hex, save) { // toolbar.md rule 9: every colour picked replaces the custom swatch, live, without touching the input
    if (!HEX.test(hex)) return;
    state.settings[customKey()] = hex;
    setColor(hex, false);
    paintColors();
    previewWidth();
    if (save) saveSettings();
  }

  function paintColors() { // active rings and the custom swatch, updated in place
    const s = state.settings;
    const current = currentColor();
    const custom = s[customKey()];
    for (const b of ui.colors.querySelectorAll(".swatch[data-color]")) b.classList.toggle("active", b.dataset.color === current);
    ui.picker.classList.toggle("custom", !!custom);
    ui.picker.classList.toggle("active", !!custom && custom === current);
    ui.picker.classList.toggle("pick", !custom || custom === current);
    ui.picker.setAttribute("aria-label", custom ? (custom === current ? "Custom colour " + custom + ". Tap to change it." : "Custom colour " + custom) : "Choose a colour");
    if (custom) ui.pickerDot.style.background = custom;
    const want = colorHex(s.tool, current);
    if (ui.pickerInput.value !== want) ui.pickerInput.value = want;
  }

  function currentWidthSpec() {
    const t = state.settings.tool;
    return t === Tool.Pen ? WIDTH.pen : t === Tool.Highlighter ? WIDTH.highlighter : t === Tool.Spotlight ? WIDTH.spotlight : null;
  }

  function currentWidth() {
    const s = state.settings;
    return s.tool === Tool.Highlighter ? s.hlWidth : s.tool === Tool.Spotlight ? s.spotBand : s.penWidth;
  }

  function setCurrentWidth(v) {
    const s = state.settings;
    const spec = currentWidthSpec();
    if (!spec) return;
    const n = Math.min(spec.max, Math.max(spec.min, v));
    if (s.tool === Tool.Highlighter) s.hlWidth = n; else if (s.tool === Tool.Spotlight) s.spotBand = n; else s.penWidth = n;
  }

  function previewWidth() { // the dot beside the slider shows the width at full pressure, in the current colour
    const s = state.settings;
    const v = currentWidth();
    let px;
    if (s.tool === Tool.Highlighter) px = v * 0.6;
    else if (s.tool === Tool.Spotlight) px = 6 + (v - WIDTH.spotlight.min) / 8;
    else px = penWidth(v, 1) * 1.6;
    px = Math.round(Math.min(26, Math.max(4, px)));
    ui.wdot.style.width = px + "px";
    ui.wdot.style.height = px + "px";
    ui.wdot.style.background = s.tool === Tool.Spotlight ? "#fff" : colorHex(s.tool, s.tool === Tool.Highlighter ? s.hlColor : s.penColor);
    const tint = ui.dot.querySelector(".tint");
    if (tint) tint.style.background = s.tool === Tool.Eraser || s.tool === Tool.Spotlight ? "transparent" : colorHex(s.tool, s.tool === Tool.Highlighter ? s.hlColor : s.penColor);
  }

  function resetPreferences() {
    const s = state.settings, d = defaultSettings();
    Object.assign(s, { penColor: d.penColor, hlColor: d.hlColor, penWidth: d.penWidth, hlWidth: d.hlWidth, spotBand: d.spotBand, customPen: null, customHl: null });
    saveSettings();
    updateToolbar();
    notice("Colours and widths reset");
  }

  const TOOL_LABEL = { pen: "Pen", highlighter: "Highlighter", eraser: "Eraser", trail: "Trail", spotlight: "Spotlight" };

  function selectTool(tool) {
    const s = state.settings;
    if (tool === s.tool) return;
    if (tool === Tool.Eraser) s.prevTool = s.tool; // tip-double-tap.md rule 3
    s.tool = tool;
    saveSettings();
    updateToolbar();
  }

  function toggleEraser() { // tip-double-tap.md rules 2 and 3
    const s = state.settings;
    if (s.tool !== Tool.Eraser) selectTool(Tool.Eraser);
    else selectTool(s.prevTool && s.prevTool !== Tool.Eraser ? s.prevTool : Tool.Pen);
    notice(TOOL_LABEL[s.tool]);
  }

  function installDrag(el, onTap) { // toolbar.md rules 3, 4, 14
    let start = null;
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
      const r = host.getBoundingClientRect();
      start.gx = e.clientX - r.left;
      start.gy = e.clientY - r.top;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (!start.moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
      start.moved = true;
      ui.dragging = true;
      host.style.setProperty("transform", `translate(${e.clientX - start.gx}px, ${e.clientY - start.gy}px) scale(${1 / vp.scale})`, "important");
    });
    const finish = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const wasDrag = start.moved;
      start = null;
      ui.dragging = false;
      if (wasDrag) snapToolbar(e.clientX, e.clientY);
      else onTap();
    };
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);
    el.addEventListener("click", (e) => e.stopPropagation(), true);
  }

  function activeEl() { return ui.collapsed ? ui.dot : ui.pill; }

  function snapToolbar(clientX, clientY) {
    const el = activeEl();
    const r = host.getBoundingClientRect();
    const w = el.offsetWidth / vp.scale, h = el.offsetHeight / vp.scale;
    const cx = r.left - vp.ox + w / 2, cy = r.top - vp.oy + h / 2; // centre in visual-viewport layout units
    const dist = { left: cx, right: vp.w - cx, top: cy, bottom: vp.h - cy };
    let edge = "bottom";
    for (const k of Object.keys(dist)) if (dist[k] < dist[edge]) edge = k;
    const inset = 16 / vp.scale;
    let along;
    if (edge === "top" || edge === "bottom") along = (r.left - vp.ox - inset) / Math.max(1, vp.w - w - inset * 2);
    else along = (r.top - vp.oy - inset) / Math.max(1, vp.h - h - inset * 2);
    state.settings.toolbar = { edge, along: Math.min(1, Math.max(0, along)) };
    saveSettings();
    ui.posKey = "";
    positionToolbar();
  }

  function positionToolbar() { // toolbar.md rules 3, 5
    if (!host || ui.dragging) return;
    const tb = state.settings.toolbar;
    const key = [vp.w, vp.h, vp.ox, vp.oy, vp.scale, ui.collapsed, tb.edge, tb.along, ui.version].join("|");
    if (key === ui.posKey) return;
    ui.posKey = key;
    const vertical = tb.edge === "left" || tb.edge === "right";
    ui.pill.classList.toggle("vertical", vertical);
    ui.pill.style.maxWidth = vertical ? "" : Math.floor(vp.w * vp.scale - 32) + "px"; // toolbar.md rule 14: wrap when the row does not fit
    ui.root.dataset.edge = tb.edge;
    const el = activeEl();
    const w = el.offsetWidth / vp.scale, h = el.offsetHeight / vp.scale;
    const inset = 16 / vp.scale;
    let x, y;
    if (vertical) {
      x = tb.edge === "left" ? inset : vp.w - w - inset;
      y = inset + tb.along * Math.max(0, vp.h - h - inset * 2);
    } else {
      y = tb.edge === "top" ? inset : vp.h - h - inset;
      x = inset + tb.along * Math.max(0, vp.w - w - inset * 2);
    }
    host.style.setProperty("transform", `translate(${vp.ox + x}px, ${vp.oy + y}px) scale(${1 / vp.scale})`, "important");
  }

  function updateToolbar() {
    if (!ui.root) return;
    const s = state.settings;
    const isLocked = state.mode === Mode.Locked;
    ui.pill.hidden = ui.collapsed;
    ui.dot.hidden = !ui.collapsed;
    ui.panel.hidden = !ui.panelOpen || ui.collapsed;
    ui.root.classList.toggle("nolabels", !s.labels);   // preferences.md rule 2
    ui.root.classList.toggle("compact", !!s.compact);   // preferences.md rule 3
    ui.buttons.lock.innerHTML = svg(isLocked ? "lock" : "unlock") + "<small>" + (isLocked ? "Unlock" : "Lock") + "</small>"; // modes-and-lock.md rule 6: icon shows the state, label the action
    ui.buttons.lock.classList.toggle("active", isLocked);
    ui.buttons.lock.setAttribute("aria-label", isLocked ? "Locked. Unlock to browse." : "Unlocked. Lock to draw.");
    for (const t of Object.values(Tool)) ui.buttons[t].classList.toggle("active", s.tool === t);
    ui.buttons.prefs.classList.toggle("active", ui.panelOpen);

    const palette = s.tool === Tool.Highlighter ? HL_COLORS : (s.tool === Tool.Pen || s.tool === Tool.Trail) ? PEN_COLORS : null; // toolbar.md rule 8
    for (const b of Array.from(ui.colors.children)) if (b !== ui.picker) b.remove(); // the custom swatch stays put, see D0013
    if (ui.picker.parentNode !== ui.colors) ui.colors.appendChild(ui.picker);
    ui.picker.hidden = !palette;
    if (palette) {
      // Colours and sizes are set through the CSSOM, never as style attributes: a page's
      // Content-Security-Policy can block inline style attributes, and did on claude.ai.
      const frag = document.createDocumentFragment();
      for (const [name, hex] of Object.entries(palette)) {
        const b = document.createElement("button");
        b.className = "btn swatch";
        b.dataset.color = name;
        b.setAttribute("aria-label", name);
        const dot = document.createElement("span");
        dot.style.background = hex;
        b.appendChild(dot);
        frag.appendChild(b);
      }
      ui.colors.insertBefore(frag, ui.picker);
      paintColors();
    }
    const spec = currentWidthSpec(); // toolbar.md rule 10
    ui.widths.hidden = !spec;
    if (spec) {
      ui.wrange.min = spec.min;
      ui.wrange.max = spec.max;
      ui.wrange.step = spec.step;
      ui.wrange.value = currentWidth();
      ui.wrange.setAttribute("aria-label", s.tool === Tool.Spotlight ? "Band height" : "Stroke width");
    }
    ui.root.querySelector("#sepColors").hidden = !palette && !spec;

    ui.buttons.undo.disabled = !state.undo.length; // toolbar.md rule 15
    ui.buttons.redo.disabled = !state.redo.length;
    ui.buttons.clear.disabled = !state.strokes.length;
    ui.buttons.hide.disabled = !state.strokes.length && !state.hidden;
    ui.buttons.hide.innerHTML = svg(state.hidden ? "eyeOff" : "eye") + "<small>" + (state.hidden ? "Show" : "Hide") + "</small>"; // hide-ink.md rule 7
    ui.buttons.hide.classList.toggle("active", state.hidden);

    for (const sw of ui.panel.querySelectorAll(".switch")) {
      const on = !!s[sw.dataset.pref];
      sw.classList.toggle("on", on);
      sw.setAttribute("aria-checked", on ? "true" : "false");
    }

    ui.dot.firstElementChild.outerHTML = svg(s.tool);
    previewWidth();
    ui.version++;
    positionToolbar();
  }

  function notice(text) { // toolbar.md rule 12
    if (!ui.noticeEl) return;
    ui.noticeEl.textContent = text;
    ui.noticeEl.classList.add("show");
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => ui.noticeEl && ui.noticeEl.classList.remove("show"), 3000);
  }

  // ── Page key changes ───────────────────────────────────────────────────

  async function checkPageKey() { // persistence.md rule 6
    const key = pageKey();
    if (key === state.pageKey) return;
    if (saveTimer) flushSave();
    cancelLive();
    state.pageKey = key;
    state.undo.length = 0;
    state.redo.length = 0;
    geoCache.clear();
    invalidateResolutions();
    state.strokes = await loadInk(key);
    if (isOn()) setMode(Mode.Off);
    if (state.strokes.length) setMode(Mode.Unlocked); // modes-and-lock.md rule 8
  }

  // ── Wiring ─────────────────────────────────────────────────────────────

  let scrollTick = 0;

  function onScroll() {
    requestRender();
    const now = performance.now();
    if (now - scrollTick > 100) { scrollTick = now; bumpEpoch(); }
  }

  function onViewportChange() { bumpEpoch(); ui.posKey = ""; requestRender(); }

  async function init() {
    readViewport();
    let stored = {};
    try { stored = (await api.storage.local.get(["settings", inkKey(state.pageKey)])) || {}; } catch (_) { stored = {}; }
    if (stored.settings && typeof stored.settings === "object") {
      const d = defaultSettings();
      const s = stored.settings;
      const num = (v, spec, legacy) => { const n = typeof v === "number" ? v : legacy; return n >= spec.min && n <= spec.max ? n : spec.def; };
      const hex1 = (v) => typeof v === "string" && HEX.test(v) ? v : (Array.isArray(v) && HEX.test(v[0] || "") ? v[0] : null); // settings saved with a list keep its newest
      const color = (c, pal, fallback) => (pal[c] || HEX.test(c || "")) ? c : fallback;
      state.settings = {
        tool: Object.values(Tool).includes(s.tool) ? s.tool : d.tool,
        prevTool: Object.values(Tool).includes(s.prevTool) && s.prevTool !== Tool.Eraser ? s.prevTool : d.prevTool,
        penColor: color(s.penColor, PEN_COLORS, d.penColor),
        hlColor: color(s.hlColor, HL_COLORS, d.hlColor),
        penWidth: num(s.penWidth, WIDTH.pen, PEN_BASE[s.size]),
        hlWidth: num(s.hlWidth, WIDTH.highlighter, HL_WIDTH[s.size]),
        spotBand: num(s.spotBand, WIDTH.spotlight, SPOT_BAND[s.size]),
        customPen: hex1(s.customPen),
        customHl: hex1(s.customHl),
        labels: s.labels !== false,
        compact: s.compact === true,
        toolbar: s.toolbar && ["top", "bottom", "left", "right"].includes(s.toolbar.edge) ? { edge: s.toolbar.edge, along: Math.min(1, Math.max(0, +s.toolbar.along || 0)) } : d.toolbar,
      };
    }
    const data = stored[inkKey(state.pageKey)];
    if (data && data.v === STORAGE_VERSION && Array.isArray(data.strokes)) state.strokes = data.strokes.filter(validStroke).map(normalizeStroke);
    else if (data && data.v !== STORAGE_VERSION) setTimeout(() => notice("Ink on this page was saved by a newer Inkover."), 0);

    const cap = { capture: true };
    window.addEventListener("pointerdown", onPointerDown, cap);
    window.addEventListener("pointermove", onPointerMove, cap);
    window.addEventListener("pointerup", onPointerUp, cap);
    window.addEventListener("pointercancel", onPointerCancel, cap);
    window.addEventListener("click", onClick, cap);
    for (const t of ["touchstart", "touchmove", "touchend", "touchcancel"]) window.addEventListener(t, onTouch, { capture: true, passive: false });
    window.addEventListener("keydown", onKey, cap);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", () => { bumpEpoch(); requestRender(); }, { passive: true });
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("orientationchange", onViewportChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onViewportChange);
      window.visualViewport.addEventListener("scroll", onScroll, { passive: true });
    }
    for (const t of ["fullscreenchange", "webkitfullscreenchange"]) document.addEventListener(t, () => { applyFullscreen(); requestRender(); requestFx(); });
    window.addEventListener("pagehide", () => { if (saveTimer) flushSave(); });
    window.addEventListener("popstate", checkPageKey);
    window.addEventListener("hashchange", checkPageKey);
    setInterval(checkPageKey, 500);
    setInterval(() => { if (state.mode === Mode.Off) return; bumpEpoch(); for (const [id, el] of resolveCache) if (!el) resolveCache.delete(id); requestRender(); }, 1000); // safety net
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "aria-hidden", "aria-selected", "aria-expanded", "open"] });

    api.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === "inkover:toggle") toggleFromButton();
    });

    if (state.strokes.length) setMode(Mode.Unlocked); // modes-and-lock.md rule 8
    if (DEV) window.__inkoverDebug = { state, Mode, setMode, toggleLock, placeStroke, resolveAnchor, findAnchor, locatorFor, geoCache, resolveCache, vp, holdCheck, flushSave, renderInk, renderFx, readViewport, trail, undo, redo, clearPage, toggleHidden, checkPageKey, updateToolbar, updateShields, hitStrokes, ui, get live() { return live; } };
  }

  init();
})();
