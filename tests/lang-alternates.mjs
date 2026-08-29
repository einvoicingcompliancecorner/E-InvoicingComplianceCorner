#!/usr/bin/env node
// lang-alternates.mjs — a URL that claims a language must answer in it.
//
//   node tests/lang-alternates.mjs
//
// WHY THIS EXISTS. On 29 August 2026 an independent review of the German
// site reported the navigation as untranslated and listed eleven items.
// Every one of them was translated. The reviewer had read the HTML
// source rather than the rendered page — i18n.js substitutes strings in
// the browser — and their list matched the source exactly.
//
// Measuring it turned a wrong finding into a right one. The sitemap
// declared `?lang=de` as the German alternate of the tracker and the five
// education pages, and those URLs answered:
//
//     <html lang="en">   canonical -> the ENGLISH url   English body
//
// That is not slow indexing. A canonical pointing at the English page is
// an instruction to fold the German version into it, so the German
// homepage could not be indexed at all — and no amount of improving the
// German would have changed that. Roughly 1,350 already-translated
// strings across the education pages were invisible to every crawler
// that does not execute JavaScript, which is all of the AI crawlers and
// Bing's non-render path.
//
// WHAT THIS ASSERTS, for every URL that makes the claim:
//
//   1. the page announces the language it was asked for
//   2. its canonical points at ITSELF, not at the English original
//   3. its text actually differs from the English
//
// (3) is the one that stops this becoming a formality. Setting an
// attribute is easy; the check has to be able to fail on a page that
// says `lang="de"` over English words, because that is the exact state
// the site was in for the country pages' neighbours.
//
// IT READS THE SITEMAP RATHER THAN A LIST. The promise being tested is
// the one the site makes to search engines, so the population comes from
// the same place the promise does. A page added to SITEMAP_STATIC with a
// language cluster is covered the day it is added.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("language alternates");

const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const { d1 } = await openReplayDb();
const env = {
  eicc_content: d1,
  // THE STUB TRIES `.html`, BECAUSE CLOUDFLARE'S ASSET LAYER DOES.
  // Every URL in the sitemap is extensionless — that is the site's
  // convention and the reason `.html` answers 307 in production — so a
  // stub that only reads the literal path 404s on every static page and
  // reports the whole education section as broken. It is the harness
  // that would be wrong, not the site: Dan's curl against the live
  // domain returns 200 for exactly these URLs.
  //
  // Content-Type is set because the worker decides whether to localise a
  // response by looking at it.
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname.replace(/^\//, "");
      for (const rel of [p, `${p}.html`]) {
        try {
          const body = readFileSync(join(REPO, rel), "utf8");
          const type = rel.endsWith(".json") ? "application/json"
            : rel.endsWith(".html") || !rel.includes(".") ? "text/html; charset=UTF-8"
              : "text/plain";
          return new Response(body, { headers: { "Content-Type": type } });
        } catch { /* try the next form */ }
      }
      return new Response("not found", { status: 404 });
    },
  },
  SESSION_SECRET: "test-secret-not-a-real-one",
  ROI_PUBLIC: "true",
};
const SITE = "https://e-invoicingcompliancecorner.com";
const get = (path) => worker.fetch(new Request(`${SITE}${path}`), env, { waitUntil() {} });

// ---- the population, out of the sitemap ------------------------------
const sitemap = await (await get("/sitemap.xml")).text();
t.check("the sitemap renders, so there is something to read",
  sitemap.includes("<urlset") && sitemap.length > 2000, `${sitemap.length} bytes`);

const entries = [];
for (const block of sitemap.match(/<url>[\s\S]*?<\/url>/g) || []) {
  const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
  const alts = [...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)]
    .map((m) => ({ lang: m[1], href: m[2] }))
    .filter((a) => a.lang !== "x-default" && a.lang !== "en");
  if (loc && alts.length) entries.push({ loc, alts });
}
t.check("URLs in the sitemap declare language alternates",
  entries.length >= 20, `${entries.length} URLs with a cluster`);

// EXHAUSTIVE OVER THE NON-COUNTRY PAGES, SAMPLED OVER THE COUNTRY ONES.
// The country deep dives are 76 URLs x 3 languages and are rendered from
// D1 by one function, so they fail together or not at all; five of them
// is enough to catch that function breaking. The others are each their
// own delivery path — a static asset, an injected shell, a renderer —
// and that is where this class of defect actually lives.
const countryish = new Set((await (await d1.prepare(
  "SELECT slug FROM countries WHERE slug IS NOT NULL").bind().all()).results || [])
  .map((r) => `${SITE}/${r.slug}`));
const others = entries.filter((e) => !countryish.has(e.loc));
const sampled = entries.filter((e) => countryish.has(e.loc)).slice(0, 5);
t.check("the split found both kinds of page",
  others.length >= 10 && sampled.length === 5,
  `${others.length} non-country, ${sampled.length} country sampled`);

const indexAnchors = (html) => {
  const block = (html.match(/<ul id="countryIndexList">([\s\S]*?)<\/ul>/) || [])[1] || "";
  return [...block.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
    .map((m) => ({ href: m[1], text: m[2].trim() }));
};

const text = (html) => html
  .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const problems = [];
let checked = 0;
for (const { loc, alts } of [...others, ...sampled]) {
  const path = loc.replace(SITE, "") || "/";
  const enRes = await get(path);
  const en = enRes.ok ? text(await enRes.text()) : "";
  for (const { lang, href } of alts) {
    const altPath = href.replace(SITE, "");
    const res = await get(altPath);
    checked += 1;
    if (!res.ok) { problems.push(`${altPath}: HTTP ${res.status}`); continue; }
    const html = await res.text();
    const got = (html.match(/<html[^>]*\blang="([^"]+)"/i) || [])[1];
    if (got !== lang) problems.push(`${altPath}: declares lang="${got}", claimed ${lang}`);
    const canonical = (html.match(/rel="canonical"[^>]*href="([^"]+)"/i) || [])[1];
    if (canonical !== href) {
      problems.push(`${altPath}: canonical is ${canonical} — it should point at itself`);
    }
    // AND THE WORDS HAVE TO MOVE. A page can carry the right attribute
    // over the English text; that is what the education pages did.
    if (en && text(html) === en) {
      problems.push(`${altPath}: byte-identical text to the English page`);
    }
  }
}
t.check(`every declared alternate answers in its own language (${checked} checked)`,
  problems.length === 0, problems.slice(0, 8).join(" | ")
    + (problems.length > 8 ? ` … and ${problems.length - 8} more` : ""));
t.check("this check actually fetched the alternates", checked >= 60, `${checked} fetched`);

// ---- the country index, which is the only crawlable country text -----
//
// Before scripts run, the tracker's 77 index anchors are the ONLY place
// a country is named: the board is built from the DATA array at runtime.
// So a German page whose anchors read "Austria" and "Belgium" is a German
// page competing for English search terms, and it is what the Spanish and
// French reviews both described as "country names mixed into the Spanish
// experience".
//
// The hrefs must NOT move with the labels. There is one URL per country
// and it is the English slug; translating those would invent 77 URLs per
// language that nothing serves.
{
  const enIdx = indexAnchors(await (await get("/")).text());
  t.check("the English index has anchors to compare against",
    enIdx.length >= 70, `${enIdx.length} anchors`);
  for (const lang of ["de", "es", "fr"]) {
    const idx = indexAnchors(await (await get(`/?lang=${lang}`)).text());
    t.check(`${lang}: the index has the same number of anchors as English`,
      idx.length === enIdx.length, `${idx.length} vs ${enIdx.length}`);
    const hrefsMatch = idx.map((a) => a.href).sort().join() === enIdx.map((a) => a.href).sort().join();
    t.check(`${lang}: every index href is still the English slug`, hrefsMatch,
      "a translated label moved its URL — there is one URL per country");
    const translated = idx.filter((a, i) => a.text !== enIdx.find((e) => e.href === a.href)?.text);
    t.check(`${lang}: the index labels are in ${lang} (${translated.length} of ${idx.length} differ)`,
      translated.length >= 40,
      "the anchors still read English — this is the only country text a crawler sees");
    // AND SORTED THE WAY THAT LANGUAGE READS. An A-Z list labelled in
    // German but ordered on the English name puts Österreich under A
    // and Deutschland under G, which is not an index.
    const labels = idx.map((a) => a.text);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b, lang));
    t.check(`${lang}: and the index is in ${lang} alphabetical order`,
      labels.join("|") === sorted.join("|"),
      `first divergence: ${labels.find((l, i) => l !== sorted[i]) || "none"}`);
  }
}

// ---- the assumption the server-side substitution rests on -------------
//
// shared/i18n-ssr.mjs matches a [data-i18n] element non-greedily to its
// own closing tag, which is only safe while no such element contains a
// nested element of the SAME name. True across all six pages today.
// Asserted rather than assumed, because the failure mode is a page that
// renders with half a paragraph missing.
{
  const pages = ["einvoicing-compliance-tracker.html",
    "education-certified-providers.html", "education-impact-of-mandate.html",
    "education-mandate-types.html", "education-preparing-for-mandate.html",
    "education-types-of-provider.html"];
  const nested = [];
  let elements = 0;
  for (const rel of pages) {
    const src = readFileSync(join(REPO, rel), "utf8")
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => " ".repeat(m.length));
    for (const m of src.matchAll(/<(\w+)[^>]*\sdata-i18n="[^"]+"[^>]*>([\s\S]*?)<\/\1>/g)) {
      elements += 1;
      if (new RegExp(`<${m[1]}\\b`).test(m[2])) nested.push(`${rel}: <${m[1]}>`);
    }
  }
  t.check("the pages carry translatable markup for this to be about",
    elements >= 400, `${elements} [data-i18n] elements`);
  t.check("no translatable element nests one of its own tag name",
    nested.length === 0, nested.slice(0, 5).join(", "));
}

console.log(`\n  note  ${checked} language alternates fetched across `
  + `${others.length} non-country pages and ${sampled.length} sampled country pages`);

process.exit(t.report() ? 0 : 1);
