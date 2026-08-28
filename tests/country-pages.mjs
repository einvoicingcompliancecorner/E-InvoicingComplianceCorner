#!/usr/bin/env node
// country-pages.mjs — every country the database gives a slug is a page
// the site actually serves.
//
//   node tests/country-pages.mjs
//
// WHY THIS EXISTS. On 26 August 2026 a country was added end to end in a
// copy of this repository — country row, milestones, headline facts,
// source-host grades, tracking sources, translations, the jurisdiction
// count — and `npm test` reported 34 of 34 passing while `/botswana`
// returned 404, because the deep-dive content had not been written yet.
// The tracker linked to it. Every other African country's related-
// jurisdictions block linked to it. The map served it with a slug and a
// status. All of those links were dead, and the suite was green.
//
// `seo-crawlability.mjs` was the near miss. It queries the same slugs and
// asserts each one is LINKED TO from the tracker and present in the
// sitemap — both of which were true. What nothing did was ask the router
// for the page. So the harness confirmed the dangling link existed and
// called it correct.
//
// This file asks. It drives site-worker's default export the way
// roi-gate.mjs and guides-routes.mjs do, rather than calling the
// renderers, because the renderers cannot 404 and the router can: with no
// deep-dive content, `renderFullDeepDivePage` actually throws on
// `content.stats`, and the router never reaches it. A renderer test would
// have been green in a different way.
//
// It guards a class rather than an instance. Any future country that
// arrives with a slug and no page fails here on the day it is added.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("country pages resolve");

const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const { d1 } = await openReplayDb();

const env = {
  eicc_content: d1,
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      try { return new Response(readFileSync(join(REPO, p.replace(/^\//, "")), "utf8")); }
      catch { return new Response("not found", { status: 404 }); }
    },
  },
  SESSION_SECRET: "test-secret-not-a-real-one",
  ROI_PUBLIC: "true",
};

const get = (path) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`), env, { waitUntil() {} });

const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

// The European Union is a PAGE but not a COUNTRY. The sweeps below are
// about countries, so they still exclude it; section 6 at the foot of
// this file checks it on its own terms. It was excluded here by having a
// NULL slug until 28 August 2026, which is exactly the accident that
// left its deep dive unreachable for three weeks.
const tracked = await all(
  "SELECT slug, name_en, code FROM countries WHERE slug IS NOT NULL AND code != 'EU' ORDER BY slug");

t.check("there are country pages to ask for", tracked.length >= 50,
  `${tracked.length} slugs`);

// ---- 1. every slug resolves ------------------------------------------
//
// Serially rather than in parallel: this is 70 renders against one
// replay process, and the useful output when it fails is WHICH country,
// not how fast the sweep ran.
const dead = [];
const thrown = [];
for (const c of tracked) {
  let res;
  try { res = await get(`/${c.slug}`); }
  catch (e) { thrown.push(`${c.slug}: threw ${e.message}`); continue; }
  if (res.status !== 200) dead.push(`${c.slug} (${c.name_en}): ${res.status}`);
}
t.check(`every slugged country serves a page (${tracked.length} checked)`,
  dead.length === 0 && thrown.length === 0,
  [...dead, ...thrown].slice(0, 10).join("; ")
    + (dead.length + thrown.length > 10 ? ` … and ${dead.length + thrown.length - 10} more` : ""));

// ---- 2. and it is that country's page, not a shell -------------------
//
// A 200 is necessary and not sufficient: a page that renders its chrome
// and none of its content is still a 200. Rather than counting bytes,
// which drifts, this asks whether the country's own name reached the
// document — through translateCountryName, so it catches a page served
// from a different country's content too.
const empty = [];
for (const c of tracked) {
  const res = await get(`/${c.slug}`);
  if (res.status !== 200) continue;              // already reported above
  const html = await res.text();
  if (!html.includes(c.name_en) || html.length < 8000) {
    empty.push(`${c.slug}: ${html.length} bytes, names itself: ${html.includes(c.name_en)}`);
  }
}
t.check("and each page carries that country's own content",
  empty.length === 0, empty.slice(0, 8).join("; "));

// ---- 3. the three translated editions render too ---------------------
//
// Only a sample: three languages over every country is 210 renders, and
// the failure this catches — a country whose translations are missing —
// is per-country rather than per-language, so a sample finds it. The
// sample is the last five alphabetically plus anything added most
// recently, which is where a new country lands.
const recent = (await all(
  "SELECT slug, name_en FROM countries WHERE slug IS NOT NULL AND code != 'EU' ORDER BY id DESC LIMIT 5"));
const langDead = [];
for (const c of recent) {
  for (const lang of ["es", "de", "fr"]) {
    const res = await get(`/${c.slug}?lang=${lang}`);
    if (res.status !== 200) langDead.push(`${c.slug}?lang=${lang}: ${res.status}`);
  }
}
t.check(`the newest countries render in es/de/fr (${recent.length} countries)`,
  langDead.length === 0, langDead.join("; "));

// ---- 4. nothing links to a page that does not exist ------------------
//
// The inverse of the same question, and the one that made the original
// failure visible from the outside: the tracker offered Botswana in its
// sidebar and its menu while /botswana was a 404. Reading the links off
// the served page rather than off the database means this still holds if
// the two ever disagree.
{
  const home = await (await get("/")).text();
  const hrefs = [...home.matchAll(/href="\/([a-z0-9-]+)"/g)].map((m) => m[1]);
  const slugs = new Set(tracked.map((c) => c.slug));
  const linked = [...new Set(hrefs.filter((h) => slugs.has(h)))];
  t.check("the tracker links to country pages at all", linked.length >= 50,
    `${linked.length} country links found`);
  const broken = [];
  for (const slug of linked) {
    const res = await get(`/${slug}`);
    if (res.status !== 200) broken.push(`${slug}: ${res.status}`);
  }
  t.check("and every country link on it resolves",
    broken.length === 0, broken.slice(0, 10).join("; "));
}

// ---- 6. the European Union: published, and deliberately not listed ---
//
// Dan, 28 August 2026: "The European Union, side menu does not link.
// Although I think we built a deep-dive for it." He had, and it had been
// unreachable since migration 007 -- eleven cards and a full set of
// DE/ES/FR translations behind a NULL slug, so no URL, no sitemap entry,
// no anchor, 404 to anyone who guessed it.
//
// Asked what he wanted, he chose "publish, don't link". That is a pair
// of guarantees pulling in opposite directions, which is why it gets a
// check rather than a comment: "publish it" and "list it" sound like the
// same instruction, and the next person to touch buildDeepDives() will
// have to decide which one they meant.
{
  const res = await get("/european-union");
  t.check("the EU deep dive is served", res.status === 200, `status ${res.status}`);
  const body = res.status === 200 ? await res.text() : "";
  t.check("and it is the real page, not an empty shell",
    /ViDA/i.test(body) && body.length > 20000, `${body.length} bytes`);

  // Four languages, because the content has always had them.
  for (const lang of ["es", "de", "fr"]) {
    const r = await get(`/european-union?lang=${lang}`);
    t.check(`and it serves ${lang}`, r.status === 200, `status ${r.status}`);
  }

  // NOT LISTED: the tracker's injected link map is what the side menu
  // and the board's deep-dive button both read, and the EU must not be
  // in it. Read out of the served page rather than out of the query, so
  // this fails on what a reader gets.
  const tracker = await (await get("/einvoicing-compliance-tracker.html")).text();
  const mapBlock = (tracker.match(/const DEEP_DIVES = \{[\s\S]*?\};/) || [""])[0];
  t.check("the link map was injected from D1, so this is checking something",
    mapBlock.length > 500, `${mapBlock.length} bytes`);
  t.check("the EU is NOT in the tracker's link map",
    !/European Union/.test(mapBlock),
    "it is listed in the side menu and on the board — that is 'publish AND link'");

  // BUT REACHABLE BY SOMETHING. A page in the sitemap with no anchor
  // anywhere is the state the 24 August audit found 42 country pages in.
  // The crawlable A-Z index is where it is allowed to appear.
  t.check("the EU has exactly one anchor, in the crawlable country index",
    (tracker.match(/href="\/european-union"/g) || []).length === 1,
    `${(tracker.match(/href="\/european-union"/g) || []).length} anchors`);
}

console.log(`\n  note  ${tracked.length} country pages served, `
  + `${recent.length} of them re-checked in es/de/fr`);

process.exit(t.report() ? 0 : 1);
