#!/usr/bin/env node
// guides-front-table.mjs — the compliance guide's front-page table must
// not announce an obligation the country page denies.
//
//   node tests/guides-front-table.mjs
//
// WHY THIS EXISTS. The "next dated obligation" column falls back to a
// pill when a country has no future date. Until 27 August 2026 that pill
// read "In force" whenever the country had milestones and none of them
// was in the future — a heuristic that quietly asserted every past
// milestone binds a supplier today.
//
// Dan found it on Liechtenstein, in a generated PDF: the table said IN
// FORCE for a country whose own tiles say B2G VOLUNTARY and B2B NO
// MANDATE, and whose two on-board milestones are a duty on the AUTHORITY
// to receive and a change of VAT filing channel. Neither obliges anyone
// to issue an e-invoice.
//
// It was not a Liechtenstein bug. Bahrain, Canada, Qatar and Taiwan were
// all already wrong the same way and had been shipping. That is the
// reason this file checks the whole corpus rather than the one country:
// a heuristic that is wrong is usually wrong more than once, and the
// country that exposes it is rarely the only victim.
//
// The rule now is the one guides-render's own header states — the front
// page and the page it summarises cannot disagree — so the pill is
// derived from the same six headline facts the tiles show, in the tiles'
// own vocabulary: a status describes the obligation to ISSUE.
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";
import { mandateStateOf } from "../shared/guides-render.mjs";

const t = suite("guides front table");
const { d1 } = await openReplayDb();
const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

const TODAY = new Date().toISOString().slice(0, 10);

const facts = await all(`
  SELECT c.name_en AS name, c.id,
         f.b2g_status, f.b2b_status, f.b2c_status
    FROM country_headline_facts f
    JOIN countries c ON c.id = f.country_id
   WHERE c.slug IS NOT NULL
   ORDER BY c.name_en`);

t.check("there are countries to check", facts.length >= 60, `${facts.length} countries`);

const miles = await all(
  `SELECT country_id, date FROM milestones WHERE on_tracker = 1`);
const byCountry = new Map();
for (const m of miles) {
  if (!byCountry.has(m.country_id)) byCountry.set(m.country_id, []);
  byCountry.get(m.country_id).push(m);
}

// The shape summariseForFront hands mandateStateOf, reconstructed here so
// this file tests the exported decision rather than a copy of it.
const stateFor = (f) => {
  const ms = byCountry.get(f.id) || [];
  return mandateStateOf(
    { headline: f, milestones: ms },
    { future: ms.filter((m) => m.date > TODAY), rows: ms });
};

// ---- 1. nothing says "in force" without an active issuing duty --------
{
  const wrong = facts.filter((f) => stateFor(f) === "inforce"
    && ![f.b2g_status, f.b2b_status, f.b2c_status].includes("active"));
  t.check("no country is called IN FORCE without an active issuing obligation",
    wrong.length === 0,
    wrong.map((f) => `${f.name} [${f.b2g_status}/${f.b2b_status}/${f.b2c_status}]`).join("; "));
}

// ---- 2. and every country with one IS called in force -----------------
//
// The converse matters as much. A fix that made the pill cautious
// everywhere would pass the check above and be worse than the bug.
{
  const missed = facts.filter((f) => stateFor(f) !== "inforce"
    && [f.b2g_status, f.b2b_status, f.b2c_status].includes("active"));
  t.check("and every country with one is called IN FORCE",
    missed.length === 0, missed.map((f) => f.name).join("; "));
}

// ---- 3. an unknown never renders as "no mandate" ----------------------
//
// The site's own rule, from the headline-facts vocabulary: an unknown
// prints as NOT CONFIRMED and never as blank, because a blank where a
// duty might sit reads as "no requirement" and that is the error that
// gets somebody fined. The front page has to obey it too.
{
  const flattened = facts.filter((f) =>
    [f.b2g_status, f.b2b_status, f.b2c_status].includes("unknown")
    && stateFor(f) === "none");
  t.check("an unconfirmed status is never flattened to NO MANDATE",
    flattened.length === 0, flattened.map((f) => f.name).join("; "));
}

// ---- 4. the five countries the old heuristic got wrong ----------------
//
// Named rather than counted. If any of these acquires a real mandate the
// list must be edited by whoever records it, which is the point: the
// alternative is a count that silently absorbs a regression.
{
  const KNOWN_NOT_IN_FORCE = ["Bahrain", "Canada", "Liechtenstein", "Qatar", "Taiwan"];
  const bad = KNOWN_NOT_IN_FORCE.filter((n) => {
    const f = facts.find((x) => x.name === n);
    return !f || stateFor(f) === "inforce";
  });
  t.check(`the five the old heuristic mislabelled are not in force (${KNOWN_NOT_IN_FORCE.join(", ")})`,
    bad.length === 0, bad.join("; "));
}

// ---- 5. every pill the table can print exists in all four languages ---
//
// A missing key falls back to English silently, which on a printed
// document in German is not obviously a bug to the person holding it.
{
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
  const missing = [];
  for (const lang of ["en", "es", "de", "fr"]) {
    const p = JSON.parse(readFileSync(join(REPO, "i18n", `${lang}.json`), "utf8"));
    const pill = ((p.guides || {}).pill) || {};
    for (const k of ["inforce", "nomandate", "unconfirmed"]) {
      if (!pill[k]) missing.push(`${lang}: guides.pill.${k}`);
    }
  }
  t.check("every front-table pill is translated in all four languages",
    missing.length === 0, missing.join("; "));
}

const spread = facts.reduce((acc, f) => {
  const s = stateFor(f); acc[s] = (acc[s] || 0) + 1; return acc;
}, {});
console.log(`\n  note  front-table states across ${facts.length} countries: `
  + Object.entries(spread).map(([k, v]) => `${k} ${v}`).join(", "));

process.exit(t.report() ? 0 : 1);
