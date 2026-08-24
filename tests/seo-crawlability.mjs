#!/usr/bin/env node
// seo-crawlability.mjs — what a crawler that does not run JavaScript
// can actually reach.
//
//   node tests/seo-crawlability.mjs
//
// WHY THIS EXISTS. The 24 August SEO audit found the site's primary
// page serving 718 words of indexable HTML with NO link to any of the
// seventy country deep dives — the board is built by renderBoard() from
// a JavaScript array, and DEEP_DIVES is injected as a JS object literal,
// so every country link on the tracker existed only after JavaScript
// ran. Forty-two of those seventy pages were in neither sitemap.xml nor
// any anchor anywhere on the site: to anything that reads HTML rather
// than executing it, they were not on the internet.
//
// Both halves of that were invisible to every existing check, and for
// the same reason: the suites here call renderers directly or drive a
// real browser, and a real browser runs the JavaScript that hides the
// problem. THIS FILE READS THE SERVED HTML AS TEXT, which is the only
// way to see what a non-rendering crawler sees.
//
// It guards three things, all of which were wrong on 24 August:
//
//   1. The tracker carries real anchors to every country page.
//   2. The sitemap covers exactly what the router serves — it was 28 of
//      70, and it was hand-maintained, which is why.
//   3. Every country page has a meta description and social tags. All
//      seventy had none, so every share rendered as a bare URL.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("seo crawlability");

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

const tracked = await all(
  "SELECT slug, name_en FROM countries WHERE slug IS NOT NULL AND code != 'EU' ORDER BY slug");
t.check("there are countries to be reachable", tracked.length >= 50, `${tracked.length} slugs`);

// ---- 1. the tracker, read as text --------------------------------------

const trackerHtml = await (await get("/einvoicing-compliance-tracker.html")).text();

// SCRIPTS STRIPPED FIRST. This is the whole point of the file: a country
// slug inside a JS array is not a link, and counting it as one is how
// the gap survived. Everything below looks only at markup.
const markup = trackerHtml.replace(/<script[\s\S]*?<\/script>/gi, " ");

{
  const hrefs = new Set([...markup.matchAll(/href="\/([a-z0-9-]+)"/g)].map((m) => m[1]));
  const missing = tracked.filter((c) => !hrefs.has(c.slug));
  t.check("every country is reachable by a real anchor, with no JavaScript",
    missing.length === 0,
    `${tracked.length - missing.length}/${tracked.length} linked; missing: `
    + missing.slice(0, 8).map((c) => c.slug).join(", "));
}

{
  // And they are in the index, not scattered — so the check above cannot
  // start passing because a country name happened to appear elsewhere.
  const nav = (markup.match(/<nav class="country-index"[\s\S]*?<\/nav>/) || [""])[0];
  const links = [...nav.matchAll(/href="\/([a-z0-9-]+)"/g)].length;
  t.check("and they are inside the country index",
    links === tracked.length, `${links} anchors in the index, ${tracked.length} countries`);
  t.check("the index says what it is, in words the reader can read",
    /data-i18n="index.heading"/.test(nav) && /data-i18n="index.intro"/.test(nav));
}

{
  // AND EVERY DATE IN IT IS STILL AHEAD. The first version of the index
  // printed each country's EARLIEST milestone under a heading promising
  // its next one, so the United States advertised 2003-03-01 as a thing
  // to prepare for. Both the label and the data were individually true;
  // together they were wrong, which is the shape of defect only a
  // rendered read catches.
  const today = new Date().toISOString().slice(0, 10);
  const nav = (markup.match(/<nav class="country-index"[\s\S]*?<\/nav>/) || [""])[0];
  const dates = [...nav.matchAll(/class="ci-date">([^<]+)</g)].map((m) => m[1].trim());
  const past = dates.filter((d) => d < today);
  t.check("every date the index shows is still in the future",
    past.length === 0,
    `${dates.length} dated rows, ${past.length} already passed: ${past.slice(0, 5).join(", ")}`);
  t.check("and enough rows carry one to be worth printing",
    dates.length >= 10, `${dates.length} of ${tracked.length} have a future milestone`);
}

{
  // The failure this replaces: an empty <ul> served because the marker
  // stopped matching. The injection fails soft in the worker on purpose
  // — a missing index must not take the whole tracker back to its
  // frozen snapshot — so the loud half of that bargain lives here.
  t.check("the index is populated, not an empty shell",
    !/<ul id="countryIndexList"><\/ul>/.test(markup),
    "the marker did not match and the worker served the page without it");
}

// ---- 2. the sitemap -----------------------------------------------------

const sitemap = await (await get("/sitemap.xml")).text();
const locs = [...sitemap.matchAll(/<loc>https:\/\/e-invoicingcompliancecorner\.com([^<]*)<\/loc>/g)]
  .map((m) => m[1]);

t.check("the sitemap is served and well-formed",
  sitemap.startsWith("<?xml") && /<urlset/.test(sitemap) && locs.length > 70,
  `${locs.length} URLs`);

{
  // THE CHECK THAT WOULD HAVE CAUGHT 42 MISSING COUNTRIES. Asked against
  // the router's own source of slugs, so the two cannot drift again.
  const inMap = new Set(locs);
  const absent = tracked.filter((c) => !inMap.has(`/${c.slug}`));
  t.check("every routed country is in the sitemap",
    absent.length === 0,
    `${absent.length} missing: ` + absent.slice(0, 8).map((c) => c.slug).join(", "));

  // And the converse: a sitemap URL the router cannot serve is a 404
  // offered to Google. Country-shaped entries only — the static list
  // holds real files the asset layer serves.
  const known = new Set(tracked.map((c) => `/${c.slug}`));
  const staticish = /\.(html|xml)$|^\/$|^\/(map|sources|insights|methodology|changes)/;
  const orphan = locs.filter((l) => !known.has(l) && !staticish.test(l) && !l.startsWith("/insights/"));
  t.check("and nothing in it is a country the router does not know",
    orphan.length === 0, orphan.join(", "));
}

{
  // Gated pages must never be advertised: all three answer a sign-up
  // wall and emit noindex, so listing them asks Google to index a page
  // that tells it not to.
  const gated = ["/roi-calculator", "/compliance-guides", "/spec-register"];
  const leaked = gated.filter((g) => locs.includes(g));
  t.check("no gated page is advertised in the sitemap", leaked.length === 0, leaked.join(", "));
}

{
  // The two pages the hand-maintained file forgot entirely.
  t.check("the home page and /sources are declared",
    locs.includes("/") && locs.includes("/sources"),
    `/ ${locs.includes("/")}, /sources ${locs.includes("/sources")}`);
  // lastmod comes from each page's own row rather than a typed date.
  const dated = locs.filter((l, i) => /<lastmod>/.test(sitemap.split("<url>")[i + 1] || ""));
  t.check("country entries carry a lastmod from the database",
    /<loc>[^<]*\/germany<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap),
    `${dated.length} entries with lastmod`);
}

// ---- 3. the country pages ----------------------------------------------

{
  // Three countries rather than seventy: this suite runs on every commit
  // and each page is a real render. The structural claim is per-renderer,
  // so three prove it and seventy would only prove it more slowly.
  const sample = ["germany", "poland", "japan"];
  const problems = [];
  for (const slug of sample) {
    const html = await (await get(`/${slug}`)).text();
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    if (!desc) { problems.push(`${slug}: no meta description`); continue; }
    if (desc.length < 50) problems.push(`${slug}: description is ${desc.length} chars`);
    if (desc.length > 200) problems.push(`${slug}: description is ${desc.length} chars, too long to be shown`);
    for (const tag of ["og:title", "og:description", "og:url", "og:site_name", "twitter:card"]) {
      if (!html.includes(`"${tag}"`)) problems.push(`${slug}: no ${tag}`);
    }
    // The og:url must agree with the canonical, or a share and a search
    // result claim two different addresses for one page.
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    const ogUrl = (html.match(/<meta property="og:url" content="([^"]*)"/) || [])[1];
    if (canonical !== ogUrl) problems.push(`${slug}: og:url ${ogUrl} != canonical ${canonical}`);
  }
  t.check("country pages carry a description and social tags",
    problems.length === 0, problems.join("; "));
}

{
  // AND THE DESCRIPTION IS TRANSLATED WITH THE PAGE. It is cut from the
  // COALESCEd mandate_summary, so a German page must not be describing
  // itself in English to a German search result.
  const de = await (await get("/germany?lang=de")).text();
  const en = await (await get("/germany?lang=en")).text();
  const dDe = (de.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const dEn = (en.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  t.check("and it is translated with the page, not left in English",
    dDe.length > 50 && dDe !== dEn, `de: "${dDe.slice(0, 60)}…"`);
  t.check("and og:locale follows the language",
    /content="de_DE"/.test(de) && /content="en_GB"/.test(en));
}

console.log(`  note  ${tracked.length} countries linked from the tracker and listed in `
  + `${locs.length} sitemap URLs`);

process.exit(t.report() ? 0 : 1);
