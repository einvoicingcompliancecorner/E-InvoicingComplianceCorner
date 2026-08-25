#!/usr/bin/env node
// headline-facts.mjs — the five tiles, on the deep-dive pages.
//
//   node tests/headline-facts.mjs
//
// WHY THIS EXISTS. Dan asked on 25 August for the compliance guide's
// headline tiles — the mandate (B2G/B2B/B2C), e-reporting, archiving and
// digital signature — to appear on the country deep dives too. The data
// already existed; the risk was never the data.
//
// It guards three things, and the first two are failure modes this
// project has already been bitten by ON THESE EXACT TILES.
//
//   1. TEXT THAT DOES NOT FIT IS CLIPPED, NOT WRAPPED. The guide lost the
//      tail of a German note this way and no test saw it: the element's
//      height is unchanged and the text is all still in the DOM. The
//      first version of the deep-dive strip reproduced it in all four
//      languages — CONDITIONNELLE, CONDICIONAL, NICHT ERFORDERLICH and
//      the plain English CONDITIONAL all lost their ends, because six
//      print columns give a card a 103px content box and ERFORDERLICH
//      measures 135px. Only a rendered measurement catches that.
//
//   2. TWO SOURCES FOR ONE FACT. The deep-dive stat strip is free-form
//      per country and 23 countries already state an archiving period in
//      it. That now sits directly under a tile stating the same fact from
//      country_headline_facts. Where they disagree the page contradicts
//      itself — which already happened on the guide, and Romania is in
//      both stories. Reported, not failed: the disagreement is a content
//      decision for Dan, and the same reporting shape guides-consistency
//      already uses.
//
//   3. ONE VOCABULARY. The guide and the deep dive share headlineTiles()
//      precisely so a country cannot read ACTIVE on one surface and
//      something else on the other. If the two ever stop sharing it, this
//      says so.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite, launch } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("headline facts");

const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const { d1 } = await openReplayDb();
const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

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

// ---- 1. one vocabulary, shared -----------------------------------------
{
  const hf = await import(join(REPO, "shared", "headline-facts.mjs"));
  const guides = readFileSync(join(REPO, "shared", "guides-render.mjs"), "utf8");
  const deep = readFileSync(join(REPO, "shared", "deep-dive-render.mjs"), "utf8");
  t.check("both renderers import the tiles from the shared leaf",
    /from "\.\/headline-facts\.mjs"/.test(guides) && /from "\.\/headline-facts\.mjs"/.test(deep),
    "a second copy of the status vocabulary would let the two surfaces drift");
  t.check("and neither defines its own status map",
    !/const HL_STATUS/.test(guides) && !/const HL_STATUS/.test(deep));

  // The wrapper class is the ONLY thing the two surfaces are allowed to
  // vary. If the markup itself ever forks, this catches it.
  const h = {
    b2g_status: "active", b2b_status: "planned", b2b_date: "2027-01-01",
    b2c_status: "no_mandate", archiving_status: "years", archiving_years: 10,
    signature_status: "required", ereporting_status: "active",
    ereporting_frequency: "monthly", ereporting_system: "JPK_V7M",
  };
  const tr = (_k, en) => en;
  const guideOut = hf.headlineTiles(h, tr);
  const deepOut = hf.headlineTiles(h, tr, "hl-strip");
  t.check("the two surfaces differ only in the wrapper class",
    guideOut.replace('<div class="statstrip hl">', "") === deepOut.replace('<div class="hl-strip">', ""));
}

// ---- 2. nothing is clipped, in any language, at any width --------------
//
// The measurement is scrollWidth > clientWidth on the value elements: a
// clipped word overflows its box while the box keeps its height, which is
// exactly why reading the HTML cannot see it.
const browser = await launch();
{
  const COUNTRIES = ["poland", "germany", "france", "turkey", "brazil", "italy"];
  const LANGS = ["en", "de", "fr", "es"];
  const WIDTHS = [1280, 980, 760, 560, 380];
  const problems = [];
  let measured = 0;
  for (const c of COUNTRIES) {
    for (const lang of LANGS) {
      const html = await (await get(`/${c}${lang === "en" ? "" : `?lang=${lang}`}`)).text();
      for (const width of WIDTHS) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.setContent(html, { waitUntil: "domcontentloaded" });
        const r = await page.evaluate(() => {
          const strip = document.querySelector(".hl-strip");
          if (!strip) return { missing: true };
          const clipped = [...strip.querySelectorAll(".v, .sv, .l, .sl, .n, .sn, .sys")]
            .filter((e) => e.scrollWidth > e.clientWidth + 1)
            .map((e) => `${e.className}="${e.textContent.trim().slice(0, 24)}"`);
          return { clipped, over: strip.scrollWidth - strip.clientWidth };
        });
        await page.close();
        measured++;
        if (r.missing) { problems.push(`/${c} ${lang} @${width}: no strip rendered`); continue; }
        if (r.clipped.length) problems.push(`/${c} ${lang} @${width}: clipped ${r.clipped.join(", ")}`);
        if (r.over > 1) problems.push(`/${c} ${lang} @${width}: strip overflows its column by ${r.over}px`);
      }
    }
  }
  t.check("this check actually rendered something",
    measured === COUNTRIES.length * LANGS.length * WIDTHS.length, `${measured} renders`);
  t.check("no headline value is clipped, in any language at any width",
    problems.length === 0, problems.slice(0, 6).join(" | "));
}
await browser.close();

// ---- 3. the tiles and the free-form stats do not contradict ------------
//
// REPORTED, NOT FAILED. Which of two numbers is right is a content
// decision, and a failing suite would either block the feature or invite
// somebody to silence the check. guides-consistency prints its
// disagreements the same way for the same reason.
{
  const rows = await all(`
    SELECT c.name_en AS country, dst.stat_value AS v, dst.stat_label AS l,
           f.archiving_years AS yrs
      FROM deep_dive_stats ds
      JOIN countries c ON c.id = ds.country_id
      JOIN deep_dive_stat_translations dst ON dst.stat_id = ds.id AND dst.lang = 'en'
      JOIN country_headline_facts f ON f.country_id = c.id
     ORDER BY c.name_en`);
  const arch = rows.filter((r) => /archiv|retention/i.test(`${r.v} ${r.l}`));
  const disagree = [];
  for (const r of arch) {
    const n = (String(r.v).match(/\d+/) || [])[0];
    if (n == null || r.yrs == null) continue;   // not comparable, not a contradiction
    if (Number(n) !== Number(r.yrs)) disagree.push(`${r.country}: stat strip "${r.v}", tile "${r.yrs} yrs"`);
  }
  // THE ONLY ARCHIVING TILES LEFT ARE THE CONTESTED ONES.
  //
  // Migration 643 removed 43 tiles that restated a headline fact, and held
  // back exactly three: Belgium, Romania and China each state archiving
  // twice with DIFFERENT numbers, and deleting one side there would not
  // resolve the contradiction, it would decide it in the tile's favour
  // without anyone checking which number is right.
  //
  // This assertion is stronger than the ">= 5 to compare" it replaces,
  // which was written before the deduplication and would now pass on a
  // migration that had removed nothing at all. It says the sweep happened
  // AND that it stopped where it was told to.
  const CONTESTED = ["Belgium", "China", "Romania"];
  t.check("only the contested archiving tiles survived the deduplication",
    arch.length === CONTESTED.length
      && CONTESTED.every((c) => arch.some((r) => r.country === c)),
    `${arch.length} archiving stat tiles: ${arch.map((r) => r.country).join(", ")}`);
  t.check("and every one of them is a genuine disagreement, not a leftover",
    disagree.length === arch.length,
    `${arch.length} held back, ${disagree.length} actually disagree — a tile that AGREES should have been removed`);
  if (disagree.length) {
    console.log(`  note  ${disagree.length} countries state archiving twice, with different numbers:`);
    for (const d of disagree) console.log(`          ${d}`);
    console.log("        Both appear on the same page, ~40px apart. A content decision, not a code one.");
  } else {
    console.log("  note  no country contradicts itself on archiving");
  }
}

process.exit(t.report() ? 0 : 1);
