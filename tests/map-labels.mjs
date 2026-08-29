#!/usr/bin/env node
// map-labels.mjs — no two small-country labels on the map overlap.
//
//   node tests/map-labels.mjs
//
// WHY THIS EXISTS. Dan, 27 August 2026: "in the map for asia-pacific,
// the hong kong and taiwan text overlays." Every small-country label was
// pushed a fixed 42 by 34 pixels straight out from the centre of the
// map, with no knowledge that any other label existed, so two markers
// close together and pointing the same way landed on top of each other.
//
// It was never a Hong Kong problem. The collision was waiting for
// whichever two countries happened to be near neighbours, and adding a
// country is what triggered it — the fourth time this month that adding
// a country shook something loose that had been latent.
//
// THIS MEASURES THE RENDERED RESULT, NOT THE PLACEMENT CODE. Reading the
// coordinates the placer computed would only tell us what our own
// arithmetic did; getBoundingClientRect tells us what a reader sees,
// including the real width of the text after the font has loaded, which
// the placer only estimates at 6.5px per character. That estimate is
// exactly the kind of thing that is quietly wrong for a flag emoji or a
// long name, and a test that trusted it would pass over the defect.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { launch, suite, NOT_SET_UP } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("map labels");

// ---- the site, served from the replayed chain on an ephemeral port ----
//
// The map is rendered from D1, so a static file server cannot produce it.
// This mounts the REAL site-worker over an offline replay, the same way
// npm run preview does. Nothing here touches the network or Cloudflare.
//
// The first version of this file assumed a preview server was already
// running on 8788, which was true on the machine it was written on and
// nowhere else -- npm test failed the moment that server was stopped. A
// suite that depends on the author's terminal state is not a suite.
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".woff2": "font/woff2", ".xml": "application/xml" };
const { d1 } = await openReplayDb();
const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const env = {
  eicc_content: d1,
  ASSETS: {
    async fetch(req) {
      const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\//, "") || "index.html";
      const file = join(REPO, rel);
      if (!existsSync(file) || !statSync(file).isFile()) return new Response("not found", { status: 404 });
      return new Response(readFileSync(file), {
        headers: { "content-type": TYPES[extname(file)] || "application/octet-stream" } });
    },
  },
  SESSION_SECRET: "test-secret-not-a-real-one",
  ROI_PUBLIC: "true",
};
const server = createServer(async (req, res) => {
  const out = await worker.fetch(
    new Request(`http://127.0.0.1${req.url}`, { method: req.method, headers: req.headers }),
    env, { waitUntil() {} });
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await launch();
if (browser === NOT_SET_UP) { server.close(); process.exit(NOT_SET_UP); }

const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${BASE}/map`, { waitUntil: "networkidle" });
await page.waitForSelector(".region-map-svg", { timeout: 20000 });

const REGIONS = ["Europe", "Middle East / Africa", "Asia-Pacific", "Americas"];
const report = [];
let checkedRegions = 0;
let checkedLabels = 0;

for (const region of REGIONS) {
  // Switch to the region the way a reader does, then let the map settle.
  const switched = await page.evaluate((r) => {
    const tab = [...document.querySelectorAll(".region-tab")]
      .find((b) => b.textContent.trim().includes(r.split(" ")[0]));
    if (tab) { tab.click(); return true; }
    return false;
  }, region);
  if (!switched) { report.push(`${region}: no region tab found`); continue; }
  await page.waitForTimeout(350);

  // Every rendered label: the group's own box, which covers the dot and
  // the text together, measured after layout rather than predicted.
  const boxes = await page.evaluate(() => {
    const svg = document.querySelector(".region-map-svg.active") || document.querySelector(".region-map-svg");
    if (!svg) return null;
    return [...svg.querySelectorAll(".small-country-marker")].map((g) => {
      const text = g.querySelector("text");
      const r = text.getBoundingClientRect();
      return { name: text.textContent.trim(), x0: r.left, x1: r.right, y0: r.top, y1: r.bottom };
    });
  });
  if (boxes === null) { report.push(`${region}: no map svg rendered`); continue; }
  checkedRegions += 1;
  checkedLabels += boxes.length;

  // Two labels overlap if their rendered text boxes intersect at all.
  // A couple of pixels of slack, because a shared border is not a clash.
  const SLACK = 2;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.x0 + SLACK < b.x1 && b.x0 + SLACK < a.x1
          && a.y0 + SLACK < b.y1 && b.y0 + SLACK < a.y1) {
        const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        report.push(`${region}: "${a.name}" overlaps "${b.name}" by ${Math.round(w)}x${Math.round(h)}px`);
      }
    }
  }
}

t.check("no two small-country labels overlap, in any region",
  report.length === 0, report.slice(0, 8).join("; "));

// The sweep has to be looking at something. A region that rendered no
// markers, or a run where the tabs stopped working, would otherwise pass
// this file silently — which is the failure mode this repo keeps finding.
t.check("all four regions rendered", checkedRegions === 4, `${checkedRegions}/4`);
t.check("there are labels to measure", checkedLabels >= 4, `${checkedLabels} labels across ${checkedRegions} regions`);

// Asia-Pacific is the region Dan reported, and Hong Kong and Taiwan are
// the pair. Name them, so a future change that reintroduces the clash
// fails with the words he used rather than with a coordinate.
{
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll(".region-tab")]
      .find((b) => b.textContent.trim().includes("Asia-Pacific"));
    if (tab) tab.click();
  });
  await page.waitForTimeout(350);
  const pair = await page.evaluate(() => {
    const svg = document.querySelector(".region-map-svg.active") || document.querySelector(".region-map-svg");
    const want = (n) => [...svg.querySelectorAll(".small-country-marker text")]
      .find((el) => el.textContent.includes(n));
    const hk = want("Hong Kong"), tw = want("Taiwan");
    if (!hk || !tw) return { found: false };
    const a = hk.getBoundingClientRect(), b = tw.getBoundingClientRect();
    return { found: true, clash: a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom };
  });
  t.check("Hong Kong and Taiwan are both drawn as markers and do not clash",
    pair.found && !pair.clash, pair.found ? (pair.clash ? "they overlap" : "") : "one of them was not rendered as a marker");
}

// ---- the way out of the map carries the skin ---------------------------
//
// Dan, 29 August 2026: "when I have ?skin=tradeshift, when I click on the
// map, and then Return to the tracker, I then lose partner branding.
// However, the behaviour in all other pages is different, and retains
// partner branding."
//
// The other panels never navigate -- they open in place, pushState
// rewrites the top URL, and the document's custom properties survive
// because nothing reloads. This link is a real navigation to a bare "/",
// so the browser fetches a page with no skin on it and the theme is
// correctly, uselessly gone.
//
// BOTH PATHS, because they set the href in different places and only one
// of them was broken in the way Dan saw. Standalone, map-panel.js wrote
// backUrl + a lang suffix. Embedded in the tracker it wrote NOTHING and
// left the "/" the worker had rendered -- which is the case he hit.
{
  const linkHref = async (url, opener) => {
    const p = await browser.newPage();
    await p.goto(url, { waitUntil: "networkidle" });
    if (opener) {
      await p.evaluate(() => window.openMapPage && window.openMapPage());
      await p.waitForTimeout(1500);
    }
    await p.waitForSelector("#backToTrackerLink", { timeout: 20000 });
    // PLAYWRIGHT'S SELECTOR, NOT document.getElementById. The first
    // version used the latter and threw on null while waitForSelector had
    // just succeeded on the same string -- because the panel lives in an
    // open shadow root, which Playwright pierces and getElementById does
    // not. A check that cannot see the element it is about is the same
    // defect as one that cannot fail.
    const href = (await p.getAttribute("#backToTrackerLink", "href")) || "";
    await p.close();
    return href;
  };

  const standalone = await linkHref(`${BASE}/map?skin=tradeshift`, false);
  t.check("standalone: the map's return link carries the skin",
    /skin=tradeshift/.test(standalone), `href is ${standalone}`);

  const embedded = await linkHref(`${BASE}/?skin=tradeshift`, true);
  t.check("embedded: and so does it when the map is opened from the tracker",
    /skin=tradeshift/.test(embedded), `href is ${embedded}`);

  // THE COUNTERPART. A reader with no skin must not be given one, or
  // this check would be satisfied by a link that always appends.
  const plain = await linkHref(`${BASE}/map`, false);
  t.check("and an unskinned reader's return link stays clean",
    !/skin=/.test(plain), `href is ${plain}`);
}

t.check("the map rendered without page errors", errors.length === 0, errors.slice(0, 3).join("; "));

console.log(`\n  note  ${checkedLabels} small-country labels measured across ${checkedRegions} regions`);
await browser.close();
server.close();
process.exit(t.report() ? 0 : 1);
