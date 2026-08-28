#!/usr/bin/env node
// palette.mjs — one palette, in sync, contrast-checked, in both themes.
//
//   node tests/palette.mjs
//
// ---- THE CHECK THIS FILE EXISTS FOR ------------------------------------
//
// On 28 August 2026 I told Dan the palette was defined sixteen times and
// that all sixteen were byte-identical, so consolidating them would be
// mechanical. Both halves were wrong. It was 23 :root blocks across 18
// files, and `--stamp-dim` was #7c3648 in four education pages against
// #7c3628 in the other fourteen places -- a deltaE76 of 19.8 where a
// just-noticeable difference is about 2.3, rendering live on the
// pitfall-card border of education-preparing-for-mandate.
//
// I produced that claim by comparing four properties -- ink, paper,
// stamp, soon -- finding them identical and concluding the palette was.
// Those four have never drifted. The check could not have failed on the
// one that did, which is the seventh time this repository has found a
// check satisfied by something other than the thing it claimed to test.
//
// So: check 1 below asserts that NO property is ever defined with two
// different values anywhere in the tree, which is the check that would
// have caught it, and it is break-tested in its own comment.
import { suite, launch } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, statSync } from "node:fs";
import { extname, normalize } from "node:path";
import { DARK, LIGHT, PARTNER_THEMES, CONTRAST_PAIRS, contrast } from "../shared/palette.mjs";
import { PALETTE_FILES } from "../tools/sync-palette.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("palette");

// ---- 1. no property has two values anywhere in the tree ---------------
//
// Break-tested: changing one --stamp-dim back to #7c3648 in a single
// education page fails this with both values and both filenames named.
const SCAN = [...PALETTE_FILES, "index.html", "map-panel.js", "i18n/i18n.js"];
const defs = new Map();
for (const rel of SCAN) {
  let src;
  try { src = readFileSync(join(REPO, rel), "utf8"); } catch { continue; }
  for (const block of src.match(/:root(?:\[[^\]]*\])?\s*\{(?:\s*--[\w-]+\s*:[^;{}]*;)+\s*\}/g) || []) {
    // Partner blocks are allowed to differ -- that is what a theme IS.
    if (/:root\[/.test(block)) continue;
    for (const [, prop, val] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const v = val.trim();
      if (!defs.has(prop)) defs.set(prop, new Map());
      const m = defs.get(prop);
      if (!m.has(v)) m.set(v, []);
      m.get(v).push(rel);
    }
  }
}
const conflicts = [...defs.entries()]
  .filter(([, vals]) => vals.size > 1)
  .map(([prop, vals]) => `${prop}: ` + [...vals.entries()]
    .map(([v, files]) => `${v} in ${files.length} file(s) (${files[0]})`).join(" vs "));
t.check("no property is defined with two different values", conflicts.length === 0,
  conflicts.join("; "));

// ---- 2. the generated blocks match the module -------------------------
let syncOut = "";
try {
  syncOut = execFileSync("node", [join(REPO, "tools/sync-palette.mjs"), "--check"],
    { cwd: REPO, encoding: "utf8" });
} catch (err) {
  syncOut = String((err && (err.stdout || err.stderr)) || err);
}
t.check("every file's palette block matches shared/palette.mjs",
  /in sync/.test(syncOut), syncOut.trim().split("\n").slice(0, 3).join(" | "));

// ---- 3. no page defines a palette the generator does not know about ---
//
// A page that grows its own :root is the mechanism that produced the
// drift in the first place. This fails on the page rather than waiting
// for the values to disagree.
const strayFiles = [];
for (const rel of ["index.html", "map-panel.js", "i18n/i18n.js"]) {
  let src;
  try { src = readFileSync(join(REPO, rel), "utf8"); } catch { continue; }
  if (/:root\s*\{(?:\s*--[\w-]+\s*:[^;{}]*;)+\s*\}/.test(src)) strayFiles.push(rel);
}
t.check("no file outside the generator's list defines the palette",
  strayFiles.length === 0, strayFiles.join(", "));

// ---- 4. every theme meets every contrast floor ------------------------
//
// The pairs are declared in shared/palette.mjs beside the values, and
// each names a place two of them actually meet in the CSS. A partner
// palette cannot be registered without being measured.
for (const [name, theme] of [["default", DARK], ...Object.entries(PARTNER_THEMES)]) {
  const missing = CONTRAST_PAIRS.filter(([, a, b]) => !theme[a] || !theme[b])
    .map(([label]) => label);
  t.check(`${name}: every property a contrast pair names is defined`,
    missing.length === 0, missing.join(", "));
  const failed = CONTRAST_PAIRS
    .filter(([, a, b]) => theme[a] && theme[b])
    .map(([label, a, b, need]) => [label, contrast(theme[a], theme[b]), need])
    .filter(([, got, need]) => got < need)
    .map(([label, got, need]) => `${label} ${got.toFixed(2)} < ${need}`);
  t.check(`${name}: every contrast pair clears its floor`, failed.length === 0,
    failed.join("; "));
}

// ---- 5. the themes agree on which properties exist --------------------
//
// A partner theme missing a property inherits the default's value for it,
// which across a light/dark boundary means dark-theme text on a light
// surface. Invisible, and invisible only to that partner's readers.
for (const [slug, theme] of Object.entries(PARTNER_THEMES)) {
  const missing = Object.keys(DARK).filter((k) => !(k in theme));
  const extra = Object.keys(theme).filter((k) => !(k in DARK));
  t.check(`${slug} defines exactly the properties the default does`,
    missing.length === 0 && extra.length === 0,
    [missing.length ? `missing ${missing.join(",")}` : "",
      extra.length ? `extra ${extra.join(",")}` : ""].filter(Boolean).join(" | "));
}

// ---- 6. D1 and the module agree --------------------------------------
//
// The migration's rows are generated from the module. If somebody edits
// one without the other, the site would theme from D1 while every test
// measured the module -- the two-sources problem this whole file exists
// to prevent, one level up.
const { d1 } = await openReplayDb();
const rows = (await d1.prepare(
  `SELECT p.slug, pp.prop, pp.value FROM partner_palette pp
     JOIN partners p ON p.id = pp.partner_id`).all()).results || [];
const byPartner = {};
for (const r of rows) (byPartner[r.slug] ||= {})[r.prop] = r.value;
for (const [slug, theme] of Object.entries(PARTNER_THEMES)) {
  const stored = byPartner[slug] || {};
  const diffs = Object.entries(theme)
    .filter(([k]) => k !== "--radius")
    .filter(([k, v]) => stored[k] !== v)
    .map(([k, v]) => `${k}: module ${v} vs D1 ${stored[k] ?? "(absent)"}`);
  t.check(`${slug}'s palette in D1 matches the module`, diffs.length === 0,
    diffs.slice(0, 3).join("; "));
}

// ---- 7. the boot script cannot be fooled ------------------------------
const boot = (await import("../shared/palette.mjs")).themeBootScript();
t.check("the boot script is inline and sets the attribute",
  boot.startsWith("<script>") && boot.includes("data-eicc-theme"));
t.check("the boot script only honours a registered slug",
  Object.keys(PARTNER_THEMES).every((s) => boot.includes(s))
  && boot.includes("indexOf"));

// ---- 8. and it works in a browser, both ways --------------------------
//
// SERVES ITSELF ON AN EPHEMERAL PORT. A fixed port is a trap this repo has
// already paid for: map-labels.mjs assumed a `npm run preview` on 8788,
// was green twice, and failed the day that server was not running. It also
// has to be http rather than file://, because a cookie is the whole
// mechanism under test and file:// has no cookie jar.
//
// Reading the module tells you what the code says. Loading the page with
// the cookie set tells you what a reader gets, which is the only version
// of this that can fail on a boot script that throws.
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const rel = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  let file = join(REPO, rel);
  if (!existsSync(file) || !statSync(file).isFile()) file += ".html";
  if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end("nope"); }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

const browser = await launch();
const results = [];
const jsErrors = [];
for (const [tag, slug, expect] of [["no cookie", null, DARK["--ink"]],
  ["tradeshift", "tradeshift", LIGHT["--ink"]],
  ["forged slug", "not-a-partner", DARK["--ink"]]]) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
  if (slug) {
    await ctx.addCookies([{ name: "eicc_theme", value: slug, domain: "127.0.0.1", path: "/" }]);
  }
  const page = await ctx.newPage();
  // pageerror only, not t.watch(). The tracker pulls a font and a
  // favicon that this bare static server does not carry, and a console
  // 404 for those is a fact about the harness rather than about the
  // theme. A thrown boot script IS a fact about the theme, and that is
  // what pageerror reports.
  page.on("pageerror", (e) => jsErrors.push(`${tag}: ${e.message}`));
  await page.goto(`${ORIGIN}/einvoicing-compliance-tracker.html`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  const ink = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--ink").trim());
  results.push([tag, ink, expect]);
  await ctx.close();
}
await browser.close();
server.close();
t.check("the boot script throws nothing in any of the three cases",
  jsErrors.length === 0, jsErrors.join("; "));
for (const [tag, got, expect] of results) {
  t.check(`in a browser, "${tag}" resolves --ink to ${expect}`, got === expect, `got ${got}`);
}

process.exit(t.report() ? 0 : 1);
