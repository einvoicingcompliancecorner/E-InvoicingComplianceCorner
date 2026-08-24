#!/usr/bin/env node
// content-monitor.mjs — what the monitor watches, and whether the
// digest describes the job it is actually doing.
//
//   node tests/content-monitor.mjs
//
// WHY THIS EXISTS. The content monitor has run since June and until now
// nothing in this directory has looked at it once. It is the piece of
// the system with the least supervision and the most reach: it reads
// every official page the site cites, and its only output is an email
// that nobody diffs against anything.
//
// It has failed twice, both times in the same shape — A JOB THAT
// DESCRIBED ITSELF ACCURATELY IN NUMBERS AND MISLEADINGLY IN WORDS.
//
//   * Until 10 Aug it reached ~10 of 117 sources per weekly run, so a
//     government page was in fact checked about once a QUARTER. Every
//     digest said "107 deferred" and every digest was true. Nobody read
//     the true number as the false claim it sat beside: "Weekly check".
//   * Until 24 Aug it watched 140 curated URLs while the site published
//     420 headline-fact citations, 397 of which were watched by
//     NOTHING. The monitor was not wrong about its list; its list was
//     not the thing anyone believed it was.
//
// Both are class C from the design review: a monitor cannot see what was
// never declared to it, and neither can a reader. So this file asks two
// questions no assertion in the migration chain can:
//
//   1. COVERAGE — does the watch list, as the WORKER'S OWN QUERY
//      returns it, actually contain every page behind a published fact?
//   2. HONESTY — does every place the job states its cadence (the cron,
//      the user-agent it shows the sites it fetches, the digest heading,
//      the design doc) say the same thing, and does the digest state the
//      cycle it is ACHIEVING rather than the one it is scheduled at?
//
// The functions under test live inside a Workers module that cannot be
// imported here (bindings, a default export bound to a runtime this
// harness has none of). Rather than copy them — a copy drifts, and a
// check that drifts is how both failures above survived — this file
// EXTRACTS them from the source text and runs the real bodies. The
// extraction itself is asserted, so a rename fails loudly instead of
// quietly testing nothing.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { suite } from "./lib/browser.mjs";
import { openReplayDb, REPO } from "./lib/replay-db.mjs";

const t = suite("content monitor");
const { d1 } = await openReplayDb();
const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

const SRC = readFileSync(join(REPO, "members-worker", "src", "index.js"), "utf8");
const DOC = readFileSync(join(REPO, "CONTENT-MONITORING.md"), "utf8");
const TOML = readFileSync(join(REPO, "members-worker", "wrangler.toml"), "utf8");

// ---- extraction ---------------------------------------------------------
//
// A top-level `function name(` through to the first `}` in column zero.
// Every function in this file is written that way; if one stops being,
// the extraction returns null and the check below says so by name
// rather than the test silently having nothing to run.
function extractFn(name) {
  const re = new RegExp(`^function ${name}\\([\\s\\S]*?^\\}`, "m");
  const m = SRC.match(re);
  return m ? m[0] : null;
}
// The same, for a one-line `const NAME = …;` declaration — including
// the two that declare three colours apiece.
function extractConst(name) {
  const re = new RegExp(`^const ${name}[ ,=][^\\n]*?;$`, "m");
  const m = SRC.match(re);
  return m ? m[0] : null;
}

// Everything buildDigestHtml touches, so the digest can be RENDERED
// here rather than pattern-matched. Reading the email is the only way
// to check what it says; a regex over the source checks what it was
// written to say, which is a weaker claim and the one that has been
// wrong twice.
const FNS = ["escapeHtmlCM", "cmHost", "cmPath", "cmSourceHeading", "cmSourceGroup",
  "cmSourceCard", "humanizeFetchError", "buildDigestHtml"];
const CONSTS = ["CM_HEADING", "CM_AMBER", "CM_ITEM_TYPE_LABELS", "CM_CHANNEL_LABELS",
  "CONTENT_MONITOR_KNOWN_BLOCKER_RUNS"];
const fnBodies = FNS.map(extractFn);
const constBodies = CONSTS.map(extractConst);
t.check("the digest and its helpers are still extractable from the worker",
  fnBodies.every(Boolean) && constBodies.every(Boolean),
  [...FNS.filter((n, i) => !fnBodies[i]), ...CONSTS.filter((n, i) => !constBodies[i])]
    .join(", ") + " not found — renamed?");

let cmSourceHeading = null, cmSourceGroup = null, buildDigestHtml = null;
if (fnBodies.every(Boolean) && constBodies.every(Boolean)) {
  // eslint-disable-next-line no-new-func
  ({ cmSourceHeading, cmSourceGroup, buildDigestHtml } = new Function(
    `${constBodies.join("\n")}\n${fnBodies.join("\n")}\n`
    + "return { cmSourceHeading, cmSourceGroup, buildDigestHtml };")());
}

// And the query, taken from the worker rather than retyped. This is the
// definition of "what is watched" — everything below depends on it
// being the real one.
const QUERY = (SRC.match(/async function getMonitoredSources\(env\) \{\s*return d1All\(env, `([\s\S]*?)`\);/) || [])[1];
t.check("the watch-list query is still readable out of getMonitoredSources",
  Boolean(QUERY && /FROM monitored_sources/.test(QUERY)),
  "if this fails every coverage check below is testing nothing");

// ---- 1. coverage --------------------------------------------------------

const watched = QUERY ? await all(QUERY) : [];
t.check("the watch list is the widened, citation-derived one",
  watched.length >= 700,
  `${watched.length} URLs watched (was 140 curated before migration 635)`);

// THE CHECK THAT WOULD HAVE CAUGHT THE 397. Asked of the worker's query
// and the published facts, not of the view against itself: the view
// could be perfect and a WHERE clause in the query could still drop
// half of it, which is exactly the gap between "the data is right" and
// "the job reads the right data".
const factUrls = (await all("SELECT DISTINCT url FROM fact_source_map")).map((r) => r.url);
const watchedUrls = new Set(watched.map((r) => r.url));
const unwatchedFacts = factUrls.filter((u) => !watchedUrls.has(u));
t.check("every page behind a published headline fact is watched",
  unwatchedFacts.length === 0,
  `${factUrls.length} fact sources, ${unwatchedFacts.length} unwatched\n        `
  + unwatchedFacts.slice(0, 8).join("\n        "));

// The curated list has not been dropped on the way to the wider one.
// Widening a watch list by replacing it is the other way to lose pages.
const curated = (await all(
  "SELECT DISTINCT url FROM tracking_sources WHERE active = 1")).map((r) => r.url);
const unwatchedCurated = curated.filter((u) => !watchedUrls.has(u));
t.check("and so is every curated tracking source, still",
  unwatchedCurated.length === 0,
  `${curated.length} curated, ${unwatchedCurated.length} unwatched\n        `
  + unwatchedCurated.slice(0, 8).join("\n        "));

// Story citations are excluded on purpose (Dan's decision, 24 Aug): a
// newsletter story cites a press release that was news once and will
// never change again. Watching them would have added 91 URLs that can
// only ever produce noise — and pushed a sweep past four days.
const storyOnly = await all(`
  SELECT DISTINCT url FROM cited_sources WHERE kind = 'story'
   AND url NOT IN (SELECT url FROM cited_sources WHERE kind <> 'story')`);
const leaked = storyOnly.map((r) => r.url).filter((u) => watchedUrls.has(u));
t.check("story-only citations stay out of the watch list",
  leaked.length === 0, `${storyOnly.length} story-only URLs, ${leaked.length} leaked in`);

// ---- 1b. every watched URL can be described to a reader -----------------
//
// The labels are derived now, not stored: before 635 every watched row
// carried a country and a hand-written description, and the digest just
// printed them. A citation-derived row has neither, and the failure mode
// is not an exception — it is an email that says "undefined — b2b" or
// groups 200 sources under "undefined". Nothing throws. Nobody is told.
if (cmSourceHeading && cmSourceGroup) {
  const bad = [];
  for (const s of watched) {
    for (const [what, fn] of [["heading", cmSourceHeading], ["group", cmSourceGroup]]) {
      const v = String(fn(s) ?? "");
      if (!v.trim() || /undefined|null|\[object/.test(v)) bad.push(`${s.url} — ${what}: "${v}"`);
    }
  }
  t.check("every watched source produces a heading and a group label a reader can read",
    bad.length === 0,
    `${watched.length} checked, ${bad.length} unreadable\n        ` + bad.slice(0, 8).join("\n        "));

  // And the grouping actually groups. One label per URL is what makes
  // the queue note a count; if the labeller returned the URL for most
  // rows the note would list 270 "groups" and mean nothing.
  const groups = new Set(watched.map((s) => cmSourceGroup(s)));
  t.check("the group label collapses the list rather than echoing it",
    groups.size < watched.length / 3,
    `${groups.size} groups across ${watched.length} sources`);

  // AND THE HEADING IS NOT THE URL. The card prints the URL on its own
  // line directly beneath the heading, so a heading that falls back to
  // the URL renders it twice — invisible in the source, obvious the
  // first time the email was actually rendered and read.
  const echoed = watched.filter((s) => cmSourceHeading(s) === s.url);
  t.check("no card heading is just the URL printed a second time",
    echoed.length === 0,
    `${echoed.length} of ${watched.length}\n        ` + echoed.slice(0, 5).map((s) => s.url).join("\n        "));
}

// ---- 2. honesty about the cycle ----------------------------------------

const cron = (SRC.match(/const CONTENT_MONITOR_CRON = "([^"]+)"/) || [])[1];
t.check("the monitor cron is daily", cron === "0 8 * * *", `cron is "${cron}"`);
t.check("and wrangler.toml schedules that exact string",
  TOML.includes(`"${cron}"`),
  "the constant only NAMES the schedule — the platform reads the toml, and a "
  + "mismatch means the handler's if/else sends the wrong job");

// The cadence is a claim made in four places, to four audiences: the
// platform (toml), the sites we fetch (user agent), the reader (digest
// heading), and whoever maintains this next (the doc). All four were
// "weekly" while the job achieved quarterly. They move together or the
// next person inherits the same lie in a different file.
const ua = (SRC.match(/const CONTENT_MONITOR_USER_AGENT = "([^"]+)"/) || [])[1] || "";
t.check("the user-agent tells the sites we fetch the real cadence",
  /daily check/i.test(ua) && !/weekly/i.test(ua), ua);

const digestSrc = (SRC.match(/function buildDigestHtml\([\s\S]*?^\}/m) || [""])[0];
t.check("no line of the digest still talks in weeks",
  !/this week|next week|each week|every week/i.test(digestSrc),
  (digestSrc.match(/.{0,50}(this week|next week|each week|every week).{0,50}/i) || [])[0] || "");

// ---- 2a. the digest, rendered -------------------------------------------
//
// Three runs the job really has, put through the real function. What
// this email SAYS is the whole product here — it is the only output the
// monitor has — and both of its historical failures were sentences, not
// numbers. So they are read, not grepped.
const fakeSource = (i, fact) => ({
  url: `https://example.gov/page-${i}`,
  is_fact_source: fact ? 1 : 0,
  is_curated: 0,
  citations: fact ? 2 : 1,
  fact_countries: fact ? "Poland" : null,
  fact_fields: fact ? "b2b" : null,
  last_verified: fact ? "2026-08-21" : null,
});
const fakeRun = (n) => Array.from({ length: n }, (_, i) =>
  ({ status: "unchanged", source: fakeSource(i, false) }));

if (buildDigestHtml) {
  const TOTAL = 758;
  // A normal night: a slice checked, the rest queued.
  const nightly = buildDigestHtml(fakeRun(270), TOTAL,
    Array.from({ length: 488 }, (_, i) => fakeSource(i + 270, false)), [], []);
  t.check("a nightly run calls itself a daily check",
    /Daily check/.test(nightly) && !/Weekly check|Manual check/.test(nightly));
  // THE ONE THAT MATTERS. "270 of 758" is true and, printed every
  // morning with nothing beside it, teaches the reader the monitor is
  // behind when it is working exactly as designed.
  t.check("and states the cycle it is achieving, in days",
    /every 3 days/.test(nightly),
    (nightly.match(/[^<>]*at this rate[^<>]*/) || ["no cadence sentence found"])[0]);

  // A MANUAL RUN MUST NOT PROJECT A CADENCE FROM ITSELF. It is capped
  // at ~20 seconds, so the same arithmetic would print "about every 60
  // days" — arithmetically true, false as a statement about the job,
  // and the first thing anyone testing a deploy sees.
  const manual = buildDigestHtml(fakeRun(12), TOTAL,
    Array.from({ length: 746 }, (_, i) => fakeSource(i + 12, false)), [], [], { manual: true });
  t.check("a manual slice calls itself a manual check",
    /Manual check/.test(manual) && !/Daily check/.test(manual));
  t.check("and refuses to project a cadence from twenty seconds",
    !/at this rate/.test(manual) && /not the nightly rate/.test(manual),
    (manual.match(/[^<>]*manual slice[^<>]*/) || ["no manual sentence found"])[0]);

  // A sweep that did finish inside one run says so plainly, with no
  // cadence arithmetic at all — "every 1 days" would be a bug.
  const complete = buildDigestHtml(fakeRun(TOTAL), TOTAL, [], [], []);
  t.check("a completed sweep says so without projecting anything",
    /All 758 sources checked/.test(complete) && !/at this rate|days/.test(complete));

  // And the line that turns an errand into a task: a changed page that
  // backs a published fact, named by country and field, with the date
  // that fact was last verified.
  const changed = buildDigestHtml(
    [{ status: "changed", source: fakeSource(1, true), diff: { before: "old text", after: "new text" } }],
    TOTAL, [], [], []);
  t.check("a changed fact source is separated out and dated",
    /Behind a published fact/.test(changed)
    && /Poland/.test(changed) && /b2b/.test(changed)
    && /last verified 2026-08-21/.test(changed),
    "the last_verified date is the only thing distinguishing movement from a problem");
  t.check("and a changed non-fact source is not filed under it",
    !/Behind a published fact/.test(buildDigestHtml(
      [{ status: "changed", source: fakeSource(2, false), diff: { before: "a", after: "b" } }],
      TOTAL, [], [], [])));
}

// The manual trigger has to actually declare itself, or every check
// above passes while the deployed email still projects 60 days.
t.check("the manual trigger tells the digest which caller it is",
  /runContentMonitor\(env, \{ timeBudgetMs: CONTENT_MONITOR_MANUAL_BUDGET_MS, manual: true \}\)/.test(SRC));
t.check("and the subject line carries the cadence too",
  /manual run.*daily check|daily check.*manual run/s.test(SRC) && !/week of \$\{/.test(SRC),
  "a subject line is the part most often read without the body");

// And the arithmetic behind that is checked here rather than assumed,
// because it is the reason the job is daily at all. If the list ever
// shrinks back under one run, this fails and the cadence should be
// reconsidered — a "3 days" sentence on a job that finishes every night
// is the same defect pointing the other way.
const delay = Number((SRC.match(/CONTENT_MONITOR_FETCH_DELAY_MS = (\d+)/) || [])[1]);
const budget = Number((SRC.match(/CONTENT_MONITOR_TIME_BUDGET_MS = (\d+)/) || [])[1]);
const perSource = delay + 1000; // ~1s of fetch, the measured average
const runsPerSweep = Math.ceil((watched.length * perSource) / budget);
t.check("a full sweep genuinely needs more than one run, as the design assumes",
  runsPerSweep > 1,
  `${watched.length} x ~${perSource}ms = ~${Math.round(watched.length * perSource / 60000)} min `
  + `against a ${budget / 60000}-minute budget → ~${runsPerSweep} runs per sweep`);
// Three days is the figure quoted to Dan and written into 635's comment.
// A sweep that quietly stretched to a fortnight is the 10 August failure
// again, and it would arrive as a slow drift in a number nobody watches.
t.check("and the sweep still completes within a few days, not weeks",
  runsPerSweep <= 5, `~${runsPerSweep} days per full sweep`);

// ---- 2b. the doc says the same thing -----------------------------------
t.check("CONTENT-MONITORING.md describes the daily cadence",
  /daily/i.test(DOC) && !/\bevery Monday\b/i.test(DOC));
t.check("and describes the citation-derived watch list, not the curated one",
  /monitored_sources/.test(DOC),
  "the doc is where the next person learns what is watched; if it still says "
  + "'tracking_sources WHERE active = 1' it is describing the 140-URL list");

// ---- 3. the state keys moved with the list ------------------------------
//
// The KV namespace outlives the code. An id-shaped cursor read as a URL
// resolves to "the first URL alphabetically after 37" — which is every
// URL — and the sweep looks perfect while starting from the top each
// night. The keys were renamed so an old value cannot be misread.
t.check("baselines are keyed by URL hash, not by a source id",
  /hash:u:\$\{await monitorKey\(source\.url\)\}/.test(SRC));
t.check("failure counters moved with them",
  /fail:u:/.test(SRC) && !/`fail:\$\{source\.id\}`/.test(SRC));
t.check("and the cursor is a URL under its own key",
  /CONTENT_MONITOR_CURSOR_KEY = "cursor:next-url"/.test(SRC)
  && /allSources\.findIndex\(\(s\) => s\.url >= storedCursor\)/.test(SRC));

console.log(`  note  ${watched.length} URLs watched, ${factUrls.length} of them behind a `
  + `published fact; ~${runsPerSweep} runs per full sweep`);

process.exit(t.report() ? 0 : 1);
