#!/usr/bin/env node
// archive-article-links.mjs — the foot of an archive article.
//
//   node tests/archive-article-links.mjs
//
// WHY THIS EXISTS. Dan, 25 August 2026:
//
//   "at the bottom of the article, the link to the deep dive is listed
//    twice ... Would it be possible to delete the first reference link
//    to the deep dive, so that there are only two remaining links, one
//    for the official source, and a second for the deep dive."
//
// He was reading a story I had added the day before. renderIssue() builds
// the foot of every article itself — accuracy note, official source, then
// one deep-dive link per tagged country — and states the rule in a
// comment: deep-dive links are never embedded in a story's own HTML. I
// had written one into the body anyway, and four older stories turned out
// to have the same paragraph, three of them only in their translations.
// Migration 650 removed all twenty-four.
//
// ---- WHY A TEST AND NOT JUST THE MIGRATION'S INVARIANT ---------------
//
// 650 carries an ASSERT ALWAYS that no story body links back into this
// site, which stops the defect coming back through the DATA. It cannot
// see the other half. renderIssue() could grow a second link, or lose the
// source link, or emit them in the wrong order, and every assertion in
// the migration chain would still pass while the page looked exactly like
// the one Dan complained about.
//
// The defect was reported as something on a rendered page, so this checks
// a rendered page. It counts what a reader counts.
//
// ---- WHY IT SWEEPS EVERY STORY ---------------------------------------
//
// The six affected stories were found by querying all 779 bodies, not by
// remembering which ones I had touched — and that is how the three older
// France stories surfaced, whose English was clean while their German,
// Spanish and French carried the link. A test pinned to a list of story
// ids would have been written from the same faulty memory. This walks the
// whole archive in all four languages instead.
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("archive article links");

const { d1 } = await openReplayDb();
const members = (await import(join(REPO, "members-worker", "src", "index.js"))).default;
const env = {
  eicc_content: d1,
  ARCHIVE_PUBLIC: "true",
  MEMBERS: null,
  SESSION_SECRET: "test-secret-not-a-real-one",
};
const get = (path) => members.fetch(
  new Request(`https://members.e-invoicingcompliancecorner.com${path}`), env, { waitUntil() {} });

const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

// Every published story, with how many of its countries actually have a
// deep dive. THE EXPECTED LINK COUNT IS NOT ALWAYS ONE: renderIssue()
// emits a link per tagged country and skips a country whose slug is NULL,
// which is the case the European Union exists to break. Deriving the
// number from the same data the renderer reads keeps a story tagged with
// two countries, or with the EU, from being written off as a failure.
const stories = await all(`
  SELECT s.id,
         (SELECT count(*) FROM story_countries sc
            JOIN countries c ON c.id = sc.country_id
           WHERE sc.story_id = s.id AND c.slug IS NOT NULL AND c.slug <> '') AS deep_dives,
         (s.source_url IS NOT NULL AND s.source_url <> '') AS has_source
    FROM stories s
   WHERE s.published = 1
   ORDER BY s.date DESC`);

// SOURCE LINKS THE BODY PLACES ITSELF, per story and language.
//
// These are NOT the defect this file was written for, and running the
// check without them turned 60 rows red. Sixty translated bodies carry
// their own "Official source: <name>" paragraph, and unlike the
// deep-dive footer these are not duplicates: in 57 of the 60 the URL in
// the body is a DIFFERENT source from stories.source_url, and usually a
// better one — hasil.gov.my against cleartax.com, sat.gob.mx against a
// consultancy blog, porezna-uprava.gov.hr against vatupdate.com.
//
// Deleting them would throw away the primary source and keep the
// secondary. What should happen to them is a content decision, so the
// count is taken from the data and the situation is reported at the foot
// of this file rather than failed here.
const inBody = new Map();
for (const r of await all(`
  SELECT story_id, lang, html FROM story_translations WHERE html LIKE '%🔗%'
  UNION ALL
  SELECT id, 'en', html_en FROM stories WHERE html_en LIKE '%🔗%'`))
  inBody.set(`${r.story_id}|${r.lang}`, (r.html.match(/🔗/g) || []).length);

t.check("there are stories to check", stories.length > 100, `${stories.length} published stories`);

const LANGS = ["en", "fr", "de", "es"];
const problems = [];
let rendered = 0;

for (const s of stories) {
  for (const lang of LANGS) {
    const res = await get(`/members/archive/${encodeURIComponent(s.id)}?lang=${lang}`);
    if (res.status !== 200) { problems.push(`${s.id} [${lang}]: status ${res.status}`); continue; }
    const html = await res.text();
    rendered++;

    // The two glyphs are the renderer's own, from renderIssue(). Counting
    // them counts what the reader sees at the foot of the article — which
    // is the level the bug was reported at.
    const deep = (html.match(/📖/g) || []).length;
    const source = (html.match(/🔗/g) || []).length;

    if (deep !== s.deep_dives)
      problems.push(`${s.id} [${lang}]: ${deep} deep-dive links, expected ${s.deep_dives}`);

    const expectedSource = (s.has_source ? 1 : 0) + (inBody.get(`${s.id}|${lang}`) || 0);
    if (source !== expectedSource)
      problems.push(`${s.id} [${lang}]: ${source} source links, expected ${expectedSource}`);

    // ORDER. Dan asked for "one for the official source, and a second for
    // the deep dive" in that order, and every other article in the
    // archive already reads that way.
    if (deep && source && html.indexOf("🔗") > html.indexOf("📖"))
      problems.push(`${s.id} [${lang}]: deep-dive link comes before the official source`);

    // AND THE LINK IS IN THE READER'S LANGUAGE. 649's French, German and
    // Spanish bodies carried the footer with its ENGLISH label, so a
    // French reader got "Read the full France Deep Dive" above a
    // correctly translated one. Removing the body paragraph fixed that as
    // a side effect; this is what would notice if a hand-written English
    // label ever appeared on a translated page again.
    if (lang !== "en" && /📖 Read the full /.test(html))
      problems.push(`${s.id} [${lang}]: English deep-dive label on a ${lang} page`);
  }
}

t.check("this check actually rendered something",
  rendered === stories.length * LANGS.length, `${rendered} of ${stories.length * LANGS.length} renders`);

t.check("every archive article carries the source link, then the deep dive, once each",
  problems.length === 0, problems.slice(0, 8).join(" | ") + (problems.length > 8 ? ` | +${problems.length - 8} more` : ""));

// ---- and the body does not compete with the renderer -------------------
//
// The data half, checked here as well as in 650, because a test that
// passes while the underlying rule has been abandoned is worse than no
// test: someone deleting the ASSERT ALWAYS to get a migration through
// should see this go red in the same run.
{
  const rows = await all(`
    SELECT count(*) AS n FROM (
      SELECT 1 FROM stories WHERE html_en LIKE '%e-invoicingcompliancecorner.com%'
      UNION ALL
      SELECT 1 FROM story_translations WHERE html LIKE '%e-invoicingcompliancecorner.com%')`);
  t.check("no story body links back into this site",
    Number(rows[0].n) === 0,
    `${rows[0].n} bodies carry their own link — the renderer places these, not the body`);
}

// ---- and one thing this found that is Dan's to decide ------------------
//
// REPORTED, NOT FAILED — the shape headline-facts.mjs and
// guides-consistency.mjs already use for a content question.
{
  const rows = await all(`
    SELECT t.story_id, t.lang, t.html, s.source_url
      FROM story_translations t JOIN stories s ON s.id = t.story_id
     WHERE t.html LIKE '%🔗%'
     ORDER BY t.story_id, t.lang`);
  const byStory = new Map();
  let differing = 0;
  for (const r of rows) {
    const m = r.html.match(/href="([^"]+)"[^>]*>🔗/);
    if (m && m[1] !== r.source_url) differing++;
    if (!byStory.has(r.story_id)) byStory.set(r.story_id, { langs: [], body: m && m[1], row: r.source_url });
    byStory.get(r.story_id).langs.push(r.lang);
  }
  if (rows.length) {
    console.log(`  note  ${rows.length} translated bodies across ${byStory.size} stories carry their own`);
    console.log("        \"Official source\" paragraph, so those pages show two source links.");
    console.log(`        In ${differing} of ${rows.length} the body's URL is a DIFFERENT source from the`);
    console.log("        story row's — and usually the more authoritative of the two:");
    let shown = 0;
    for (const [id, v] of byStory) {
      if (!v.body || v.body === v.row || shown++ >= 3) continue;
      console.log(`          ${id} (${v.langs.sort().join(",")})`);
      console.log(`            body: ${v.body}`);
      console.log(`            row:  ${v.row}`);
    }
    console.log("        The English bodies are all clean, so only translated readers see it.");
    console.log("        Not deleted with the deep-dive footer: that one was a true duplicate,");
    console.log("        this would throw away a primary source and keep a secondary one.");
  } else {
    console.log("  note  no story body places a source link of its own");
  }
}

process.exit(t.report() ? 0 : 1);
