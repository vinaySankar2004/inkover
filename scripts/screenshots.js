#!/usr/bin/env node
// Renders the App Store screenshots listed in docs/store/listing.md into docs/store/screenshots/.
//
// The stage is dev/screenshots/article.html with the real content script loaded the harness way,
// so the mouse acts as the Pencil. WebKit renders it at the 13-inch iPad geometry: 1032 × 1376
// points at 2x, which is the 2064 × 2752 pixel size App Store Connect asks for. Each shot is a
// raw capture of the page framed under its caption, set in the toolbar's own typeface.
//
// Needs Playwright with its WebKit build:
//   npm i -g playwright && npx playwright install webkit
//   NODE_PATH="$(npm root -g)" node scripts/screenshots.js
// Or point NODE_PATH at any node_modules that holds playwright.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { webkit } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs", "store", "screenshots");
const FRAME = { w: 1032, h: 1376, dpr: 2 };           // 13-inch iPad, portrait, points
const BAND = 216;                                      // caption band height
const MARGIN = 40;
const SHOT = { w: FRAME.w - MARGIN * 2, h: FRAME.h - BAND - MARGIN }; // 952 × 1120, the page as captured
const GAP = 24;
const HALF = { w: (SHOT.w - GAP) / 2, h: SHOT.h };     // 464 × 1120, one side of a split shot

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Page helpers ────────────────────────────────────────────────────────

async function openStage(browser, origin, size) {
  const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: FRAME.dpr, hasTouch: false });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`${origin}/dev/screenshots/article.html`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !!window.__inkoverDebug); // init has finished and the toggle listener is registered
  // Straight to Locked, as the Safari button does (modes-and-lock.md rule 7). Not through the toggle: its
  // double-tap guard compares against performance.now(), which is still under 300 ms in a fresh page.
  await page.evaluate(() => { const d = window.__inkoverDebug; d.setMode(d.Mode.Locked); });
  await sleep(150);
  const mode = await page.evaluate(() => window.__inkoverDebug.state.mode);
  if (mode !== "locked") throw new Error(`expected Locked, got ${mode}`);
  // Docked to the right edge (toolbar.md rule 3). The bottom pill wraps to two rows in portrait once
  // the palette is showing; the side pill keeps every group in one place beside the margin.
  await configure(page, { toolbar: { edge: "right", along: 0.5 } });
  return { context, page };
}

// Settings are set through the debug handle the harness exposes, the same fields the toolbar sets.
async function configure(page, settings) {
  await page.evaluate((s) => { Object.assign(window.__inkoverDebug.state.settings, s); window.__inkoverDebug.updateToolbar(); }, settings);
  await sleep(60);
}

async function scrollTo(page, selector, block) {
  await page.evaluate(({ selector, block }) => document.querySelector(selector).scrollIntoView({ block: block || "center" }), { selector, block });
  await sleep(350);
}

// Line boxes of an inline span, in viewport coordinates.
async function lines(page, selector) {
  return page.evaluate((selector) => Array.from(document.querySelector(selector).getClientRects()).map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })), selector);
}

function union(rects) {
  const x0 = Math.min(...rects.map((r) => r.x)), y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w)), y1 = Math.max(...rects.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// Deterministic hand wobble, so the shots are the same every run.
function noise(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647 - 0.5; };
}

// A stroke: down at the first point, through the rest, then up, unless `hold` keeps it down.
async function stroke(page, pts, opts = {}) {
  await page.mouse.move(pts[0][0], pts[0][1]);
  await page.mouse.down();
  for (let i = 1; i < pts.length; i++) {
    await page.mouse.move(pts[i][0], pts[i][1]);
    if (opts.pace) await sleep(opts.pace);
  }
  if (opts.hold) { await sleep(opts.hold); return; } // shape-snap.md: hold still and the preview snaps
  await page.mouse.up();
  await sleep(40);
}

// `wobble` is fine hand tremor; `lumpy` bends the whole oval, the way a quick circle comes out lopsided.
function ellipsePts(box, pad, wobble, seed, steps = 64, lumpy = 0) {
  const n = noise(seed);
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const rx = box.w / 2 + pad.x, ry = box.h / 2 + pad.y;
  const pts = [];
  const start = -2.4, sweep = Math.PI * 2 + 0.55; // begins upper left, overshoots a little, like a hand
  for (let i = 0; i <= steps; i++) {
    const a = start + (sweep * i) / steps;
    const lump = 1 + lumpy * (0.6 * Math.sin(2 * a + 0.9) + 0.4 * Math.sin(3 * a + 2.1));
    const jx = lump + n() * wobble, jy = lump + n() * wobble;
    pts.push([cx + Math.cos(a) * rx * jx, cy + Math.sin(a) * ry * jy]);
  }
  return pts;
}

function linePts(x0, x1, y, seed, wobble = 1.2, steps = 40) {
  const n = noise(seed);
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push([x0 + ((x1 - x0) * i) / steps, y + n() * wobble + Math.sin(i / 5) * 0.6]);
  return pts;
}

// Strokes begin a little inside the text, never in the margin: the first point picks the anchor
// (anchoring.md rule 1), and a point in the margin would anchor to the column, not the paragraph.
async function underline(page, selector, seed) {
  for (const [i, r] of (await lines(page, selector)).entries()) await stroke(page, linePts(r.x + 2, r.x + r.w + 2, r.y + r.h - 3, seed + i));
}

async function highlight(page, selector, seed) {
  for (const [i, r] of (await lines(page, selector)).entries()) await stroke(page, linePts(r.x + 2, r.x + r.w + 2, r.y + r.h * 0.55, seed + i, 0.6));
}

const longest = (rects) => rects.reduce((a, b) => (b.w > a.w ? b : a));

async function circle(page, selector, seed, opts = {}) {
  const box = union(await lines(page, selector));
  const pts = ellipsePts(box, { x: 16, y: 9 }, opts.wobble ?? 0.035, seed, 64, opts.lumpy ?? 0);
  await stroke(page, pts, opts);
}

async function capture(page) {
  await sleep(120);
  return page.screenshot({ type: "png" });
}

// ── Shots ────────────────────────────────────────────────────────────────
// Order and captions are docs/store/listing.md, Screenshots. Change them there first.

const SHOTS = [
  {
    file: "1-draw", caption: "Draw on any page. Lock to draw, unlock to browse.",
    async run(browser, origin) {
      const { context, page } = await openStage(browser, origin, SHOT);
      await configure(page, { tool: "highlighter", hlColor: "yellow" });
      await highlight(page, "#hl1", 11);
      await configure(page, { tool: "pen", penColor: "black", penWidth: 3.5 });
      await underline(page, "#ul1", 21);
      await circle(page, "#circ1", 31);
      const png = await capture(page);
      await context.close();
      return [png];
    },
  },
  {
    file: "2-spotlight", caption: "Hold the Pencil on a line. Everything else fades.",
    async run(browser, origin) {
      const { context, page } = await openStage(browser, origin, SHOT);
      await scrollTo(page, "#spot");
      await configure(page, { tool: "spotlight", spotBand: 84 });
      const r = longest(await lines(page, "#spot"));
      await page.mouse.move(r.x + 60, r.y + r.h / 2);
      await page.mouse.down();
      await sleep(250);
      const png = await capture(page);
      await page.mouse.up();
      await context.close();
      return [png];
    },
  },
  {
    file: "3-anchored", caption: "Ink stays with its words, even when the page changes.", split: true,
    async run(browser, origin) {
      const { context, page } = await openStage(browser, origin, HALF);
      await configure(page, { toolbar: { edge: "bottom", along: 1 } }); // the dot in the corner, off the text
      await page.evaluate(() => { window.__inkoverDebug.ui.collapsed = true; window.__inkoverDebug.updateToolbar(); });
      await configure(page, { tool: "pen", penColor: "black", penWidth: 3.5 });
      await circle(page, "#circ1", 41);
      await configure(page, { tool: "highlighter", hlColor: "yellow" });
      await highlight(page, "#hl1", 51);
      await page.evaluate(() => { const d = window.__inkoverDebug; d.setMode(d.Mode.Unlocked); }); // Unlocked, so the tab is tapped natively
      await sleep(200);
      const left = await capture(page);
      await page.click('[role="tab"][data-tab="1"]');
      await sleep(400);
      const right = await capture(page);
      await context.close();
      return [left, right];
    },
  },
  {
    file: "4-trail", caption: "Trace as you read. It disappears on its own.",
    async run(browser, origin) {
      const { context, page } = await openStage(browser, origin, SHOT);
      await scrollTo(page, "#trail");
      await configure(page, { tool: "trail", penColor: "blue", penWidth: 4 });
      const r = longest(await lines(page, "#trail"));
      const pts = linePts(r.x + 4, r.x + r.w * 0.82, r.y + r.h * 0.8, 61, 1.6, 28);
      await page.mouse.move(pts[0][0], pts[0][1]);
      await page.mouse.down();
      for (let i = 1; i < pts.length; i++) { await page.mouse.move(pts[i][0], pts[i][1]); await sleep(6); }
      const png = await page.screenshot({ type: "png", animations: "allow" }); // mid-fade: the tail is already going
      await page.mouse.up();
      await context.close();
      return [png];
    },
  },
  {
    file: "5-snap", caption: "Hold still, and rough becomes clean.",
    async run(browser, origin) {
      const { context, page } = await openStage(browser, origin, SHOT);
      await scrollTo(page, "#snap1", "start");
      await page.evaluate(() => window.scrollBy(0, -300));
      await sleep(300);
      await configure(page, { tool: "pen", penColor: "black", penWidth: 3.5 });
      await circle(page, "#snap1", 71, { wobble: 0.08, lumpy: 0.16 });            // rough, released at once
      await circle(page, "#snap2", 81, { wobble: 0.08, lumpy: 0.12, hold: 750 }); // rough, then held: the preview snaps
      const png = await capture(page);
      await page.mouse.up();
      await context.close();
      return [png];
    },
  },
  {
    file: "6-colours", caption: "Four highlighters, six pens, and a colour of your own.",
    async run(browser, origin) {
      const { context, page } = await openStage(browser, origin, SHOT);
      await scrollTo(page, "#hl5", "start");
      await page.evaluate(() => window.scrollBy(0, -140));
      await sleep(300);
      await configure(page, { tool: "highlighter", hlColor: "green" });
      await highlight(page, "#hl2", 91);
      await configure(page, { hlColor: "pink" });
      await highlight(page, "#hl3", 101);
      await configure(page, { hlColor: "blue" });
      await highlight(page, "#hl4", 111);
      await configure(page, { customHl: "#af52de", hlColor: "#af52de" });
      await highlight(page, "#hl5", 121);
      const png = await capture(page);
      await context.close();
      return [png];
    },
  },
];

// ── Framing ──────────────────────────────────────────────────────────────

function frameHtml(caption, images) {
  const imgs = images.map((buf, i) => {
    const w = images.length === 1 ? SHOT.w : HALF.w;
    const left = MARGIN + i * (HALF.w + GAP);
    return `<img src="data:image/png;base64,${buf.toString("base64")}" style="position:absolute;left:${left}px;top:${BAND}px;width:${w}px;height:${SHOT.h}px;border-radius:22px;box-shadow:0 12px 40px rgba(0,0,0,0.14),0 0 0 1px rgba(60,60,67,0.16)">`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:${FRAME.w}px;height:${FRAME.h}px;overflow:hidden;background:#f2f2f7;-webkit-font-smoothing:antialiased}
    .cap{position:absolute;left:${MARGIN + 16}px;right:${MARGIN + 16}px;top:0;height:${BAND}px;display:flex;flex-direction:column;justify-content:center;gap:18px}
    .cap i{display:block;width:44px;height:6px;border-radius:3px;background:#ff9500}
    .cap h1{margin:0;font:700 42px/1.15 -apple-system,system-ui,"SF Pro Display",sans-serif;letter-spacing:-0.02em;color:#1c1c1e;text-wrap:balance}
  </style></head><body><div class="cap"><i></i><h1>${caption}</h1></div>${imgs}</body></html>`;
}

async function frame(browser, caption, images, file) {
  const context = await browser.newContext({ viewport: { width: FRAME.w, height: FRAME.h }, deviceScaleFactor: FRAME.dpr });
  const page = await context.newPage();
  await page.setContent(frameHtml(caption, images));
  await page.evaluate(() => document.fonts.ready);
  await sleep(100);
  await page.screenshot({ path: file, type: "png" });
  await context.close();
}

// ── Main ─────────────────────────────────────────────────────────────────

(async () => {
  const only = process.argv[2]; // optional: a shot's leading number, to redo one
  fs.mkdirSync(OUT, { recursive: true });
  const { server, origin } = await serve();
  const browser = await webkit.launch();
  try {
    for (const shot of SHOTS) {
      if (only && !shot.file.startsWith(only)) continue;
      const images = await shot.run(browser, origin);
      const file = path.join(OUT, `${shot.file}.png`);
      await frame(browser, shot.caption, images, file);
      console.log("wrote", path.relative(ROOT, file));
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
