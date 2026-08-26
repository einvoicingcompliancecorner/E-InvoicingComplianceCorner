// guides-fit-langs.mjs — the one-page rule, in every language.
//
// The existing harness (guides-fit-harness.mjs) prints all seventy
// countries in English and measures them. That was enough while the
// headline strip WAS English in every edition: the German page and the
// English page differed only in prose the fitter had already been
// measured against.
//
// Migration 624 changed that. The five headline notes now exist in de,
// fr and es, and German runs 20-30% longer than English. The fitter does
// not overflow when a note grows -- it shrinks the whole country page
// until it fits -- so the failure mode this guards is not a broken
// layout, it is seventy pages that are quietly harder to read in one
// language than in another.
//
// Run: node tests/lib/guides-fit-langs.mjs [de fr es en]
import { writeFileSync } from "node:fs";
import { openReplayDb } from "./replay-db.mjs";
import { getGuideBundle, renderGuideDocument, GUIDE_STYLE, GUIDE_FIT_SCRIPT } from "../../shared/guides-render.mjs";
import { loadPlaywright, launch } from "./browser.mjs";

const TODAY = "2026-08-23";
const PAGE_PX = 1010;
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ["en", "de", "fr", "es"];

const { d1 } = await openReplayDb();
const { results } = await d1.prepare(
  "SELECT name_en FROM countries WHERE code != 'EU' ORDER BY name_en").bind().all();
const names = results.map((r) => r.name_en);

const { chromium } = await loadPlaywright();
// SHARED launch(), NOT chromium.launch() WITH A PATH. Dan hit this on
// 26 August: "Failed to launch chromium because executable doesn't
// exist at /opt/pw-browsers/chromium". That path is the sandbox this
// project is developed in; on any other machine Playwright's own
// download location is right and the hardcoded one is a crash. The
// helper uses the sandbox binary when it is there, falls back to
// Playwright's when it is not, and turns a missing download into one
// line of instructions instead of a stack trace.
const b = await launch();

const summary = [];
for (const lang of LANGS) {
  const bundle = await getGuideBundle(d1, names, lang);
  const { html } = renderGuideDocument({ bundle, order: names, lang, strings: {},
    today: TODAY, siteOrigin: "https://e-invoicingcompliancecorner.com" });
  const path = `/tmp/all70-${lang}.html`;
  writeFileSync(path, `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${GUIDE_STYLE}</style></head><body>${html}<scr` + `ipt>${GUIDE_FIT_SCRIPT}</scr` + `ipt></body></html>`);

  const p = await b.newPage({ viewport: { width: 1100, height: 1000 } });
  await p.goto(`file://${path}`, { waitUntil: "load" });
  await p.waitForTimeout(8000);
  const m = await p.evaluate((PP) => [...document.querySelectorAll(".country")].map((el) => ({
    n: (el.querySelector("h2") || {}).textContent,
    px: Math.round(el.getBoundingClientRect().height),
    zoom: +(el.style.zoom || 1),
    cards: el.querySelectorAll(".statstrip.hl > .hcard").length,
    facts: el.querySelectorAll(".statstrip.hl .seg").length
         + el.querySelectorAll(".statstrip.hl > .hcard").length - 1,
    pages: +(el.getBoundingClientRect().height / PP).toFixed(2),
  })), PAGE_PX);
  await p.close();

  const over = m.filter((x) => x.pages > 1.0);
  const zoomed = m.filter((x) => x.zoom !== 1);
  // AT THE FLOOR IS NOT THE SAME AS FITTING. GUIDE_FIT_SCRIPT's hard
  // floor is 0.80; a country sitting on it has already shed its
  // newsletter strip and its headline qualifiers and has no headroom
  // left for the next sentence anyone adds. Those are the pages worth
  // naming, because "0 over one page" hides them completely.
  const floored = m.filter((x) => x.zoom <= 0.82);
  // THE SIX FACTS ARE NOT NEGOTIABLE IN ANY LANGUAGE. Same check the
  // English harness makes, repeated per language: a translation long
  // enough to cost a tile would satisfy the one-page rule by breaking
  // what the page is for.
  //
  // Four cards, six facts since 23 August, when e-Reporting was added
  // between the mandate and archiving. It was three and five before, and
  // this check is what turned the change from "looks fine" into a list
  // of seventy countries -- which is the point of counting rather than
  // eyeballing.
  const shortTiles = m.filter((x) => x.cards !== 4 || x.facts !== 6);
  const worstZoom = Math.min(...m.map((x) => x.zoom));
  summary.push({ lang, over: over.length, shortTiles: shortTiles.length,
                 zoomed: zoomed.length, worstZoom,
                 median: m.map((x) => x.pages).sort((a, c) => a - c)[Math.floor(m.length / 2)] });

  console.log(`\n=== ${lang} ===`);
  console.log(`over one page: ${over.length}` +
    (over.length ? " — " + over.sort((a, c) => c.pages - a.pages).slice(0, 10)
      .map((o) => `${o.n} ${o.pages}`).join(", ") : ""));
  console.log(`scaled to fit: ${zoomed.length}/${m.length}` +
    (zoomed.length ? `, smallest ${Math.round(worstZoom * 100)}%` : ""));
  console.log(`at or near the 80% floor: ${floored.length}` +
    (floored.length ? " — " + floored.map((x) => `${x.n} ${Math.round(x.zoom * 100)}%`).join(", ") : ""));
  if (shortTiles.length) {
    console.log("MALFORMED STRIP: " + shortTiles.map((x) => `${x.n} (${x.cards}/${x.facts})`).join(", "));
    process.exitCode = 1;
  }
  if (over.length) process.exitCode = 1;
}
await b.close();

console.log("\n---- one page per country, per language ----");
for (const s of summary) {
  console.log(`${s.lang}: ${s.over} over, ${s.zoomed} scaled` +
    (s.zoomed ? ` (smallest ${Math.round(s.worstZoom * 100)}%)` : "") +
    `, median fill ${(s.median * 100).toFixed(0)}%`);
}
// A LANGUAGE THAT SCALES MUCH HARDER THAN ENGLISH IS THE REGRESSION.
// Nothing is over a page -- the fitter guarantees that -- so the number
// that carries information is how far it had to shrink to get there.
const en = summary.find((s) => s.lang === "en");
if (en) {
  for (const s of summary) {
    if (s.lang === "en") continue;
    if (s.worstZoom < en.worstZoom - 0.08) {
      console.log(`REGRESSION: ${s.lang} shrinks to ${Math.round(s.worstZoom * 100)}% where English stops at ${Math.round(en.worstZoom * 100)}%`);
      process.exitCode = 1;
    }
  }
}
process.exit(process.exitCode || 0);
