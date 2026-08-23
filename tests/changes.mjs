#!/usr/bin/env node
// changes.mjs — the page that shows what a fact used to say has to agree
// with what the facts now say.
//
//   node tests/changes.mjs
//
// Migration 615 put the five headline statuses on the record; this is the
// page built on it. A change page has one failure mode that matters and
// it is silent: falling behind the data it describes. A reader who checks
// a country against this page and finds it stale learns something about
// the whole site rather than about one row — the same argument
// methodology.mjs opens with, and the reason both pages are tested
// against live queries rather than against fixtures.
//
// The migration's own assertions already guarantee the record is a chain
// and that nothing changes without being recorded. What this suite adds
// is everything between the chain and the reader: that the page prints
// the rows the database holds, in the reader's language, using the same
// status words the tiles use, and that it does not quietly print a blank
// where a status should be.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("changes");
const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const { d1 } = await openReplayDb();

const env = {
  eicc_content: d1,
  SESSION_SECRET: "test-secret-not-a-real-one",
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      try { return new Response(readFileSync(join(REPO, p.replace(/^\//, "")), "utf8")); }
      catch { return new Response("not found", { status: 404 }); }
    },
  },
};
const get = (path) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`), env, { waitUntil() {} });
const q = async (sql) => (await d1.prepare(sql).bind().all()).results;

const res = await get("/changes");
const html = await res.text();
const en = JSON.parse(readFileSync(join(REPO, "i18n", "en.json"), "utf8"));

t.check("the page is served", res.status === 200, `status ${res.status}`);
t.check("it is indexable", !/noindex/.test(html), "a citable page marked noindex");
t.check("it declares a canonical URL",
  html.includes('rel="canonical" href="https://e-invoicingcompliancecorner.com/changes"'));
t.check("it is cacheable — nothing here is per-reader",
  /max-age=\d+/.test(res.headers.get("cache-control") || ""),
  res.headers.get("cache-control"));

// ---- it prints the record, all of it ------------------------------------
//
// The query behind the page asks only for rows with an old_value, because
// 344 rows of "unchanged" would bury the six that matter. That is a
// deliberate filter and it is exactly the kind that silently becomes a
// truncation, so the count is compared against the database.
const changes = await q(`
  SELECT h.id, h.field, h.old_value, h.new_value, h.changed_on, h.kind, c.name_en AS country
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE h.old_value IS NOT NULL ORDER BY h.changed_on DESC, c.name_en`);
t.check(`there are changes on the record to show (${changes.length})`, changes.length > 0,
  "nothing to render — the seed did not land");
t.check("the page renders one entry per recorded change",
  (html.match(/<article class="ch">/g) || []).length === changes.length,
  `${(html.match(/<article class="ch">/g) || []).length} entries for ${changes.length} rows`);

const missing = changes.filter((c) => !html.includes(c.country));
t.check("every changed country is named", missing.length === 0,
  missing.map((c) => c.country).join(", "));

// ---- the words are the tiles' words -------------------------------------
//
// A page saying a country "was VOLUNTARY, now ACTIVE" has to use the two
// words the tile prints. If these ever diverge the reader is comparing
// our prose against our data instead of the data against itself, which is
// the failure /methodology reads from the same subtree to avoid.
const HL = (en.guides && en.guides.hl) || {};
const MANDATE = {
  active: HL.active, planned: HL.planned, voluntary: HL.voluntary,
  no_mandate: HL.none, unknown: HL.unknown,
};
const ARCHIVING = {
  years: en.changes?.arch?.years, varies: HL.arch?.varies,
  no_requirement: HL.arch?.none, unknown: HL.unknown,
};
const SIGNATURE = {
  required: HL.sig?.required, conditional: HL.sig?.conditional,
  not_required: HL.sig?.not, unknown: HL.unknown,
};
const wordFor = (field, value) => (
  field === "archiving_status" ? ARCHIVING
    : field === "signature_status" ? SIGNATURE : MANDATE)[value];

// EVERY VALUE THE COLUMN CAN HOLD, not only the ones that happen to have
// changed. Six changes today exercise three of the fourteen words; the
// other eleven would render blank and nobody would find out until the
// change that used one.
{
  const cols = [
    ["b2g_status", MANDATE], ["b2b_status", MANDATE], ["b2c_status", MANDATE],
    ["archiving_status", ARCHIVING], ["signature_status", SIGNATURE],
  ];
  const unnamed = [];
  for (const [field, table] of cols) {
    const vals = await q(`SELECT DISTINCT new_value AS v FROM fact_history WHERE field = '${field}'`);
    for (const { v } of vals) if (!table[v]) unnamed.push(`${field}=${v}`);
  }
  t.check("every status value the record holds has a word to print",
    unnamed.length === 0,
    `${unnamed.join(", ")} — these would render as a raw column value or a blank`);
}

const wrongWord = changes.filter((c) => {
  const was = wordFor(c.field, c.old_value), now = wordFor(c.field, c.new_value);
  return !was || !now || !html.includes(was) || !html.includes(now);
});
t.check("each change prints the same status words the tiles use",
  wrongWord.length === 0,
  wrongWord.map((c) => `${c.country} ${c.field}: ${c.old_value}→${c.new_value}`).join("; "));

// ---- our own errors are not disguised as the law moving -----------------
//
// The two reasons are different in kind and only one of them is our
// fault. A page that blurred them would be using the change record to
// look diligent while hiding what it is actually for.
{
  const corrections = changes.filter((c) => c.kind === "correction").length;
  t.check(`corrections are labelled as ours (${corrections})`,
    corrections === 0 || html.includes(en.changes.kind.correction),
    `the page never says "${en.changes?.kind?.correction}"`);
  t.check("and the two reasons are visually distinct",
    /class="knd corr"/.test(html) || corrections === 0,
    "our own error renders identically to a mandate moving");
}

// ---- every change explains itself ---------------------------------------
const unexplained = await q(`
  SELECT h.id FROM fact_history h
   WHERE h.kind <> 'first_recorded'
     AND NOT EXISTS (SELECT 1 FROM fact_history_notes n WHERE n.history_id = h.id AND n.lang = 'en')`);
t.check("no change is on the page without a reason", unexplained.length === 0,
  `${unexplained.length} change(s) with nothing to say for themselves`);
// The notes are prose written by hand and go through escHtml, so they are
// compared escaped. The first version of this compared raw text and
// failed on a German note containing a quotation mark — which was a real
// finding about the test, and would have hidden a real finding about the
// page the day one mattered.
// MIRRORS site-worker's escHtml EXACTLY, apostrophes included: it does
// NOT escape them, and an earlier version of this helper did. A note
// containing both an apostrophe and a quotation mark then matched
// neither the raw nor the escaped form, and the check failed on a
// correctly rendered page. A test's model of the escaper has to be the
// escaper.
const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const shows = (page, text) => page.includes(text) || page.includes(esc(text));
{
  const notes = await q("SELECT note FROM fact_history_notes WHERE lang = 'en'");
  const shown = notes.filter((n) => shows(html, n.note)).length;
  t.check(`the reasons are rendered (${shown} of ${notes.length})`, shown === notes.length);
}

// ---- the figures above the list are queried, not written ----------------
{
  const scope = (await q(
    "SELECT count(*) AS facts, count(DISTINCT country_id) AS countries, min(changed_on) AS began FROM fact_history"))[0];
  t.check(`the watched-fact count is live (${scope.facts})`, html.includes(String(scope.facts)));
  t.check(`the jurisdiction count is live (${scope.countries})`, html.includes(String(scope.countries)));
  t.check(`the record's start date is live (${scope.began})`, html.includes(scope.began));

  // AND IT SAYS WHAT THAT DATE MEANS. "First recorded" is the day the
  // record began, not the day the fact was first published, and the
  // migration refuses to invent the latter. A page printing the date
  // without that sentence is claiming the precision the data does not
  // have.
  t.check("and says what that date does and does not mean",
    html.includes(en.changes.begins.split("{0}")[1].trim().slice(0, 60)),
    "the page dates the record without explaining the date");
}

// ---- four languages ------------------------------------------------------
for (const lang of ["en", "es", "de", "fr"]) {
  const doc = JSON.parse(readFileSync(join(REPO, "i18n", `${lang}.json`), "utf8"));
  const flat = {};
  const walk = (node, prefix) => {
    for (const [k, v] of Object.entries(node || {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object") walk(v, key);
      else if (typeof v === "string") flat[key] = v;
    }
  };
  walk(doc.changes, "");
  const want = ["title", "intro", "watch", "begins", "none", "count.one", "count.other",
    "kind.correction", "kind.moved", "lbl.was", "lbl.now", "lbl.why", "lbl.src",
    "arch.years", "back", "link.method", "link.fix", "eyebrow", "opened"];
  const gone = want.filter((k) => typeof flat[k] !== "string");
  t.check(`i18n/${lang}.json carries the changes strings`, gone.length === 0,
    `missing: ${gone.join(", ")}`);
  t.check(`i18n/${lang}.json has the menu label`, typeof doc.menu?.changes === "string");
}
{
  const de = await (await get("/changes?lang=de")).text();
  const deDoc = JSON.parse(readFileSync(join(REPO, "i18n", "de.json"), "utf8"));
  t.check("the German render uses the German strings",
    de.includes(deDoc.changes.title) && de.includes(deDoc.changes.kind.correction),
    "the page fell back to English for a language that has translations");

  // THE REASONS ARE TRANSLATED TOO, and this is the half most likely to
  // rot: the strings are generated, the per-change notes are written by
  // hand once per change.
  const deNotes = await q("SELECT note FROM fact_history_notes WHERE lang = 'de'");
  t.check(`the German reasons are rendered (${deNotes.length})`,
    deNotes.length > 0 && deNotes.every((n) => shows(de, n.note)),
    "a German reader is shown an English explanation");
}

// ---- reachable -----------------------------------------------------------
{
  const tracker = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");
  t.check("the Menu dropdown carries a What-changed button",
    /<button class="dropdown-item" id="ddChanges"/.test(tracker));
  t.check("it opens the pop-out rather than navigating",
    tracker.includes("openChanges()") && tracker.includes('id="changesOverlay"'));
  t.check("the pop-out names the changes route",
    /openDocPopout\('changesOverlay','changesFrame','\/changes'\)/.test(tracker));
  t.check("the iframe is not fetched until it is opened",
    !/<iframe id="changesFrame"[^>]*\ssrc=/.test(tracker),
    "a src in the markup downloads the page on every visit to the board");
  t.check("the menu label is translatable",
    tracker.includes('data-i18n="menu.changes"'));
  t.check("the close button the wiring looks for exists",
    tracker.includes('id="changesModalClose"'),
    "wireDocPopout would throw on a null and take the rest of boot with it");
  const sitemap = readFileSync(join(REPO, "sitemap.xml"), "utf8");
  t.check("it is in the sitemap", sitemap.includes("/changes"));
  t.check("and /methodology sends readers to it",
    (await (await get("/methodology")).text()).includes('href="/changes"'),
    "the page that promised this has no link to it");
}

// ---- the framed render ---------------------------------------------------
{
  const framed = await (await get("/changes?frame=1")).text();
  t.check("framed: no back link — it would navigate the iframe",
    !framed.includes('class="back-link"'));
  t.check("framed: no language row — the site's own banner governs",
    !framed.includes('class="langs"'));
  t.check("framed: noindex, so only the real URL is crawlable",
    /<meta name="robots" content="noindex,nofollow">/.test(framed));
  t.check("framed: no JSON-LD — a second node claiming the same @id",
    !/application\/ld\+json/.test(framed));

  // THE LINKS AT THE FOOT ESCAPE THE FRAME. Without target="_top" they
  // load a whole page, chrome and all, inside a dialog on top of the
  // board — which is precisely why the framed copy drops its back link.
  t.check("framed: the footer links break out of the iframe",
    (framed.match(/<p class="cta">[\s\S]*?<\/p>/) || [""])[0]
      .split("<a ").slice(1).every((a) => a.includes('target="_top"')),
    "a link in the modal would load a tracker inside the dialog");
}

// ---- the register, and the line that retires itself ---------------------
//
// Dan, 22 August: "Given that we currently have no subscribers, I'd like
// to avoid statements like 'We were wrong' in the change log."
//
// Two halves, and the second is the one that needs proving. Softening a
// label is a string edit. Claiming a sentence "only appears while every
// change is from the day the record opened" is a behaviour, and an
// untested claim about a disappearing element is indistinguishable from
// one that never appears — or one that never leaves.
{
  for (const lang of ["en", "de", "fr", "es"]) {
    const doc = JSON.parse(readFileSync(join(REPO, "i18n", `${lang}.json`), "utf8"));
    t.check(`i18n/${lang}.json: the correction label is not a confession`,
      !/we were wrong|wir lagen falsch|trompés|nos equivocamos/i.test(doc.changes.kind.correction),
      doc.changes.kind.correction);
  }
  // AND NOWHERE A PAGE CAN RENDER IT. The i18n value was changed and the
  // renderer's own English fallback was not, so it still read "We were
  // wrong" — and a fallback is what a reader gets whenever the i18n
  // lookup comes up empty, which is precisely the moment nobody is
  // watching. Every other fallback on this page is a shortened form of
  // its translation, which is fine; one that CONTRADICTS its translation
  // is not, and this is the cheap check that says so.
  {
    const sources = ["site-worker/src/index.js", "einvoicing-compliance-tracker.html"]
      .map((f) => [f, readFileSync(join(REPO, f), "utf8")]);
    const guilty = sources.filter(([, text]) =>
      // Comments are allowed to name the retired phrase — 617's header
      // and this file's own do. Code is not.
      text.split("\n").some((line) =>
        /we were wrong/i.test(line) && !/^\s*(\/\/|\*|<!--)/.test(line)));
    t.check("the retired phrase is not left in any renderable string",
      guilty.length === 0,
      guilty.map(([f]) => f).join(", ") + " still carries it outside a comment");
  }

  // BUT STILL TWO CATEGORIES. Softening the label was the ask;
  // collapsing our correction into "the law moved" was not, and it is
  // the edit that would actually cost the page its reason to exist.
  t.check("a correction is still labelled differently from a mandate moving",
    en.changes.kind.correction !== en.changes.kind.moved,
    "the two reasons a fact changes now read identically");

  // THE RULE, NOT YESTERDAY'S DATA. This first read "the opening note is
  // shown", which was true only while every change on the record came
  // from the day it opened. Migration 620 added four dated later and the
  // check failed — correctly, because the line had withdrawn itself
  // exactly as designed. A test that has to be edited every time the
  // feature works is testing the fixture, so it now computes the same
  // condition the renderer does.
  const opened = (await q("SELECT min(changed_on) AS b FROM fact_history"))[0].b;
  const allFromOpening = changes.length > 0 && changes.every((c) => c.changed_on === opened);
  t.check(`the opening note follows the rule (all from ${opened}: ${allFromOpening})`,
    html.includes(en.changes.opened) === allFromOpening,
    allFromOpening
      ? "every change is from the day the record opened and the note is missing — "
        + "they read as corrections to facts someone relied on"
      : "changes now exist from after the record opened, so the note describes "
        + "entries it no longer covers and must not be printed");

  // AND IT GOES. A change dated after the record opened makes the
  // sentence false, so it has to stop being printed.
  const recordStart = (await q("SELECT min(changed_on) AS b FROM fact_history"))[0].b;
  const victim = (await q(`
    SELECT h.id, h.country_id, h.field, h.new_value FROM fact_history h
     WHERE h.old_value IS NOT NULL ORDER BY h.id LIMIT 1`))[0];
  await d1.prepare(`
    INSERT INTO fact_history (country_id, field, old_value, new_value, changed_on, kind)
    VALUES (?, ?, ?, ?, ?, 'moved')`)
    .bind(victim.country_id, victim.field, victim.new_value, "voluntary", "2027-01-01").run();
  const later = await (await get("/changes")).text();
  t.check("and withdraws itself once something has genuinely moved",
    !later.includes(en.changes.opened),
    `a synthetic change dated 2027-01-01 (record began ${recordStart}) left the `
    + "opening note in place, where it now describes entries it does not cover");
  t.check("the later change is listed",
    (later.match(/<article class="ch">/g) || []).length === changes.length + 1);
  t.check("and is labelled as the law moving, not as our correction",
    later.includes(en.changes.kind.moved) && /class="knd moved"/.test(later));
}

process.exit(t.report() ? 0 : 1);
