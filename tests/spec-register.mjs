#!/usr/bin/env node
// spec-register.mjs — the register serves what it claims, in four
// languages, and never promises acceptance.
//
//   node tests/spec-register.mjs
//
// WHY THIS EXISTS. The specification register publishes twenty download
// links and calls them authoritative. Three things about that can go
// wrong quietly, and this file is one check for each.
//
//   1. IT COULD PROMISE TOO MUCH. The feasibility study behind this
//      feature found that a conformance checker can honestly say "this
//      matches the published artefact" and can never say "this will be
//      accepted" — every platform applies checks no artefact describes,
//      and for most clearance regimes you cannot even test against the
//      authority's own validator without credentials tied to a
//      registered domestic taxpayer. The page carries a caveat saying
//      so. A caveat that survives in English and is dropped in German
//      is the same page making a promise in one language it refuses in
//      another, and nothing else in this repository would see it.
//
//   2. IT COULD LEAK ITS OWN VOCABULARY. capture_status, licence_status
//      and access hold controlled words — 'not_yet', 'permissive_
//      unnamed', 'restrictive'. Rendered raw they are meaningless to a
//      reader, and the fallback path that produces them is invisible in
//      English because the labels happen to exist there.
//
//   3. ITS LINKS COULD GO UNWATCHED. Migration 635 widened the content
//      monitor to follow citations rather than a curated list, one day
//      before this table existed. A new table of URLs that nobody adds
//      to cited_sources is failure class C reopened — a monitor cannot
//      see what was never declared to it — and the monitor would report
//      a clean sweep while the register quietly went stale.
//
// The gate is tested the way roi-gate and guides-routes test theirs:
// through the REAL router, counting D1 queries, because "the gate is
// the route" is a claim about work that does not happen and reading the
// HTML cannot tell that apart from work that happened and was discarded.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { signToken, SESSION_COOKIE } from "../shared/session.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("specification register");

const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const SECRET = "test-secret-not-a-real-one";
const { d1 } = await openReplayDb();
const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

let queries = 0;
const countingDb = { prepare(sql) { queries++; return d1.prepare(sql); } };

const env = {
  eicc_content: countingDb,
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      try { return new Response(readFileSync(join(REPO, p.replace(/^\//, "")), "utf8")); }
      catch { return new Response("not found", { status: 404 }); }
    },
  },
  SESSION_SECRET: SECRET,
  ROI_PUBLIC: "true",
};

const get = (path, cookie) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`,
    { headers: cookie ? { Cookie: cookie } : {} }), env, { waitUntil() {} });
const session = async (email = "dan@example.com", ttl = 3600) =>
  `${SESSION_COOKIE}=${await signToken(SECRET, { email, purpose: "session" }, ttl)}`;

// ---- 1. the gate --------------------------------------------------------

{
  queries = 0;
  const res = await get("/spec-register");
  const html = await res.text();
  t.check("a signed-out request gets a page, not a redirect or a 404",
    res.status === 200, `status ${res.status}`);
  t.check("and no database query ran before the wall",
    queries === 0, `${queries} quer(ies) ran`);
  // The register's own content must not be in the wall. A gate that
  // ships the thing it is gating is the failure roi-gate was written
  // for: "is the gate present" and "is the tool absent" are different
  // questions and a response can contain both.
  t.check("and the register itself is absent from it",
    !/What the artefacts do not tell you/.test(html) && !/XRechnung/.test(html),
    "the gate leaked register content");
  t.check("the wall offers a way in",
    /roiGateSubscribe/.test(html) && /roiGateSignin/.test(html));
  t.check("and refuses indexing",
    /noindex,nofollow/.test(html));
}

// ---- 2. the page, signed in --------------------------------------------

const cookie = await session();
const pages = {};
for (const lang of ["en", "de", "fr", "es"]) {
  const res = await get(`/spec-register?lang=${lang}`, cookie);
  pages[lang] = await res.text();
  t.check(`the ${lang} page renders for a subscriber`,
    res.status === 200 && pages[lang].length > 4000,
    `status ${res.status}, ${pages[lang].length} bytes`);
}

const rows = await all(`
  SELECT c.name_en AS country, c.code, s.capture_status, s.format_name,
         s.licence, s.licence_status, s.access, s.validator_url
    FROM country_spec s JOIN countries c ON c.id = s.country_id`);

t.check("there is a register to check", rows.length >= 15, `${rows.length} countries`);

// EVERY REGISTERED COUNTRY IS ON THE PAGE. A row that renders nowhere is
// research nobody receives.
{
  const absent = rows.filter((r) => !pages.en.includes(r.country));
  t.check("every registered country appears on the page",
    absent.length === 0, absent.map((r) => r.country).join(", "));
}

// ---- 3. the caveat, in every language -----------------------------------
//
// Read from the i18n asset rather than matched against a phrase typed
// here, so the check cannot pass because the test and the page agree on
// a string that is no longer the real one.
{
  const missing = [];
  for (const lang of ["en", "de", "fr", "es"]) {
    const i18n = JSON.parse(readFileSync(join(REPO, "i18n", `${lang}.json`), "utf8"));
    const caveat = ((i18n.spec || {}).caveat || "").slice(0, 60);
    if (!caveat) { missing.push(`${lang}: no spec.caveat in i18n`); continue; }
    if (!pages[lang].includes(caveat.replace(/&/g, "&amp;"))) missing.push(`${lang}: caveat not on the page`);
  }
  t.check("the 'this is not a validator' caveat appears in all four languages",
    missing.length === 0, missing.join("; "));
}

// AND THE GAP NOTE IS TRANSLATED, not falling back to English. The
// renderer COALESCEs onto English per column, which is the right
// behaviour and also the reason a missing translation is invisible: the
// page looks complete. Germany's note is compared across languages.
{
  const notes = await all(`
    SELECT t.lang, t.gap_note FROM country_spec_translations t
      JOIN countries c ON c.id = t.country_id WHERE c.code = 'DE'`);
  const byLang = Object.fromEntries(notes.map((n) => [n.lang, n.gap_note]));
  const wrong = ["de", "fr", "es"].filter((l) =>
    !byLang[l] || byLang[l] === byLang.en || !pages[l].includes(byLang[l].slice(0, 50)));
  t.check("the gap note is the translated one, not the English fallback",
    wrong.length === 0, `fell back or missing in: ${wrong.join(", ")}`);
}

// ---- 4. no raw vocabulary reaches the reader ----------------------------
//
// Every controlled word in the schema, in every language. 'not_yet' or
// 'permissive_unnamed' printed as-is means a label is missing, and the
// English page would look fine because English is where labels get
// added first.
{
  const schema = readFileSync(join(REPO, "members-worker", "migrations",
    "636_spec_register_schema.sql"), "utf8");
  const words = new Set();
  for (const line of schema.split("\n")) {
    const m = line.match(/CHECK \((?:capture_status|licence_status|access|syntax|kind) IN \(([^)]+)\)/);
    if (m) for (const w of m[1].split(",")) words.add(w.trim().replace(/'/g, ""));
  }
  // Words that are legitimately their own label, or that appear inside
  // a class attribute the page uses for styling.
  const STYLED = /class="c st-[a-z_]+"/g;
  const leaks = [];
  for (const lang of ["en", "de", "fr", "es"]) {
    const body = pages[lang].replace(STYLED, "").split("</style>").pop();
    for (const w of words) {
      if (w.includes("_") && body.includes(w)) leaks.push(`${lang}: "${w}"`);
    }
  }
  t.check("no raw vocabulary word is printed to the reader",
    leaks.length === 0, `${words.size} controlled words checked — leaked: ${leaks.join(", ")}`);
}

// ---- 5. the register does not overclaim ---------------------------------
//
// Two counts on the page are the study's findings and must be computed,
// not typed. If the register ever renders a number that disagrees with
// the database, it is the jurisdiction-count failure again in a new
// page: prose and data drifting apart with nothing in between.
{
  const named = rows.filter((r) => r.licence_status === "named").length;
  const validators = rows.filter((r) => r.validator_url).length;
  const strip = (pages.en.match(/<div class="strip">[\s\S]*?<p class="asof"/) || [""])[0];
  t.check("the licence count on the page is the database's",
    new RegExp(`>${named}</div>`).test(strip), `expected ${named} named licences in the strip`);
  t.check("and so is the count of public validators",
    new RegExp(`>${validators}</div>`).test(strip), `expected ${validators} validators in the strip`);
}

// ---- 6. every link the register publishes is watched --------------------
//
// The class-C guard at the level a reader experiences: not "is the row
// in cited_sources" — the migration asserts that — but "is the URL the
// PAGE prints being watched". A renderer that reads from somewhere else,
// or an artefact added straight to the page, would pass the migration's
// assertion and fail this one.
{
  const watched = new Set((await all("SELECT url FROM monitored_sources")).map((r) => r.url));
  const printed = [...pages.en.matchAll(/href="(https:\/\/[^"]+)"/g)].map((m) => m[1]);
  const external = printed.filter((u) => !u.includes("e-invoicingcompliancecorner.com")
    && !u.includes("fonts.googleapis.com") && !u.includes("fonts.gstatic.com"));
  const unwatched = [...new Set(external)].filter((u) => !watched.has(u));
  t.check("every external link the register prints is on the monitor's watch list",
    unwatched.length === 0,
    `${external.length} links printed, ${unwatched.length} unwatched\n        `
    + unwatched.slice(0, 6).join("\n        "));
}

// ---- 7. the menu can reach it -------------------------------------------
{
  const tracker = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");
  t.check("the resources menu carries the register",
    /href="\/spec-register"[^>]*>[\s\S]{0,120}data-i18n="menu.specs"/.test(tracker));
  t.check("and the click is intercepted rather than navigating away",
    /href === '\/spec-register'/.test(tracker) && /openRoiPage\(\{ page: 'specs' \}\)/.test(tracker));
  t.check("the framed panel knows the page",
    /specs: \{\s*src: '\/spec-register\?frame=1'/.test(tracker));
  t.check("and ?view=specs opens it, which is what the announcement email links to",
    /specs:\s+\(\) => openRoiPage\(\{ page: 'specs', skipHistory: true \}\)/.test(tracker));
  for (const lang of ["en", "de", "fr", "es"]) {
    const i18n = JSON.parse(readFileSync(join(REPO, "i18n", `${lang}.json`), "utf8"));
    t.check(`the menu label resolves in ${lang}`,
      Boolean((i18n.menu || {}).specs), "menu.specs missing");
  }
}

// ---- 8. and the frame contract ------------------------------------------
{
  const res = await get("/spec-register?frame=1", cookie);
  const html = await res.text();
  // THE BODY, NOT THE DOCUMENT. `lang-current` is also a CSS rule, so
  // testing the whole page passed on the stylesheet and would have gone
  // on passing with two language switchers on screen.
  const body = html.split("</style>").pop();
  t.check("framed, the page drops its own language row",
    !/lang-current/.test(body), "the frame would show two language switchers");
  t.check("and still carries the marker the panel checks for",
    /class="wrap"/.test(html));
}

console.log(`  note  ${rows.length} jurisdictions rendered in 4 languages; `
  + `${rows.filter((r) => r.capture_status === "published").length} published, `
  + `${rows.filter((r) => r.licence_status === "named").length} under a named licence`);

process.exit(t.report() ? 0 : 1);
