// guides-fit-harness.mjs — render every country and measure it against the
// one-page rule. This is how the rule is enforced: the fitter runs in the
// browser, so the only honest check is to print all seventy and count.
// Not wired into run-all yet — the routes it will guard do not exist.
import { writeFileSync } from "node:fs";
import { openReplayDb } from "./replay-db.mjs";
import { getGuideBundle, renderGuideDocument, GUIDE_STYLE, GUIDE_FIT_SCRIPT } from "../../shared/guides-render.mjs";
import { loadPlaywright } from "./browser.mjs";
const TODAY = "2026-08-21";
const { d1 } = await openReplayDb();
const { results } = await d1.prepare("SELECT name_en FROM countries WHERE code != 'EU' ORDER BY name_en").bind().all();
const names = results.map(r => r.name_en);
const bundle = await getGuideBundle(d1, names, "en");
const { html, condensed } = renderGuideDocument({ bundle, order: names, lang: "en", strings: {},
  today: TODAY, siteOrigin: "https://e-invoicingcompliancecorner.com" });
writeFileSync("/tmp/all70.html", `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${GUIDE_STYLE}</style></head><body>${html}<scr`+`ipt>${GUIDE_FIT_SCRIPT}</scr`+`ipt></body></html>`);
const { chromium } = await loadPlaywright();
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1100, height: 1000 } });
await p.goto("file:///tmp/all70.html", { waitUntil: "load" });
await p.waitForTimeout(8000);
console.log("fitted:", await p.evaluate(()=>document.documentElement.getAttribute("data-fitted")));
const PAGE_PX = 1010;
const m = await p.evaluate((PP) => [...document.querySelectorAll(".country")].map(el => ({
  n: (el.querySelector("h2")||{}).textContent, px: Math.round(el.getBoundingClientRect().height),
  zoom: el.style.zoom || "1",
  tiles: el.querySelectorAll(".statstrip.hl > div").length,
  pages: +(el.getBoundingClientRect().height / PP).toFixed(2) })), PAGE_PX);
// THE FIVE TILES ARE NOT NEGOTIABLE, so the harness checks them rather than
// printing them. Dan asked for the same five facts "consistently on each
// country page"; a fitter that shed one to save 8px would satisfy the
// one-page rule by breaking the thing the page is for. The fitter's ladder
// deliberately has no rung that touches them -- this is what proves it.
const shortTiles = m.filter(x => x.tiles !== 5);
console.log(`headline tiles: ${m.length - shortTiles.length}/${m.length} countries show all five`);
if (shortTiles.length) {
  console.log("MISSING TILES: " + shortTiles.map(x => `${x.n} (${x.tiles})`).join(", "));
  process.exitCode = 1;
}
const zoomed = m.filter(x => x.zoom !== "1");
console.log(`scaled to fit: ${zoomed.length} of ${m.length}` + (zoomed.length ? " — " + zoomed.map(x=>`${x.n} ${Math.round(+x.zoom*100)}%`).join(", ") : ""));
await b.close();
const over = m.filter(x => x.pages > 1.0);
console.log(`countries: ${m.length}`);
console.log(`OVER ONE PAGE: ${over.length}`);
for (const o of over.sort((a,b)=>b.pages-a.pages).slice(0,10)) console.log(`   ${o.n} ${o.px}px = ${o.pages}`);
const sorted=[...m].sort((a,b)=>b.px-a.px);
console.log(`tallest that fits: ${sorted.find(x=>x.pages<=1).n} ${sorted.find(x=>x.pages<=1).px}px`);
console.log(`median fill: ${(m.map(x=>x.pages).sort((a,b)=>a-b)[Math.floor(m.length/2)]*100).toFixed(0)}% of a page`);
console.log(`condensed countries: ${condensed.length}; rows capped on ${condensed.filter(c=>c.dropped.includes("factRows")).length}`);
process.exit(0);
