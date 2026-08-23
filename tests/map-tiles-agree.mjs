#!/usr/bin/env node
// map-tiles-agree.mjs — the front-page map may not contradict the guide.
//
//   node tests/map-tiles-agree.mjs
//
// Two artefacts describe the same fact for the same country, from two
// different tables, and until migration 625 nothing compared them:
//
//   the MAP     computes a status from milestones.mandate_scope
//               (shared/map-data.mjs, computeCountryMapStatus)
//   the TILES   read country_headline_facts.b2g_status / b2b_status
//
// They disagreed on five countries. The cause was not five bad rows, it
// was two vocabularies: migration 254 defined mandate_scope's 'b2b' as
// covering a mandate "requiring structured e-invoicing between
// businesses (issuing and/or receiving)", and migrations 600-601 later
// established the rule the headline facts rest on — a status describes
// the duty to ISSUE. Nobody went back to 254, so the map went on
// painting Germany "In force — real, binding B2B mandate today" on the
// strength of a milestone titled "Mandatory receipt of structured
// e-invoices".
//
// ---- WHY THIS CHECK AND NOT A LEXICAL ONE ------------------------------
//
// 625 drafted a lexical invariant — no board milestone scoped 'b2b' or
// 'b2g_only' may say "must receive" in its title — and removed it again.
// It caught one real defect and two false positives, one of them a
// perfectly correct Irish title that names both duties in one sentence.
// One in three is the ratio that gets a check switched off.
//
// This check reads no prose at all. It asks whether two derived values
// can both be true, so it cannot be fooled by phrasing, and it fails on
// the next country somebody adds with a mismatched scope — which is the
// failure that actually happens, since mandate_scope defaults to 'b2b'
// in the schema and a new milestone inherits that default silently.
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";
import { computeCountryMapStatus } from "../shared/map-data.mjs";

const t = suite("map and tiles agree");
const { d1 } = await openReplayDb();
const all = async (sql, ...args) =>
  (await d1.prepare(sql).bind(...args).all()).results || [];

// Fixed, not today's date: this suite must not start failing because a
// milestone matured overnight. 625's own reasoning was worked out
// against this date, and New Zealand is deliberately sitting one
// milestone away from changing status on 1 January 2027.
const TODAY = "2026-08-23";

// What each map colour asserts, in the words of the map's own legend
// (MAP_UI.en.legend in shared/map-data.mjs). These are not this file's
// opinion — they are what a reader is told the colour means.
const MEANS = {
  inforce:   { says: "In force — real, binding B2B mandate today",
               ok: (f) => f.b2b_status === "active" },
  upcoming:  { says: "Upcoming — B2B mandate confirmed, not yet binding",
               ok: (f) => f.b2b_status === "planned" },
  b2gonly:   { says: "B2G only — government mandate real, no B2B mandate",
               ok: (f) => f.b2g_status === "active" && f.b2b_status !== "active" },
  nomandate: { says: "No mandate confirmed",
               ok: (f) => f.b2b_status !== "active" && f.b2g_status !== "active" },
  // A country with no board milestones at all has nothing to contradict.
  tracked:   { says: "Tracked — no data yet", ok: () => true },
};

// ---- the two that are allowed to disagree, and why ---------------------
//
// Both are recorded open judgements rather than defects, set out in
// headline-facts-validation.md and in compliance-guides-status.md. They
// are named here rather than silently skipped, and a stale entry fails:
// if one of them stops disagreeing, this file is out of date and should
// lose the entry, which is the moment nobody would otherwise notice.
const OPEN = {
  Taiwan: "the tile says voluntary; our own deep dive and the comparison "
        + "site both say a universal mandate from Jan 2021. Settling it needs "
        + "the MOF's Uniform Invoice regulations read in Chinese, not a "
        + "choice between trackers.",
  Spain:  "RD 238/2026 is in force but the start awaits an unpublished "
        + "ministerial order, so the tile is unknown while the board carries "
        + "the movement. The schema refuses 'planned' without a date.",
};

const facts = await all(`
  SELECT c.name_en AS name, c.id,
         f.b2g_status, f.b2b_status
    FROM country_headline_facts f
    JOIN countries c ON c.id = f.country_id
   ORDER BY c.name_en`);
const board = await all(`
  SELECT country_id, date, mandate_scope, confidence
    FROM milestones WHERE on_tracker = 1`);

const byCountry = new Map();
for (const m of board) {
  if (!byCountry.has(m.country_id)) byCountry.set(m.country_id, []);
  byCountry.get(m.country_id).push(m);
}

t.check("there are countries with both a map status and headline tiles",
  facts.length >= 60, `${facts.length} countries`);

const disagree = [];
const counts = {};
const openStillOpen = new Set();

for (const f of facts) {
  const status = computeCountryMapStatus(byCountry.get(f.id) || [], TODAY);
  counts[status] = (counts[status] || 0) + 1;
  const rule = MEANS[status];
  if (!rule) {
    disagree.push(`${f.name}: map returned an unknown status "${status}" — `
      + "computeCountryMapStatus grew a branch this file does not know about");
    continue;
  }
  if (rule.ok(f)) continue;
  if (OPEN[f.name]) { openStillOpen.add(f.name); continue; }
  disagree.push(`${f.name}: the map says "${rule.says}", but the tiles say `
    + `B2G ${f.b2g_status.toUpperCase()} / B2B ${f.b2b_status.toUpperCase()}`);
}

t.check("no country's map colour contradicts its own headline tiles",
  disagree.length === 0, "\n        " + disagree.join("\n        "));

// ---- and the exemptions are still earning their place ------------------

for (const name of Object.keys(OPEN)) {
  t.check(`${name} is still the open question this file says it is`,
    openStillOpen.has(name),
    `${name} no longer disagrees — resolve it in OPEN above, or the next `
    + "real disagreement for this country will be silently excused");
}

// ---- what the map is actually showing ----------------------------------
//
// Printed rather than asserted. A distribution that lurches — thirty
// countries changing colour in one migration — is worth a human look even
// when every one of them agrees with its tiles.
console.log(`  note  map status across ${facts.length} countries: `
  + Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`).join(", "));
console.log(`  note  ${board.length} board milestones read, `
  + `${new Set(board.map((m) => m.country_id)).size} countries carry at least one`);

process.exit(t.report() ? 0 : 1);
