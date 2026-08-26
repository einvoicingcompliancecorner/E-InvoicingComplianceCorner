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
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { suite, loadPlaywright, launch } from "./lib/browser.mjs";
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

// ---- and the page is honest about which it is showing -----------------
//
// Dan, 24 August 2026: "Is there a more graceful way to fail, rather than
// displaying incorrect counts?"
//
// The shell declares DATA_SNAPSHOT_DATE beside its frozen array and the
// worker clears it on a successful injection, so THE DEFAULT IS THE SAFE
// ONE. Everything above proves the live path; this proves the other one,
// by rendering both in a real browser — because the failure being
// guarded is precisely a page that looks fine while telling the reader
// something untrue, and no amount of reading source establishes that.
t.check("the shell declares a snapshot date the worker can clear",
  /const DATA_SNAPSHOT_DATE = '\d{4}-\d{2}-\d{2}';/.test(shell));
t.check("the worker clears it and refuses to serve a half-injected page",
  /const DATA_SNAPSHOT_DATE = null;/.test(worker) && /snapshotFlag=\$\{clearedSnapshot\}/.test(worker));

const { chromium } = await loadPlaywright();
// SHARED launch(), NOT chromium.launch() WITH A PATH. Dan hit this on
// 26 August: "Failed to launch chromium because executable doesn't
// exist at /opt/pw-browsers/chromium". That path is the sandbox this
// project is developed in; on any other machine Playwright's own
// download location is right and the hardcoded one is a crash. The
// helper uses the sandbox binary when it is there, falls back to
// Playwright's when it is not, and turns a missing download into one
// line of instructions instead of a stack trace.
const browser = await launch();
const render = async (html, label) => {
  const file = `/tmp/tracker-state-${label}.html`;
  writeFileSync(file, html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`file://${file}`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => ({
    nums: [...document.querySelectorAll("#stats .num")].map((e) => e.textContent.trim()),
    bannerShown: !(document.getElementById("snapshotNote") || {}).hidden,
    banner: ((document.getElementById("snapshotNote") || {}).textContent || "").trim(),
    published: window.EICC_JURISDICTION_COUNT,
  }));
  await page.close();
  return r;
};

// The fallback path is the static shell served untouched — exactly what
// renderTracker's catch block returns.
const cached = await render(shell, "cached");
t.check("on the snapshot, every count is withheld",
  cached.nums.length === 5 && cached.nums.every((n) => n === "—"),
  `stats read: ${cached.nums.join(" | ")}`);
t.check("on the snapshot, the banner appears and dates the copy",
  cached.bannerShown && /\d{4}/.test(cached.banner), cached.banner.slice(0, 120));
// The sign-up panel says "N jurisdictions tracked" from this global. On
// the snapshot N is 31, so an outage would have understated the site by
// half in the one place trying to persuade someone to subscribe.
t.check("and no jurisdiction count is published to the sign-up panel",
  cached.published === undefined || !cached.published,
  `published: ${String(cached.published)}`);

// And the live path, which must show the opposite of all three.
const injected = shell
  .replace(/const DATA = \[[\s\S]*?\n\];/, "const DATA = [" +
    '{id:"t1",country:"Poland",flag:"PL",code:"PL",region:"Europe",system:"KSeF",date:"2026-02-01",actions:[],portals:[]},' +
    '{id:"t2",country:"Germany",flag:"DE",code:"DE",region:"Europe",system:"X",date:"2027-01-01",actions:[],portals:[]},' +
    '{id:"t3",country:"European Union",flag:"EU",code:"EU",region:"Europe",system:"ViDA",date:"2030-01-01",actions:[],portals:[]}' + "];")
  .replace(/const DATA_SNAPSHOT_DATE = '[^']*';/, "const DATA_SNAPSHOT_DATE = null;");
const live = await render(injected, "live");
t.check("on live data, the counts print and the banner stays hidden",
  !live.bannerShown && live.nums[0] === "2" && live.nums[1] === "3",
  `banner=${live.bannerShown} stats=${live.nums.join(" | ")}`);
t.check("and the jurisdiction count is published again, EU excluded",
  live.published === 2, `published: ${String(live.published)}`);
await browser.close();

console.log(`  note  ${rows.length} board milestones across ${onBoard.size} jurisdictions; `
  + `${allLangs.length} translation rows parsed`);

process.exit(t.report() ? 0 : 1);
