#!/usr/bin/env node
// roi-hardcoded.mjs — is every string a reader SEES backed by D1?
//
//   node tests/roi-hardcoded.mjs
//
// roi-i18n.mjs asks the forward question: is every D1 row rendered? This
// asks the reverse, which is the one that matters for translation. A key
// can exist, be translated into four languages, and sit beside a
// hardcoded English literal that no translator can see and no reviewer
// reading the Spanish will notice.
//
// Method: render with every D1 value — page strings, benchmark labels,
// hints and citations, phase names and notes — replaced by «sentinel»,
// drive the page in a browser, and read the visible text. Anything still
// in English is hardcoded in the template.
//
// It is a browser test rather than a source scan on purpose. Half this
// page is built by client-side JavaScript from string concatenation, and
// a regex over the source cannot tell which of those fragments a reader
// ever sees.
//
// KNOWN is the inventory of what is still hardcoded, and it exists so
// the number can go DOWN and cannot go UP. Anything not on it fails.
// Removing an entry is the normal way to finish this work.
import { launch, suite } from "./lib/browser.mjs";
import { buildRoiPage } from "./lib/build-page.mjs";

const t = suite("ROI hardcoded strings");

// Legitimately not UI copy: sentinels, numbers, money, dates, acronyms,
// punctuation. Country names are excluded separately, from the database.
const SAFE = [
  /^[«»\s]*«[a-zA-Z0-9._]+»[«»\s]*$/,
  /^[\d\s.,%$£€+\-–—×/()]+$/,
  /^[A-Z]{2,5}$/,
  /^\d{4}-\d{2}-\d{2}$/,
  /^(Q[1-4]|20\d\d)$/,
  /^[·|/,;:.()\[\]—–-]+$/,
];
// Proper nouns and source names: these stay in English in every language.
const PROPER = ["Ardent Partners", "OECD", "ATO", "Deloitte Access Economics", "Deloitte",
  "HMRC", "APQC", "NHS", "Council Directive", "EN 16931", "ViDA", "Peppol", "DCTR",
  "Best-in-Class", "AUD", "USD", "GBP", "EUR", "e-invoicing", "E-Invoicing",
  "Compliance Corner", "Access Economics", "Back", "DBT", "Open Standards Benchmarking"];

// Numbers vary with the reader's inputs, so compare on shape not value.
const norm = (s) => s.replace(/[\d,]*\d/g, "#").replace(/\s+/g, " ").trim();

// ---- the inventory ---------------------------------------------------
// Every entry is a string a reader sees that does not come from D1.
// Grouped by why it is still here.
const KNOWN = new Set([
  // EMPTY, and that is the finished state: every string a reader sees on
  // this page now comes from D1. Migrations 547-554 moved 166 of them.
  //
  // If a line appears here again it should be a proper noun that must NOT
  // be translated — an organisation name, a legal instrument, a currency
  // code. Anything else belongs in the database, and the check above will
  // say so by name.
]);

const { file, countries } = await buildRoiPage({
  stubStrings: true, locked: false, subscribed: ["x"], signedInAs: "t@example.com" });
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 1200 } });
await page.goto("file://" + file);
await page.waitForTimeout(400);
await page.evaluate(() => { document.getElementById("assump").open = true; });
await page.click("#run");
await page.waitForTimeout(1400);
await page.evaluate(() => {
  for (const id of ["notes", "adjust"]) {
    const d = document.getElementById(id);
    if (d && d.tagName === "DETAILS") d.open = true;
  }
});
await page.waitForTimeout(500);

// ---- THE ITINERARY, WHICH IS THE PART THAT WAS WRONG -------------------
//
// Until 17 August 2026 the walk stopped above this line: render,
// calculate, open three panels, read. Correct logic, and it reported ZERO
// hardcoded strings while nineteen sat in the renderer, because every one
// of them is CONDITIONAL and this file never drove a condition.
//
// What it could not see:
//   * the fixed-rate FX note, which is empty under USD by design;
//   * the whole expanded wave chart -- PROGRAMME, WAVE 2027-01-01,
//     EU-WIDE, NO FIXED DEADLINE and every bar tooltip -- which exists
//     only after #ganttToggle;
//   * six scenario guards, each of which needs a broken scenario.
//
// A check that walks 60% of its subject reports PASS in the same words as
// one that walks all of it. So the route is now explicit, and each step
// says which strings it exists to reach. Adding a conditional string
// without adding a step here is the failure this is built to make loud.

// 1. Currency. The FX note renders nothing under USD.
await page.selectOption("#cur", "EUR");
await page.waitForTimeout(400);

// 2. The expanded chart, and the table view beside it.
for (const id of ["ganttToggle", "tblToggle"]) {
  await page.evaluate((i) => { const b = document.getElementById(i); if (b) b.click(); }, id);
  await page.waitForTimeout(300);
}

// 3. Two guard conditions, driven rather than waited for.
//
//    Zero integrations against a real mandate: set the ERP count to zero
//    with countries selected. Payback under a month: a trivial one-off
//    cost against a full-size saving.
//
//    Deliberately NOT all six. Three of the remaining four need a
//    contradiction between two benchmarks to hold at once, and a test
//    that constructs those becomes a second model of the model. Two is
//    enough to prove the route exists and to catch the common case; the
//    others are covered by the D1 side -- every guard.% row is asserted
//    to exist and to keep its slots in migrations 550 and 574.
await page.fill("#erp", "0");
await page.click("#run");
await page.waitForTimeout(900);
await page.fill("#erp", "1");
await page.fill("#cImplS", "1");
await page.fill("#cImplC", "1");
await page.fill("#cPlat", "0");
await page.fill("#cRun", "0");
await page.click("#run");
await page.waitForTimeout(900);

// 4. And back to a normal scenario, with everything still open, so the
//    walk below sees the ordinary page as well as the broken one.
await page.fill("#cImplS", "60000");
await page.fill("#cImplC", "180000");
await page.click("#run");
await page.waitForTimeout(900);

const chunks = await page.evaluate(() => {
  const out = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const p = n.parentElement;
    if (!p || p.closest("script,style")) continue;
    const s = n.textContent.replace(/\s+/g, " ").trim();
    if (s) out.push(s);
  }
  for (const e of document.querySelectorAll("[aria-label],[title],[placeholder]")) {
    for (const a of ["aria-label", "title", "placeholder"]) {
      const v = e.getAttribute(a);
      if (v && v.trim()) out.push(v.replace(/\s+/g, " ").trim());
    }
  }
  return out;
});
await browser.close();

const names = new Set(countries.flatMap((c) => [c[0], c[1]]));
const found = new Set();
for (const raw of chunks) {
  if (SAFE.some((re) => re.test(raw))) continue;
  if (names.has(raw)) continue;
  let probe = raw;
  // Country names are data, not copy — and they appear in comma-joined
  // lists ("Czech Republic, Portugal, Australia"), which an exact-match
  // filter never catches. Strip them all before probing.
  for (const n of names) if (n.length > 3) probe = probe.split(n).join("");
  for (const p of PROPER) probe = probe.split(p).join("");
  // A TRUNCATED SENTINEL IS STILL A SENTINEL. The wave chart shortens a
  // row name that will not fit its gutter and appends an ellipsis, so a
  // stubbed «country.eu» can reach the page as «coun… -- no closing
  // guillemet, and the strip below used to miss it and report it as
  // hardcoded English. Not a real finding, but a real behaviour: the
  // detector has to understand truncation or it reports the renderer's
  // own layout as untranslated copy.
  probe = probe.replace(/«[a-zA-Z0-9._]*[»\u2026]/g, "")
    .replace(/«[a-zA-Z0-9._]+»/g, "")
    .replace(/[\d\s.,%$£€+\-–—×/()·|:;\[\]]+/g, " ").trim();
  // TWO LETTERS, NOT THREE, since 17 August 2026.
  //
  // The old threshold required three consecutive lowercase letters, which
  // is the right instinct -- the page is full of two-letter country
  // codes, single-letter evidence grades and currency symbols, and
  // reporting those as untranslated copy would bury every real finding.
  //
  // It also hid "mo". The payback figure printed "6mo" and "<1mo" on both
  // the page and the PDF, in English, for as long as the figure has
  // existed, and this line skipped it -- not for want of walking there,
  // but because the thing it found was too short to look like a word.
  // German writes Mon. and French mois; the abbreviation is copy.
  //
  // So: two letters, and the false positives that lets through are
  // handled by NAME in SAFE and PROPER above rather than by a length
  // rule. A threshold that silently exempts a class of string is a
  // shorter itinerary wearing a different hat.
  if (probe.length < 2 || !/[a-z]{2}/.test(probe)) continue;
  found.add(norm(raw));
}

const unexpected = [...found].filter((s) => !KNOWN.has(s));
const fixed = [...KNOWN].filter((s) => !found.has(s));

t.check(`the page renders ${found.size} strings that do not come from D1, all of them known`,
  unexpected.length === 0,
  unexpected.length
    ? `${unexpected.length} NEW hardcoded string(s):\n    ` + unexpected.map((s) => JSON.stringify(s)).join("\n    ")
      + "\n    Move it into D1 with a t() call, or add it to KNOWN if it is a proper noun."
    : "");

// Progress is the point: when a string moves into D1 it should leave the
// inventory, and a stale entry hides the next regression behind it.
t.check(`the inventory has no stale entries (${KNOWN.size} known, ${fixed.length} no longer present)`,
  fixed.length === 0,
  fixed.length ? `Fixed or reworded — delete from KNOWN:\n    `
    + fixed.map((s) => JSON.stringify(s)).join("\n    ") : "");

console.log(`  note  ${found.size} strings still hardcoded; every one is inventoried above.`);
process.exit(t.report() ? 0 : 1);
