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
  // Generated from a real run rather than typed by hand — the same
  // rule the string migrations follow, and for the same reason: a
  // retyped inventory drifts from what the page actually renders and
  // then hides the next regression behind a stale entry.
  "# errored invoices",
  "# jurisdictions with no fixed deadline, some already in force. Indicative placement only — nothing can start before contracting completes, and there is no date to work back from. Czech Republic, Portugal, Australia, New Zealand, Canada, Ecuador",
  "(# data)",
  "(# estimates)",
  "(updated Jan #)",
  ". Your # AP invoices imply",
  "; # clearance or reporting jurisdictions put",
  "ATO / Deloitte task times",
  "HMRC / DBT consultation #",
  "Live mandate data from this site's own tracker: status, model and dated deadlines per jurisdiction, each traceable to the cited legal instrument on that country's deep dive.",
  "Mechanism evidenced",
  "Our assumption, capped by Ardent exception gap",
  "Phase durations are practitioner estimates for a country rollout once a platform is in place, held in D# and editable above. No analyst firm publishes credible per-country e-invoicing implementation durations — this was checked.",
  "Wave #-#-# — # jurisdiction, #w effort, #w elapsed European Union",
  "Wave #-#-# — # jurisdiction, #w effort, #w elapsed Poland",
  "Wave #-#-# — # jurisdiction, #w effort, #w elapsed United Kingdom",
  "Your assumption. Nothing is claimed for this figure — it is exposed so the model can be argued with rather than believed.",
  "hide ▴",
  "of that in scope",
  "source",
  "«contract.name» — # weeks (#-#-# to #-#-#) Programme-level: run once, not per country.",
  "«notes.headcount» $# of $#, or #%; the rest is review, technology and overhead. «notes.headcount#»",
  "«vendor.name» — # weeks (#-#-# to #-#-#) Programme-level: run once, not per country.",
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
  probe = probe.replace(/«[a-zA-Z0-9._]+»/g, "")
    .replace(/[\d\s.,%$£€+\-–—×/()·|:;\[\]]+/g, " ").trim();
  if (probe.length < 3 || !/[a-z]{3}/.test(probe)) continue;
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
