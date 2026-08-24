#!/usr/bin/env node
// tracker-board-renders.mjs — the board actually builds, and the number
// on it is the real one.
//
//   node tests/tracker-board-renders.mjs
//
// WHY THIS EXISTS. On 23 August migration 625 wrote a paragraph of prose
// into milestone_translations.actions, which holds a JSON array. On the
// 24th Dan asked why the tracker said "31 Jurisdictions tracked" when it
// used to say 70.
//
// It said 31 because site-worker's renderTracker had been failing on
// EVERY REQUEST for a day. It fetches the static shell, injects live D1
// rows into it, and on any exception serves the shell untouched — and
// the shell carries a frozen fallback snapshot of 79 milestones across
// 31 countries. JSON.parse threw on one row; seventy countries' worth of
// board quietly reverted to a snapshot.
//
// THREE CHECKS EXISTED AND NONE OF THEM COULD SEE IT:
//
//   * 625's own assertions were all true. The milestone existed, was on
//     the board, had four translations. Every structural claim held —
//     the CONTENT was the wrong shape, and no assertion asked about
//     shape. (631 now asserts the shape.)
//   * migration replay does not render, so it parsed nothing.
//   * jurisdiction-count.mjs checks that PROSE claims about the count
//     agree with the database. Both were right. The page was serving
//     neither.
//
// So this file does the one thing none of them did: it runs the worker's
// own query and its own parsing, and asserts the board that comes out is
// the board the database describes. It is deliberately a near-copy of
// buildTrackerData rather than an import — site-worker/src/index.js is a
// Workers module with bindings this harness cannot construct, and a
// check that drifts from the code it guards is still worth more than no
// check at all. The shape below is asserted against the real file so the
// drift cannot go unnoticed.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { suite } from "./lib/browser.mjs";
import { openReplayDb, REPO } from "./lib/replay-db.mjs";

const t = suite("tracker board renders");
const { d1 } = await openReplayDb();
const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

// ---- the worker's own query -------------------------------------------
const rows = await all(`
  SELECT m.id, c.name_en AS country, c.code, c.region, m.date,
         m.portals, m.confidence,
         mt.system, mt.desc, mt.actions
    FROM milestones m
    JOIN countries c ON c.id = m.country_id
    LEFT JOIN milestone_translations mt ON mt.milestone_id = m.id AND mt.lang = 'en'
   WHERE m.on_tracker = 1`);

t.check("the board query returns rows", rows.length > 100, `${rows.length} milestones`);

// ---- and the parse that took the site down ----------------------------
//
// Checked here in the strict form the worker used BEFORE 631 hardened
// it — throwing rather than degrading. The worker now isolates a bad row
// so one cannot blank the board again, but the data must still be clean:
// a row that only survives because of the fallback is a row whose
// actions a reader never sees.
const unparseable = [];
for (const r of rows) {
  for (const field of ["actions", "portals"]) {
    const raw = r[field];
    if (!raw) continue;
    try {
      const v = JSON.parse(raw);
      if (!Array.isArray(v)) unparseable.push(`${r.id}/${field}: JSON but not an array`);
    } catch (err) {
      unparseable.push(`${r.id}/${field}: ${String(raw).slice(0, 40)}… — ${err.message}`);
    }
  }
}
t.check("every board row's actions and portals parse as JSON arrays",
  unparseable.length === 0, "\n        " + unparseable.join("\n        "));

// EVERY LANGUAGE, not just the one the board query reads. The English
// board is what falls over, but /data/<lang>.json serves the other three
// to the same page on a language switch — and the ninth broken row 631
// found was German, in a row whose English was perfectly fine.
const allLangs = await all(`
  SELECT mt.milestone_id AS id, mt.lang, mt.actions
    FROM milestone_translations mt
    JOIN milestones m ON m.id = mt.milestone_id`);
const badLang = [];
for (const r of allLangs) {
  try {
    if (!Array.isArray(JSON.parse(r.actions))) badLang.push(`${r.id}/${r.lang}: not an array`);
  } catch (err) {
    badLang.push(`${r.id}/${r.lang}: ${err.message}`);
  }
}
t.check("and in all four languages, not only the one the board reads",
  badLang.length === 0, `${allLangs.length} rows checked\n        ` + badLang.join("\n        "));

// ---- the number on the page -------------------------------------------
//
// renderStats counts distinct countries in DATA, excluding the European
// Union — which appears on the board via its own ViDA milestone but is
// not itself a tracked jurisdiction.
const onBoard = new Set(rows.map((r) => r.country).filter((c) => c !== "European Union"));
const tracked = (await all(
  "SELECT count(*) AS n FROM countries WHERE code != 'EU' AND slug IS NOT NULL"))[0].n;
t.check("the board covers every tracked jurisdiction",
  onBoard.size === tracked,
  `board shows ${onBoard.size}, database tracks ${tracked}`);

// AND IT IS NOT THE SNAPSHOT'S NUMBER. Stated explicitly, because 31 is
// what a reader saw for a day and is the single most diagnostic value
// this check could ever print: it means the page is serving the frozen
// array in einvoicing-compliance-tracker.html rather than live data.
t.check("the count is not the static fallback's 31",
  onBoard.size !== 31, `${onBoard.size} jurisdictions on the board`);

// ---- the injection points still exist ---------------------------------
//
// renderTracker replaces the two blobs by regex and throws if either
// fails to match. A change to the static file's shape would put the site
// back on the snapshot with the D1 query working perfectly.
const shell = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");
t.check("the DATA blob is still replaceable by the worker's regex",
  /const DATA = \[[\s\S]*?\n\];/.test(shell));
t.check("the DEEP_DIVES blob is still replaceable by the worker's regex",
  /const DEEP_DIVES = \{[\s\S]*?\n\};/.test(shell));

// ---- and the worker still parses the way this file assumes ------------
const worker = readFileSync(join(REPO, "site-worker", "src", "index.js"), "utf8");
t.check("buildTrackerData still reads actions and portals as JSON",
  /parseList\(r\.actions/.test(worker) && /parseList\(r\.portals/.test(worker),
  "if this fails, the copy of the query above has drifted from the worker");
t.check("and renderTracker still falls back rather than erroring",
  /serving static fallback/.test(worker));

console.log(`  note  ${rows.length} board milestones across ${onBoard.size} jurisdictions; `
  + `${allLangs.length} translation rows parsed`);

process.exit(t.report() ? 0 : 1);
