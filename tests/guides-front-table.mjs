#!/usr/bin/env node
// guides-front-table.mjs — the compliance guide's front-page table must
// not announce an obligation the country page denies, nor deny one it
// asserts.
//
//   node tests/guides-front-table.mjs
//
// WHY THIS FILE WAS REWRITTEN, 1 September 2026, and why the rewrite is
// the interesting part.
//
// The version before this one guarded a single derived word. The "next
// dated obligation" column fell back to a pill when a country had no
// future date, and until 27 August that pill read "In force" whenever a
// country had milestones and none was in the future — a heuristic that
// quietly asserted every past milestone binds a supplier today. Dan found
// it on Liechtenstein, in a generated PDF.
//
// THE 27 AUGUST FIX SWAPPED THE HEURISTIC AND KEPT THE COLLAPSE. The word
// became "active in any of b2g/b2b/b2c", derived from the headline facts
// instead of the milestones, and this file was written to hold it there.
// Both of its first two checks passed continuously while the table was
// still wrong, in two directions at once:
//
//   · THE NETHERLANDS, which Dan found on 1 September. b2g_status is
//     `active` and correctly so — its own note reads "Central-government
//     suppliers must issue; other public bodies need only receive". One
//     word cannot carry that, so a narrow duty printed as an unqualified
//     IN FORCE. Twelve more countries are `active` in B2G only.
//   · TAIWAN, which nobody found, because check 2 of this file REQUIRED
//     the error. e-Reporting was not among the three statuses the rule
//     read, so a country voluntary on all three invoicing channels and
//     ACTIVE on e-Reporting printed "No mandate" on the front page and
//     ACTIVE on its own tile one page later. Bulgaria, the Czech
//     Republic, the Philippines and Slovakia sit in the same state and
//     were hidden only by having a future date to show instead.
//
// A CHECK THAT PINS A COLLAPSE IN PLACE IS WORSE THAN NO CHECK. The old
// second assertion — "every country with an active issuing obligation IS
// called in force" — was written to stop a lazy fix that made the pill
// cautious everywhere. It was right about that risk and it also made the
// real repair unshippable: it fails, by construction, the moment the
// front page stops collapsing four channels into one word.
//
// SO THIS FILE NO LONGER CHECKS A VERDICT. There is no verdict to check.
// The Model column prints all four channels in the tiles' own vocabulary,
// and what is asserted is the only thing that now matters: that what the
// front page prints is what the database holds, for every country, in
// every channel, in every language — and that the date column has gone
// back to answering the question in its own heading.
//
// THE EXPECTED WORDS ARE A LITERAL TABLE, not an import. Deriving them
// from channelStatuses would test that function against itself and pass
// on any rename it made. This is the same reason the whitepaper suite
// holds source-type tags as a fixed table per language.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";
import { getGuideBundle, renderGuideDocument } from "../shared/guides-render.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const TODAY = new Date().toISOString().slice(0, 10);
const t = suite("guides front table");
const { d1 } = await openReplayDb();
const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

// ---- the vocabulary, written out ---------------------------------------
const WORD = {
  active: "ACTIVE", planned: "PLANNED", voluntary: "VOLUNTARY",
  no_mandate: "NO MANDATE", unknown: "NOT CONFIRMED",
};
// e-Reporting differs in exactly one place and it is deliberate: the TILE
// prints a cadence for `active` and `on_request` (MONTHLY, ON REQUEST)
// because a cadence is what a reader builds for. A one-line summary cell
// has no room for both, and a column whose other three rows are statuses
// cannot answer a different question on the fourth. See channelStatuses.
const WORD_EREP = { ...WORD, active: "ACTIVE", on_request: "ON REQUEST" };

const CHANNELS = [
  ["B2G", "b2g_status", WORD],
  ["B2B", "b2b_status", WORD],
  ["B2C", "b2c_status", WORD],
  ["E-REPORTING", "ereporting_status", WORD_EREP],
];

const facts = await all(`
  SELECT c.name_en AS name, c.id,
         f.b2g_status, f.b2b_status, f.b2c_status, f.ereporting_status
    FROM country_headline_facts f
    JOIN countries c ON c.id = f.country_id
   WHERE c.in_picker = 1
   ORDER BY c.name_en`);
t.check("there are countries to check", facts.length >= 60, `${facts.length} countries`);

const names = facts.map((f) => f.name);
const byName = new Map(facts.map((f) => [f.name, f]));

// ---- render the real document, once per language -----------------------
//
// Rendered rather than reasoned about. Every defect this file exists for
// was visible on the page and invisible to a test that asked the module
// what it would have said.
function flatten(node, prefix, out) {
  for (const [k, v] of Object.entries(node || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else if (typeof v === "string") out[key] = v;
  }
  return out;
}
const stringsFor = (lang) => flatten(
  JSON.parse(readFileSync(join(REPO, "i18n", `${lang}.json`), "utf8")).guides, "", {});

const ROW = /<tr>\s*<td>(.*?)<\/td>\s*<td class="date">(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td class="model">(.*?)<\/td>\s*<\/tr>/gs;
const CH = /<span class="ch (\w+)"><span class="cl">(.*?)<\/span><span class="cv">(.*?)<\/span><\/span>/g;
const strip = (s) => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();
// The country cell carries EU and COMPLEX pills after the name. Stripping
// tags alone glues them on ("Austria EU"), which silently turned every
// lookup below into a miss — and a miss that reported itself as "no
// stored facts", i.e. as a data problem rather than a parsing one. Cut at
// the first pill instead.
const countryName = (cell) => strip(cell.split('<span class="pill')[0]);

async function frontRows(lang) {
  const bundle = await getGuideBundle(d1, names, lang);
  const { html } = renderGuideDocument({
    bundle, order: names, lang, strings: stringsFor(lang), today: TODAY,
    siteOrigin: "https://e-invoicingcompliancecorner.com" });
  const cover = html.slice(0, html.indexOf('<section class="country"'));
  const rows = [];
  for (const m of cover.matchAll(ROW)) {
    const channels = [...m[4].matchAll(CH)].map((c) => ({ tone: c[1], label: strip(c[2]), word: strip(c[3]) }));
    rows.push({ name: countryName(m[1]), date: m[2], what: strip(m[3]), channels });
  }
  return rows;
}

const en = await frontRows("en");
t.check("every selected country has a row on the front page",
  en.length === names.length, `${en.length} rows for ${names.length} countries`);

// ---- 1. four channels on every row, in order ---------------------------
//
// COUNTED AND NAMED, because the failure that shipped was a MISSING
// channel rather than a wrong one. A check that only validated the
// channels it found would have passed on Taiwan's three-line cell.
{
  const bad = en.filter((r) => r.channels.length !== 4
    || r.channels.some((c, i) => c.label.toUpperCase() !== CHANNELS[i][0]));
  t.check("every row prints all four channels, B2G / B2B / B2C / E-REPORTING",
    bad.length === 0,
    bad.slice(0, 6).map((r) => `${r.name} [${r.channels.map((c) => c.label).join("|") || "none"}]`).join("; "));
}

// ---- 2. every printed word is the word the database holds --------------
{
  const wrong = [];
  for (const r of en) {
    const f = byName.get(r.name);
    if (!f) { wrong.push(`${r.name}: no stored facts`); continue; }
    CHANNELS.forEach(([label, col, map], i) => {
      const want = map[f[col]] || map.unknown;
      const got = (r.channels[i] || {}).word;
      if (got !== want) wrong.push(`${r.name} ${label}: stored ${f[col]} -> printed "${got}", expected "${want}"`);
    });
  }
  t.check(`all four channels agree with D1 across ${en.length} countries`,
    wrong.length === 0, wrong.slice(0, 8).join("; "));
}

// ---- 3. no cell is ever blank ------------------------------------------
//
// The rule this project keeps restating and keeps having to enforce: a
// blank where a duty might sit reads as "no requirement", which is a
// different claim and the one that gets somebody fined. An unknown prints
// NOT CONFIRMED.
{
  const blank = en.filter((r) => r.channels.some((c) => !c.word));
  t.check("no channel renders blank", blank.length === 0,
    blank.map((r) => r.name).join("; "));
}

// ---- 4. e-Reporting is represented, named country by country -----------
//
// The regression Taiwan exposed, guarded by name rather than by count so
// that a country acquiring or losing a live e-Reporting regime has to be
// edited here by whoever records it. A count would absorb it silently.
{
  const live = facts.filter((f) => f.ereporting_status === "active"
    && !["b2g_status", "b2b_status", "b2c_status"].some((c) => f[c] === "active"));
  const KNOWN = ["Bulgaria", "Czech Republic", "Philippines", "Slovakia", "Taiwan"];
  t.check(`the countries whose only live regime is e-Reporting are still ${KNOWN.join(", ")}`,
    JSON.stringify(live.map((f) => f.name)) === JSON.stringify(KNOWN),
    live.map((f) => f.name).join(", "));
  const hidden = live.filter((f) => {
    const r = en.find((x) => x.name === f.name);
    return !r || (r.channels[3] || {}).word !== "ACTIVE";
  });
  t.check("and each of them prints E-REPORTING ACTIVE on the front page",
    hidden.length === 0, hidden.map((f) => f.name).join("; "));
}

// ---- 5. the date column no longer states a status ----------------------
//
// The deleted vocabulary, in all four languages, asserted absent from the
// column that used to carry it. Checking only the English would pass on a
// German document still printing "In Kraft".
{
  const RETIRED = ["pill.inforce", "pill.unconfirmed", "pill.nomandate"];
  const offenders = [];
  for (const lang of ["en", "de", "es", "fr"]) {
    const s = stringsFor(lang);
    const rows = lang === "en" ? en : await frontRows(lang);
    for (const r of rows) {
      for (const k of RETIRED) {
        const v = s[k];
        if (v && r.date.includes(v)) offenders.push(`${lang} ${r.name}: "${v}"`);
      }
    }
  }
  t.check("no status word survives in the next-dated-obligation column",
    offenders.length === 0, offenders.slice(0, 6).join("; "));
}

// ---- 6. the retired keys are gone from the i18n files ------------------
//
// The deletion asserted, not assumed. 733 retired pdf.jur the same way
// rather than leaving a key with no call site for an unused-key check to
// excuse, and the KEPT list in roi-i18n is deliberately empty.
{
  const left = [];
  for (const lang of ["en", "de", "es", "fr"]) {
    const pill = ((JSON.parse(readFileSync(join(REPO, "i18n", `${lang}.json`), "utf8")).guides || {}).pill) || {};
    for (const k of ["inforce", "unconfirmed", "nomandate"]) {
      if (pill[k]) left.push(`${lang}: guides.pill.${k}`);
    }
    if (!pill.nodate) left.push(`${lang}: guides.pill.nodate MISSING`);
  }
  t.check("the three retired pill strings are deleted and pill.nodate is present in all four languages",
    left.length === 0, left.join("; "));
}

// ---- 7. every status word is translated, in every language -------------
//
// A missing key falls back silently to English, which on a printed German
// document is not obviously a bug to the person holding it. Asserted
// against the file rather than the render, so a fallback cannot hide it.
{
  const KEYS = ["hl.active", "hl.planned", "hl.voluntary", "hl.none", "hl.unknown",
    "hl.er.none", "hl.er.planned", "hl.freq.on_request",
    "hl.seg.b2g", "hl.seg.b2b", "hl.seg.b2c", "hl.lbl.ereporting"];
  const missing = [];
  for (const lang of ["en", "de", "es", "fr"]) {
    const s = stringsFor(lang);
    for (const k of KEYS) if (!s[k]) missing.push(`${lang}: guides.${k}`);
  }
  t.check("every word the Model column can print is translated in all four languages",
    missing.length === 0, missing.join("; "));
}

const spread = {};
for (const r of en) for (const c of r.channels) spread[c.word] = (spread[c.word] || 0) + 1;
console.log(`\n  note  ${en.length} countries x 4 channels: `
  + Object.entries(spread).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", "));

process.exit(t.report() ? 0 : 1);
