#!/usr/bin/env node
// spec-row-layout.mjs — sections 02 and 03 are two cards to a row, and a
// row's value gets the card, not a ribbon down its right-hand side.
//
//   node tests/spec-row-layout.mjs
//
// WHY THIS EXISTS. Dan, 28 August 2026: "The File format & data
// specification is getting very long. See poland and malaysia countries as
// examples. Is it better to have two boxes, rather than three in the row,
// and widening the box so text is not wrapped as much?"
//
// He was right, and the corpus said the cause was not what it looked like.
// Section 02's total content has not grown at all -- the older half of the
// countries average 1165 visible characters and the newer half 1171. What
// had changed was that four countries had just been given researched
// "Identifiers & registration" cards (migration 714), whose rows are
// sentences; Poland's longest is 256 characters. Those sentences went into
// a 122px right-aligned ribbon and came out fifteen lines tall.
//
// Widening the cards is half the fix. The other half is that a 269px card
// spent 122px of itself on the key column, and 88% of section-02 values
// are longer than the remainder holds on one line. The measurement, ten
// countries at 1440px, counting rendered line boxes:
//
//                                 lines  worst value  values > 5 lines
//    three up, key beside value    660     15 lines         42   <- shipped
//    two up, key beside value      416      8 lines         21   <- Dan's ask
//    three up, key above value     367      7 lines         16
//    two up, KEY ABOVE VALUE       256      4 lines          0   <- adopted
//
// WHAT THIS FILE ACTUALLY GUARDS. Two separate things, because the two
// halves can regress independently and each one alone leaves the defect:
//
//   * the column COUNT, which is what Dan asked for, and which does
//     nothing at all on a phone -- at 390px the grid was already one
//     column and the ribbon was still 170px of a 351px card;
//   * the row SHAPE, which is the half that helps at every width, and
//     which this repo had already learned twice elsewhere and never
//     brought back here (see the comment on .spec-row in
//     shared/deep-dive-render.mjs).
//
// MEASURED, NOT PREDICTED. Line counts come from Range.getClientRects(),
// one rectangle per rendered line box, after the real font has loaded. The
// placement arithmetic would only tell us what our own CSS intended -- and
// it would have lied here: a 420px minmax, chosen off the 980px max-width
// in the stylesheet, silently produced ONE column, because .wrap is
// border-box and its 5vw padding comes out of that 980.
//
// ITS OWN BACKLOG FILE, deliberately. tests/data/deep-dive-backlog.json
// belongs to deep-dive-shape.mjs, which reads the database and would
// reject a rule it cannot evaluate -- correctly, since a typo'd rule name
// there exempts nothing and hides a real breach. A rendered rule cannot
// live in a list that a non-rendering suite polices.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { launch, suite, NOT_SET_UP } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("spec row layout");
const backlog = JSON.parse(readFileSync(join(REPO, "tests/data/spec-row-backlog.json"), "utf8"));

// The bands, and where each number comes from. Measured across all 76
// country pages under the adopted layout, in all four languages:
//
//   desktop 1440px   p50 1 line   p90 2   p99 4   max 7 (en) / 8 (de)
//   mobile   390px   p50 2 lines  p90 3   p99 5   max 8 (en)
//
// So six and seven sit just above the corpus and just below its outliers,
// which are all one country. This is the CONTENT band as well as the
// layout one: a row value long enough to run seven lines in a full-width
// card is prose that wanted to be a card body, and a rendered line count
// says that better than a character count could, because it is the thing
// the reader is actually looking at.
const MAX_LINES = { desktop: 6, mobile: 7 };
// A card that gives its value column less than this share of itself has
// gone back to a ribbon. Measured at 89-91% under the adopted layout and
// 45% under the old one, so there is no honest way to land in between.
const MIN_VALUE_SHARE = 0.7;
// Two, not three. The count Dan asked for, held by a check rather than by
// a comment -- this repo's controlled experiment on that point is in
// DEEP-DIVE-FRAMEWORK.md and the margin was +13% against +274%.
const MAX_CARDS_PER_ROW = 2;
const BACKLOG_CEILING = { "row.lines.desktop": 1, "row.lines.mobile": 1 };

// ---- the site, served from the replayed chain on an ephemeral port ----
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".woff2": "font/woff2", ".xml": "application/xml" };
const { d1 } = await openReplayDb();
const countries = (await d1.prepare(
  "SELECT slug, name_en FROM countries WHERE slug IS NOT NULL ORDER BY name_en").bind().all()).results;
const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const env = {
  eicc_content: d1,
  ASSETS: { async fetch(req) {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\//, "") || "index.html";
    const file = join(REPO, rel);
    if (!existsSync(file) || !statSync(file).isFile()) return new Response("not found", { status: 404 });
    return new Response(readFileSync(file), { headers: { "content-type": TYPES[extname(file)] || "application/octet-stream" } });
  } },
  SESSION_SECRET: "test-secret-not-a-real-one", ROI_PUBLIC: "true",
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

// One evaluate, run on every page: the rendered geometry of sections 02
// and 03. Nothing here reads a value back from the code that set it.
const PROBE = () => {
  const lines = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getClientRects().length; };
  const rows = [];
  const grids = [];
  for (const sec of document.querySelectorAll(".section")) {
    const numEl = sec.querySelector(".section-head .num");
    const num = numEl ? numEl.textContent.trim() : "";
    if (num !== "02" && num !== "03") continue;
    const grid = sec.querySelector(".spec-grid");
    if (!grid) continue;
    const cards = [...grid.querySelectorAll(":scope > .spec-card")];
    // Cards sharing a top edge are on the same rendered row. Reading the
    // grid's computed template would report what we asked for; this
    // reports where the boxes ended up.
    const byTop = new Map();
    for (const c of cards) {
      const top = Math.round(c.getBoundingClientRect().top);
      byTop.set(top, (byTop.get(top) || 0) + 1);
    }
    grids.push({ sec: num, cards: cards.length, widest: Math.max(0, ...byTop.values()) });
    for (const row of grid.querySelectorAll(".spec-row")) {
      const v = row.querySelector(".v");
      const k = row.querySelector(".k");
      if (!v) continue;
      const card = row.closest(".spec-card");
      const vb = v.getBoundingClientRect(), cb = card.getBoundingClientRect();
      const cs = getComputedStyle(card);
      const inner = cb.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      rows.push({
        sec: num, n: lines(v), chars: v.textContent.length,
        share: inner > 0 ? vb.width / inner : 0,
        key: (k ? k.textContent : "").trim().slice(0, 34),
        card: (card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : "").slice(0, 30),
      });
    }
  }
  return { rows, grids };
};

// English at both widths; the other three languages at desktop, where the
// long ones live. German is the one that runs longest and it is the reason
// the desktop band is not five.
const PASSES = [
  { key: "desktop", width: 1440, langs: ["en", "de", "fr", "es"] },
  { key: "mobile", width: 390, langs: ["en"] },
];

const over = { desktop: new Map(), mobile: new Map() };
const thin = [];
const wide = [];
let pagesSeen = 0, rowsSeen = 0, gridsSeen = 0, twoUpSeen = 0;
const failures = [];

for (const pass of PASSES) {
  const page = await browser.newPage({ viewport: { width: pass.width, height: 1000 } });
  for (const lang of pass.langs) {
    for (const { slug, name_en } of countries) {
      const resp = await page.goto(`${BASE}/${slug}?lang=${lang}`, { waitUntil: "domcontentloaded" });
      if (!resp || resp.status() !== 200) {
        failures.push(`${slug} (${lang}) answered ${resp ? resp.status() : "nothing"}`);
        continue;
      }
      pagesSeen += 1;
      const { rows, grids } = await page.evaluate(PROBE);
      rowsSeen += rows.length;
      for (const g of grids) {
        gridsSeen += 1;
        if (g.widest > MAX_CARDS_PER_ROW) {
          wide.push(`${name_en} sec ${g.sec}: ${g.widest} cards on one row at ${pass.width}px`);
        }
        if (g.widest === 2) twoUpSeen += 1;
      }
      for (const r of rows) {
        if (r.n > MAX_LINES[pass.key]) {
          const list = over[pass.key].get(name_en) || [];
          list.push(`sec ${r.sec} ${r.card} / ${r.key} = ${r.n} lines (${lang}, ${r.chars} ch)`);
          over[pass.key].set(name_en, list);
        }
        if (r.share < MIN_VALUE_SHARE) {
          thin.push(`${name_en} sec ${r.sec} ${r.key}: value is ${(r.share * 100).toFixed(0)}% of the card at ${pass.width}px`);
        }
      }
    }
  }
  await page.close();
}

// ---- 0. the sweep looked at something ---------------------------------
//
// Every check below is a "nothing was wrong" assertion, and every one of
// them passes trivially over an empty measurement. That is the failure
// mode this repo keeps finding, so the count is asserted first.
t.check("every country page answered, in every language swept",
  failures.length === 0, failures.slice(0, 6).join("; "));
t.check(`the sweep measured real geometry (${pagesSeen} page loads, ${rowsSeen} rows, ${gridsSeen} grids)`,
  pagesSeen >= countries.length * 4 && rowsSeen > 3000 && gridsSeen > 200,
  `${pagesSeen} pages, ${rowsSeen} rows, ${gridsSeen} grids`);

// ---- 1. two cards to a row, never three -------------------------------
t.check(`no section-02/03 grid puts more than ${MAX_CARDS_PER_ROW} cards on a rendered row`,
  wide.length === 0, wide.slice(0, 6).join("; "));

// ...and it has not quietly collapsed to one card per row either, which
// would satisfy the check above while wasting half the page. The corpus
// has plenty of multi-card sections, so a healthy sweep sees many.
t.check("two-up is actually happening, not one card per row everywhere",
  twoUpSeen > gridsSeen / 3, `${twoUpSeen} of ${gridsSeen} grids rendered a two-card row`);

// ---- 2. the value gets the card, not a ribbon -------------------------
//
// The single check that would have caught the reported defect. It cannot
// be satisfied by shortening the text, only by giving the value the width.
t.check(`every row value gets at least ${Math.round(MIN_VALUE_SHARE * 100)}% of its card's inner width`,
  thin.length === 0, thin.slice(0, 6).join("; "));

// ---- 3. no value runs longer than the band ----------------------------
for (const key of ["desktop", "mobile"]) {
  const known = new Set(backlog[`row.lines.${key}`] || []);
  const surprises = [...over[key].entries()].filter(([name]) => !known.has(name));
  t.check(`no unlisted country has a ${key} row value over ${MAX_LINES[key]} lines`,
    surprises.length === 0,
    surprises.slice(0, 5).map(([n, l]) => `${n}: ${l[0]}`).join("; ")
      + (surprises.length > 5 ? ` … and ${surprises.length - 5} more` : ""));
}

// ---- 4. the backlog may only shrink -----------------------------------
{
  const bad = [];
  for (const [rule, names] of Object.entries(backlog)) {
    if (!(rule in BACKLOG_CEILING)) { bad.push(`${rule} has no ceiling — add it deliberately`); continue; }
    if (names.length > BACKLOG_CEILING[rule]) bad.push(`${rule}: ${names.length} > ${BACKLOG_CEILING[rule]}`);
  }
  for (const rule of Object.keys(BACKLOG_CEILING)) {
    if (!(rule in backlog)) bad.push(`${rule} has a ceiling but no backlog entry — delete the ceiling too`);
  }
  t.check("no backlog rule has grown", bad.length === 0, bad.join("; "));
}

// ---- 5. a fixed country must leave the backlog ------------------------
//
// Without this the list is stale cover, and one country's fix silently
// pays for another's regression.
{
  const known = new Set(countries.map((c) => c.name_en));
  const stale = [];
  for (const key of ["desktop", "mobile"]) {
    for (const n of backlog[`row.lines.${key}`] || []) {
      if (!known.has(n)) { stale.push(`unknown country "${n}" under row.lines.${key}`); continue; }
      if (!over[key].has(n)) stale.push(`row.lines.${key}: ${n} now passes — delete the line`);
    }
  }
  t.check("every country on the backlog still actually breaches its rule",
    stale.length === 0, stale.join("; "));
}

const listed = Object.values(backlog).reduce((a, v) => a + v.length, 0);
console.log(`\n  note  ${rowsSeen} rendered rows across ${pagesSeen} page loads; `
  + `${listed} backlog entries in tests/data/spec-row-backlog.json`);
for (const key of ["desktop", "mobile"]) {
  for (const [name, list] of over[key]) console.log(`  note  ${key}: ${name} — ${list.length} row(s) over ${MAX_LINES[key]} lines, longest: ${list[0]}`);
}

await browser.close();
server.close();
process.exit(t.report() ? 0 : 1);
