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
const LABELLERS = ["cmSourceHeading", "cmSourceGroup"];
const bodies = LABELLERS.map(extractFn);
t.check("the digest's label functions are still extractable from the worker",
  bodies.every(Boolean),
  LABELLERS.filter((n, i) => !bodies[i]).join(", ") + " not found — renamed?");

let cmSourceHeading = null, cmSourceGroup = null;
if (bodies.every(Boolean)) {
  // eslint-disable-next-line no-new-func
  ({ cmSourceHeading, cmSourceGroup } = new Function(
    `${bodies.join("\n")}\nreturn { cmSourceHeading, cmSourceGroup };`)());
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

const digest = (SRC.match(/function buildDigestHtml\([\s\S]*?^\}/m) || [""])[0];
t.check("the digest heading says daily, not weekly",
  /Daily check — \$\{dateStr\}/.test(digest) && !/Weekly check/.test(digest));
t.check("and no line of the digest still talks in weeks",
  !/this week|next week|each week|every week/i.test(digest),
  (digest.match(/.{0,50}(this week|next week|each week|every week).{0,50}/i) || [])[0] || "");

// THE ONE THAT MATTERS. A partial sweep is now the normal outcome — 758
// sources at ~1.75s each cannot fit in one run and are not meant to. So
// "270 of 758 checked" is a true sentence that, printed every morning
// with nothing beside it, teaches the reader that the monitor is behind
// rather than that it is working as designed. The digest divides and
// says the answer in days.
t.check("the digest computes the cycle it is achieving, in days",
  /Math\.ceil\(totalSources \/ results\.length\)/.test(digest)
  && /every \$\{sweepDays\} days/.test(digest),
  "the summary line must state the achieved cycle, not only the fraction");

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
