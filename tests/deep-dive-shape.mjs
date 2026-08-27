#!/usr/bin/env node
// deep-dive-shape.mjs — every country page keeps the same shape.
//
//   node tests/deep-dive-shape.mjs
//
// WHY THIS EXISTS. Dan, 27 August 2026, after the Hong Kong deployment:
// "recent deployments are straying in terms of style and consistency and
// content." He was right on every count. The measurement is in the
// project as claude/deep-dive-drift.md; the rules are in
// DEEP-DIVE-FRAMEWORK.md, which this file enforces.
//
// THIS IS THE SECOND OCCURRENCE. Migration 355 records the first —
// mandate_summary and timeline_intro crept to 191 words by Hungary, Dan
// flagged it, six countries were rewritten, and the fix was to write a
// length target into DEEP-DIVE-MIGRATION-CHECKLIST.md. It recurred
// within three weeks, on more fields, harder.
//
// The reason is measurable in our own corpus. Same pages, same authors,
// same weeks: b2g_note, which carries an enforced 150-character
// invariant, went 81 -> 92 chars (+13%) and never neared its ceiling.
// compliance_model, which carried runbook advice, went 42 -> 157 chars
// (+274%). Advice does not hold a line. So this is a test and not a
// paragraph, and that is the entire point of it.
//
// WHY IT IS GREEN WHILE 368 BREACHES EXIST. A permanently red suite
// teaches people to ignore the suite. Every country breaching a rule
// today is named in tests/data/deep-dive-backlog.json, which IS the
// backlog for the normalisation bundles. The three properties below are
// what stop that file from becoming an excuse:
//
//   - not listed + breaching  -> FAIL. New work meets the framework now.
//   - listed + no longer breaching -> FAIL, delete the line. Without
//     this the list goes stale and one country's fix silently pays for
//     another's regression.
//   - the list may only shrink.
//
// Precedent for naming strays rather than weakening a rule:
// tests/guides-front-table.mjs, which names the five countries that read
// "In force" with no mandate for weeks.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("deep dive shape");
const { d1 } = await openReplayDb();
const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

const backlog = JSON.parse(readFileSync(join(REPO, "tests/data/deep-dive-backlog.json"), "utf8"));
// Counted before anything is checked, so the "may only shrink" test is
// comparing against the file as committed rather than as mutated.
// PER-RULE ceilings, not one total. A single number lets one rule grow
// while another shrinks -- substitution, which is the drift this whole
// file exists to catch, wearing a different hat. A rule missing from this
// map is an error, so ADDING a rule is a deliberate edit here.
const BACKLOG_CEILING = {
  "compliance_model.max": 35,
  "count.file_format": 18,
  "count.penalties_related": 7,
  "count.portals": 4,
  "count.scope_transmission": 4,
  "count.stats": 1,
  "count.steps": 8,
  "file_format_intro.max": 40,
  "footer_disclaimer.max": 19,
  "mandate_summary.max": 29,
  "penalties_intro.max": 38,
  "portal.label": 28,
  "scope_intro.max": 44,
  "spine.notyet": 72,
  "steps_intro.max": 31,
  "timeline_intro.max": 45,
  "translation.overrun": 1,
};

const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
const chars = (s) => String(s || "").length;

// ---- the bands, and where compliance_model's ceiling comes from -------
//
// 64 is NOT a style choice. The compliance guide prints compliance_model
// in its Model column through clip(model.split(/[.;]/)[0], 64), so a
// longer value is truncated mid-phrase in a PDF a reader downloads.
// Read the constant out of the source rather than restating it, so the
// framework and the renderer cannot drift apart -- which is the exact
// failure mode this whole file exists to catch.
const guidesSrc = readFileSync(join(REPO, "shared/guides-render.mjs"), "utf8");
const clipMatch = guidesSrc.match(/clip\(String\(r\.model[^)]*\)\.split\([^)]*\)\[0\],\s*(\d+)\)/);
t.check("the guide's model-column clip is still readable from source",
  clipMatch !== null, clipMatch ? `clip at ${clipMatch[1]}` : "pattern not found — update this test with the renderer");
const GUIDE_CLIP = clipMatch ? Number(clipMatch[1]) : 64;

const PROSE = {
  compliance_model:  { unit: "chars", min: 20, max: GUIDE_CLIP },
  mandate_summary:   { unit: "words", min: 35, max: 75 },
  timeline_intro:    { unit: "words", min: 18, max: 40 },
  file_format_intro: { unit: "words", min: 14, max: 35 },
  scope_intro:       { unit: "words", min: 15, max: 35 },
  steps_intro:       { unit: "words", min: 13, max: 40 },
  penalties_intro:   { unit: "words", min: 15, max: 35 },
  footer_disclaimer: { unit: "words", min: 45, max: 70 },
};
const COUNTS = {
  file_format:        [3, 5],
  scope_transmission: [2, 4],
  penalties_related:  [3, 4],
  steps:              [5, 7],
  stats:              [3, 5],
  portals:            [1, 3],
};
const LABEL_MAX = 48;
// es/de/fr run 15-40% longer than English for the same content -- normal,
// not drift. Judged at 1.5x so gross overruns still fail.
const LANG_ALLOWANCE = 1.5;

// ---- the data ---------------------------------------------------------
const prose = await all(`
  SELECT c.name_en AS name, t.lang, t.compliance_model, t.mandate_summary, t.timeline_intro,
         t.file_format_intro, t.scope_intro, t.steps_intro, t.penalties_intro, t.footer_disclaimer
    FROM deep_dive_page_translations t JOIN countries c ON c.id = t.country_id
   ORDER BY c.name_en, t.lang`);
const en = prose.filter((r) => r.lang === "en");
t.check("there are country pages to measure", en.length >= 70, `${en.length} pages, ${prose.length} translations`);

const struct = await all(`
  SELECT c.name_en AS name,
    (SELECT count(*) FROM deep_dive_cards d WHERE d.country_id=c.id AND d.section='file_format') AS file_format,
    (SELECT count(*) FROM deep_dive_cards d WHERE d.country_id=c.id AND d.section='scope_transmission') AS scope_transmission,
    (SELECT count(*) FROM deep_dive_cards d WHERE d.country_id=c.id AND d.section='penalties_related') AS penalties_related,
    (SELECT count(*) FROM deep_dive_steps s WHERE s.country_id=c.id) AS steps,
    (SELECT count(*) FROM deep_dive_stats s WHERE s.country_id=c.id) AS stats,
    (SELECT count(*) FROM deep_dive_portals x WHERE x.country_id=c.id) AS portals
   FROM deep_dive_pages p JOIN countries c ON c.id = p.country_id ORDER BY c.name_en`);

const labels = await all(`
  SELECT c.name_en AS name, max(length(l.label)) AS mx
    FROM deep_dive_portals x JOIN countries c ON c.id = x.country_id
    JOIN deep_dive_portal_translations l ON l.portal_id = x.id AND l.lang='en'
   GROUP BY c.id`);

// ---- evaluate every rule once; both directions ------------------------
//
// breaching[rule] = Set of country names over the hard limit today.
const breaching = {};
const under = [];                       // soft minimum: reported, never failed
for (const [field, b] of Object.entries(PROSE)) {
  const size = b.unit === "chars" ? chars : words;
  const over = new Set();
  for (const r of en) {
    const n = size(r[field]);
    if (n > b.max) over.add(r.name);
    else if (n < b.min) under.push(`${r.name} ${field} ${n}${b.unit === "chars" ? "c" : "w"} (min ${b.min})`);
  }
  breaching[`${field}.max`] = over;
}
for (const [key, [lo, hi]] of Object.entries(COUNTS)) {
  breaching[`count.${key}`] = new Set(struct.filter((r) => r[key] < lo || r[key] > hi).map((r) => r.name));
}
breaching["portal.label"] = new Set(labels.filter((r) => r.mx > LABEL_MAX).map((r) => r.name));

// ---- 1. nothing breaches that is not already on the backlog -----------
//
// The rule that binds all future work. A country added tomorrow is held
// to the framework on the day it lands, whatever the backlog says about
// the seventy-six that came before it.
{
  const surprises = [];
  for (const [rule, names] of Object.entries(breaching)) {
    const known = new Set(backlog[rule] || []);
    for (const n of names) if (!known.has(n)) surprises.push(`${n} breaches ${rule}`);
  }
  t.check("no country breaches a rule it is not already listed for",
    surprises.length === 0, surprises.slice(0, 12).join("; ")
      + (surprises.length > 12 ? ` … and ${surprises.length - 12} more` : ""));
}

// ---- 2. no rule's backlog may grow ------------------------------------
{
  const bad = [];
  for (const [rule, names] of Object.entries(backlog)) {
    if (!(rule in BACKLOG_CEILING)) { bad.push(`${rule} has no ceiling — add it deliberately`); continue; }
    if (names.length > BACKLOG_CEILING[rule]) {
      bad.push(`${rule}: ${names.length} > ${BACKLOG_CEILING[rule]} — the framework is being widened, not met`);
    }
  }
  for (const rule of Object.keys(BACKLOG_CEILING)) {
    if (!(rule in backlog)) bad.push(`${rule} has a ceiling but no backlog entry — delete the ceiling too`);
  }
  const total = Object.values(backlog).reduce((a, v) => a + v.length, 0);
  t.check(`no rule's backlog has grown (${total} entries across ${Object.keys(backlog).length} rules)`,
    bad.length === 0, bad.join("; "));
}

// ---- 3. a fixed country must leave the backlog ------------------------
//
// Without this the list is stale cover: one country's fix silently pays
// for another's regression and the count never moves.
{
  const stale = [];
  for (const [rule, names] of Object.entries(backlog)) {
    if (rule === "translation.overrun" || rule === "spine.notyet") continue;   // paired checks live in 5 and 6
    for (const n of names) if (!breaching[rule]?.has(n)) stale.push(`${rule}: ${n}`);
  }
  t.check("every country on the backlog still actually breaches its rule",
    stale.length === 0,
    stale.length ? `now passing — delete from tests/data/deep-dive-backlog.json: ${stale.slice(0, 12).join("; ")}`
      + (stale.length > 12 ? ` … and ${stale.length - 12} more` : "") : "");
}

// ---- 4. the backlog names real countries and real rules ---------------
//
// A typo in the backlog would silently exempt nothing and hide a real
// breach behind a name that never matches.
{
  const known = new Set(en.map((r) => r.name));
  const bad = [];
  for (const [rule, names] of Object.entries(backlog)) {
    if (rule === "translation.overrun") continue;   // keyed "Country/lang field", checked in 5
    if (rule === "spine.notyet") { for (const n of names) if (!known.has(n)) bad.push(`unknown country "${n}" under ${rule}`); continue; }
    if (!(rule in breaching)) bad.push(`unknown rule "${rule}"`);
    for (const n of names) if (!known.has(n)) bad.push(`unknown country "${n}" under ${rule}`);
    if (new Set(names).size !== names.length) bad.push(`duplicate entries under ${rule}`);
  }
  t.check("the backlog names only real countries and real rules",
    bad.length === 0, bad.slice(0, 8).join("; "));
}

// ---- 5. translations are not drifting past their allowance ------------
//
// es/de/fr legitimately run longer. Judged at 1.5x the English maximum,
// and only for countries whose ENGLISH is already within band -- a
// backlogged country's translations are its own problem to fix with it.
{
  const bad = [];
  const enBy = new Map(en.map((r) => [r.name, r]));
  for (const r of prose) {
    if (r.lang === "en") continue;
    for (const [field, b] of Object.entries(PROSE)) {
      const size = b.unit === "chars" ? chars : words;
      const master = enBy.get(r.name);
      if (!master || size(master[field]) > b.max) continue;   // English already backlogged
      const cap = Math.ceil(b.max * LANG_ALLOWANCE);
      if (size(r[field]) > cap) bad.push(`${r.name}/${r.lang} ${field}`);
    }
  }
  const knownTx = new Set(backlog["translation.overrun"] || []);
  const surprises = bad.filter((b) => !knownTx.has(b));
  t.check(`translations stay within ${LANG_ALLOWANCE}x the English ceiling`,
    surprises.length === 0, surprises.slice(0, 10).join("; "));
  const fixedTx = [...knownTx].filter((b) => !bad.includes(b));
  t.check("every listed translation overrun still overruns",
    fixedTx.length === 0, fixedTx.length ? `now passing — delete from the backlog: ${fixedTx.join("; ")}` : "");
}

// ---- 6. the section-02 spine matches the FRAMEWORK DOCUMENT -----------
//
// Read the spine out of DEEP-DIVE-FRAMEWORK.md rather than restating it
// here, for the reason migration 700 taught the hard way: that migration
// asserts each inserted title against the same Python variable that wrote
// it, so changing the generator changes the claim and the evidence
// together and the assertion passes. It is the "satisfied by the code
// that produced it" failure this repo has now found six times.
//
// Two artefacts, neither able to move the other, is the fix -- the same
// trick as reading the guide's clip constant out of guides-render.mjs.
// Changing the spine now requires editing the framework AND the
// generator, deliberately, which is what "the band moves for everyone or
// for no one" means in practice.
{
  const doc = readFileSync(join(REPO, "DEEP-DIVE-FRAMEWORK.md"), "utf8");
  const block = doc.split("## The section-02 spine")[1] || "";
  const spine = [...block.matchAll(/^\d+\.\s+\*\*(.+?)\*\*\s*$/gm)].map((m) => m[1]);
  t.check("the spine is readable from the framework document",
    spine.length === 4, spine.join(" | ") || "no numbered bold titles found under the spine heading");

  const titles = await all(`
    SELECT c.name_en AS name, d.sort_order AS so, t.title
      FROM deep_dive_cards d
      JOIN deep_dive_card_translations t ON t.card_id = d.id AND t.lang = 'en'
      JOIN countries c ON c.id = d.country_id
     WHERE d.section = 'file_format' ORDER BY c.name_en, d.sort_order`);
  const byCountry = new Map();
  for (const r of titles) (byCountry.get(r.name) || byCountry.set(r.name, []).get(r.name)).push(r.title);

  const notYet = new Set(backlog["spine.notyet"] || []);
  const wrong = [], done = [];
  for (const [name, list] of byCountry) {
    const onSpine = spine.every((title, i) => list[i] === title);
    if (notYet.has(name)) { if (onSpine) done.push(name); continue; }
    if (!onSpine) wrong.push(`${name}: ${list.slice(0, 4).join(" / ") || "(no cards)"}`);
  }
  t.check(`every country off the spine backlog carries the framework's four titles, in order`,
    wrong.length === 0, wrong.slice(0, 6).join("; "));
  t.check("every country on the spine backlog is still off the spine",
    done.length === 0, done.length ? `now on the spine — delete from the backlog: ${done.join(", ")}` : "");
}

// ---- 7. the sweep is actually looking at everything -------------------
//
// The failure this repo keeps finding: a check that passes because it is
// reading nothing. State the reach so a silently narrowed sweep shows.
{
  const rules = Object.keys(breaching).length;
  t.check("the sweep covers every rule and every country",
    rules === Object.keys(PROSE).length + Object.keys(COUNTS).length + 1 && en.length === struct.length,
    `${rules} rules over ${en.length} countries (${struct.length} structural rows)`);
}

const outstanding = Object.values(breaching).reduce((a, s) => a + s.size, 0);
console.log(`\n  note  ${outstanding} outstanding breaches across ${Object.keys(breaching).length} rules `
  + `— see DEEP-DIVE-FRAMEWORK.md and tests/data/deep-dive-backlog.json`);
// The soft floors sit at the July cohort's observed minimum, and NOTHING
// has ever gone below one -- prose only ever grew. Expect zero here; a
// non-zero count is the first sign of the opposite drift.
console.log(`  note  ${under.length} country/field pairs are under the SOFT minimum, reported not enforced:`);
for (const u of under.slice(0, 6)) console.log(`          ${u}`);
if (under.length > 6) console.log(`          … and ${under.length - 6} more`);

process.exit(t.report() ? 0 : 1);
