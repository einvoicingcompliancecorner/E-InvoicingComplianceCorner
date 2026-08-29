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
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite, launch } from "./lib/browser.mjs";
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
// this file (section 5) checks it on its own terms. It was excluded here by having a
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

// ---- 5. the European Union: linked like any other page, counted like
//         nothing at all --------------------------------------------------
//
// Dan, 28 August 2026: "The European Union, side menu does not link.
// Although I think we built a deep-dive for it." He had, and it had been
// unreachable since migration 007 -- eleven cards and a full set of
// DE/ES/FR translations behind a NULL slug, so no URL, no sitemap entry,
// no anchor, 404 to anyone who guessed it.
//
// THE FIRST VERSION OF THIS BLOCK ASSERTED THE OPPOSITE OF WHAT HE
// WANTED, and passed. I offered him three options and wrote the middle
// one as "publish, don't link -- the sidebar keeps it as plain text".
// He picked it. Then he deployed it:
//
//   "the European Union sidebar menu item that lives among other
//    deep-dives does not link to a deep dive on the European Union...
//    the deep-dive alone was considered to provide EU wide information
//    from EU sources, without it having to be replicated across all
//    member states. ... the European Union menu item in the side bar,
//    still does nothing."
//
// What he had said he did not want was a SUBSCRIPTION -- "a check-box or
// ability to subscribe". I heard "not in the reader-facing lists",
// collapsed the subscription checklist and the side menu into one idea,
// bound both to in_picker, and then wrote the option text in my
// vocabulary rather than his, so his answer was to a question he could
// not see. A check written from a misheard requirement is worse than no
// check: it passed, and it made the mistake look deliberate.
//
// So this block now pins the distinction that actually exists, in both
// directions -- because "it has a page" and "it is one of the countries"
// really are different, and the next person will have to decide which
// they mean.
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

  // LINKED. The tracker's injected map is what the side menu and the
  // board's deep-dive button both read. Checked against the served page
  // rather than the query, so it fails on what a reader gets -- which is
  // the level at which Dan found it twice.
  const tracker = await (await get("/einvoicing-compliance-tracker.html")).text();
  const mapBlock = (tracker.match(/const DEEP_DIVES = \{[\s\S]*?\};/) || [""])[0];
  t.check("the link map was injected from D1, so this is checking something",
    mapBlock.length > 500, `${mapBlock.length} bytes`);
  t.check("the EU IS in the tracker's link map, so the side menu links it",
    /"European Union":\s*"\/european-union"/.test(mapBlock),
    "the sidebar row renders as plain text — 'still does nothing'");
  t.check("and it has a crawlable anchor too",
    (tracker.match(/href="\/european-union"/g) || []).length >= 1,
    "no anchor: sitemapped but invisible to anything that does not run JS");

  // AND NOT SUBSCRIBABLE, which is the thing he actually asked to
  // withhold. Two independent lists, neither of which is the side menu:
  // the monthly digest's checklist is built from countries.js, and every
  // headline count and the ROI picker read in_picker.
  const countriesJs = await (await get("/countries.js")).text();
  t.check("the subscription checklist has no European Union checkbox",
    !/European Union/.test(countriesJs),
    "a reader could subscribe to the EU as if it were a jurisdiction");
  const picker = await all(
    "SELECT in_picker FROM countries WHERE code = 'EU'");
  t.check("and the EU is not one of the counted jurisdictions",
    picker.length === 1 && picker[0].in_picker === 0,
    `in_picker = ${picker[0] && picker[0].in_picker}`);

  // ---- and now the thing Dan actually looked at --------------------
  //
  // Every check above this line passed on the version he called
  // "still does nothing", or would have if I had written it the other
  // way round. They read the injected map, which is the instruction;
  // renderSidebar() decides whether a row becomes an <a> or a <div>,
  // and that is the rendered result. Rule 2 of the project, and this
  // is the second time on this one feature that the difference has
  // been where the defect lived.
  //
  // Rendered from the WORKER'S output, in the repo root so the page's
  // relative assets resolve, and read back off the element.
  const tmp = join(REPO, "_eu-sidebar-check.html");
  writeFileSync(tmp, tracker);
  const browser = await launch();
  let row = null;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`file://${tmp}`, { waitUntil: "load" });
    await page.waitForTimeout(2000);
    row = await page.evaluate(() => {
      const el = [...document.querySelectorAll("#sidebarNav .c-name")]
        .find((e) => /European Union|Europäische Union|Unión Europea|Union européenne/
          .test(e.textContent));
      if (!el) return { found: false };
      return { found: true, tag: el.tagName, href: el.getAttribute("href") || null };
    });
    await page.close();
  } finally {
    await browser.close();
    rmSync(tmp, { force: true });
  }
  t.check("the EU row exists in the rendered side menu", row && row.found,
    "the sweep found no such row, so the two checks below are vacuous");
  t.check("and it is an anchor, not two words of plain text",
    row && row.tag === "A", `rendered as <${(row && row.tag || "?").toLowerCase()}>`);
  t.check("and the anchor points at the deep dive",
    row && row.href === "/european-union", `href = ${row && row.href}`);
}

console.log(`\n  note  ${tracked.length} country pages served, `
  + `${recent.length} of them re-checked in es/de/fr`);

process.exit(t.report() ? 0 : 1);
